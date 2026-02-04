/**
 * ============================================================================
 * GAME UPDATE WEBHOOK - SINGLE UNIFIED ENDPOINT
 * ============================================================================
 *
 * This is the ONLY webhook endpoint needed for game updates.
 *
 * ARCHITECTURE:
 * - One webhook sends ALL data: game info, scores, time, AND odds
 * - No need for separate odds webhooks or game status webhooks
 * - Debouncing prevents duplicate processing (5-second window per Event ID)
 * - Locking prevents race conditions from concurrent requests
 *
 * EXPECTED PAYLOAD FORMAT:
 * {
 *   "Event ID": "11344362",
 *   "Home Team": "NY Knicks (PLAYER_NAME)",
 *   "Away Team": "LA Lakers (PLAYER_NAME)",
 *   "Money Line": [{ "home_od": "1.5", "away_od": "2.8", "ss": "55:42", "time_str": "3 - 06:00" }],
 *   "Spread": [{ "handicap": "-7.5", "home_od": "1.91", "away_od": "1.91", "ss": "55:42" }],
 *   "Total Points": [{ "handicap": "190.5", "over_od": "1.91", "under_od": "1.91" }]
 * }
 *
 * The "ss" field contains score (home:away), "time_str" contains quarter and time.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { LiveGame } from '@/types';
import { getActiveStrategies } from '@/lib/strategy-service';
import { evaluateAllStrategies, formatTriggerResult, passesRules } from '@/lib/trigger-engine';
import {
  signalStore,
  createSignal,
  closeAllSignalsForGame,
  onCloseTriggerFired,
  checkWatchingSignalsForOdds,
} from '@/lib/signal-service';
import { sendBetAvailableAlert, sendGameResultAlert } from '@/lib/discord-service';
import { saveHistoricalGame } from '@/lib/historical-service';
import { evaluateOutcome, formatOutcomeResult } from '@/lib/outcome-service';
import { upsertGame, getActiveGames, getGame as getGameFromDB, deleteGame as deleteGameFromDB } from '@/lib/game-service';
import { cacheTeamNames, getTeamNames, getCachedTeamNames } from '@/lib/team-cache';
import { processGameForPlayerStats, extractPlayerName, getPlayersForGame } from '@/lib/player-service';
import { shouldProcessEvent, startProcessing, finishProcessing, getDebounceStats } from '@/lib/debounce';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Airtable REST API configuration for signal updates
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

import { Signal, WinRequirement } from '@/types';

/**
 * Fetch signals with bet_taken status for a specific game
 * These are the signals that need outcome calculation
 */
async function fetchBetTakenSignalsForGame(gameId: string): Promise<Signal[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Game ID} = '${gameId}', {Status} = 'bet_taken')`);

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Signals?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error fetching bet_taken signals:', response.status);
      return [];
    }

    const data = await response.json();
    const records = data.records || [];

    return records.map((record: { id: string; fields: Record<string, unknown>; createdTime?: string }) => {
      const fields = record.fields;

      // Parse win requirements if stored
      let winRequirements: WinRequirement[] | undefined;
      if (fields['Win Requirements']) {
        try {
          winRequirements = JSON.parse(fields['Win Requirements'] as string);
        } catch {
          // Ignore parse error
        }
      }

      return {
        id: record.id,
        strategyId: Array.isArray(fields['Strategy']) ? (fields['Strategy'] as string[])[0] : '',
        strategyName: (fields['Strategy Name'] as string) || 'Unknown',
        triggerId: (fields['Trigger ID'] as string) || '',
        triggerName: (fields['Trigger Name'] as string) || 'Unknown',
        gameId: (fields['Game ID'] as string) || '',
        eventId: (fields['Event ID'] as string) || '',
        homeTeam: (fields['Home Team'] as string) || '',
        awayTeam: (fields['Away Team'] as string) || '',
        homeScore: (fields['Home Score'] as number) || 0,
        awayScore: (fields['Away Score'] as number) || 0,
        quarter: (fields['Quarter'] as number) || 0,
        timeRemaining: (fields['Time Remaining'] as string) || '',
        entryTime: (fields['Entry Time'] as string) || '',
        entrySpread: fields['Entry Spread'] as number | undefined,
        entryTotal: fields['Entry Total'] as number | undefined,
        actualSpreadAtEntry: fields['Actual Spread At Entry'] as number | undefined,
        leadingTeamAtTrigger: fields['Leading Team At Trigger'] as 'home' | 'away' | undefined,
        leadMarginAtTrigger: fields['Lead Margin At Trigger'] as number | undefined,
        winRequirements,
        status: 'bet_taken' as const,
        createdAt: record.createdTime || '',
      } as Signal;
    });
  } catch (error) {
    console.error('Error fetching bet_taken signals:', error);
    return [];
  }
}

/**
 * Update a signal with its calculated outcome
 */
async function updateSignalOutcome(
  signalId: string,
  game: LiveGame,
  outcome: 'win' | 'loss' | 'push',
  summary: string
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const finalStatus = outcome === 'win' ? 'won' : outcome === 'loss' ? 'lost' : 'pushed';
    const resultEmoji = outcome === 'win' ? '✅' : outcome === 'loss' ? '❌' : '➖';

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Signals/${signalId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Status: finalStatus,
            Result: outcome,
            'Final Home Score': game.finalScores?.home || game.homeScore,
            'Final Away Score': game.finalScores?.away || game.awayScore,
            Notes: `${resultEmoji} ${outcome.toUpperCase()}: ${summary}. Final: ${game.awayScore}-${game.homeScore}`,
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error updating signal outcome:', error);
    return false;
  }
}

/**
 * Helper to get a value from data with multiple possible field names
 * Handles trailing spaces in field names (common in webhook data)
 */
function getField(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    // Check exact match
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }
    // Check with trailing space
    if (data[key + ' '] !== undefined && data[key + ' '] !== null && data[key + ' '] !== '') {
      return data[key + ' '];
    }
  }
  return undefined;
}

/**
 * Convert decimal odds to American odds
 * Decimal 1.5 → American -200, Decimal 2.5 → American +150
 */
function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Parse score string like "51:49" to { home: 51, away: 49 }
 */
function parseScoreString(ss: string): { home: number; away: number } {
  if (!ss || typeof ss !== 'string') return { home: 0, away: 0 };
  const parts = ss.split(':');
  return {
    home: parseInt(parts[0]) || 0,
    away: parseInt(parts[1]) || 0,
  };
}

/**
 * Parse time string like "5 - 01:23" to { quarter: 5, minutes: 1, seconds: 23 }
 * Also handles formats like "Q4 - 02:30" or just "02:30"
 */
function parseTimeString(timeStr: string): { quarter: number; minutes: number; seconds: number } {
  if (!timeStr || typeof timeStr !== 'string') return { quarter: 1, minutes: 12, seconds: 0 };

  // Try format "5 - 01:23" or "Q5 - 01:23"
  const dashMatch = timeStr.match(/[Q]?(\d+)\s*-\s*(\d+):(\d+)/i);
  if (dashMatch) {
    return {
      quarter: parseInt(dashMatch[1]) || 1,
      minutes: parseInt(dashMatch[2]) || 0,
      seconds: parseInt(dashMatch[3]) || 0,
    };
  }

  // Try format "01:23" (just time, assume Q1)
  const timeMatch = timeStr.match(/(\d+):(\d+)/);
  if (timeMatch) {
    return {
      quarter: 1,
      minutes: parseInt(timeMatch[1]) || 0,
      seconds: parseInt(timeMatch[2]) || 0,
    };
  }

  return { quarter: 1, minutes: 12, seconds: 0 };
}

/**
 * Get the first (most recent) entry from an odds array
 */
function getFirstOddsEntry(arr: unknown): Record<string, unknown> | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[0] as Record<string, unknown>;
}

/**
 * Maps N8N/external webhook fields to our LiveGame structure
 *
 * N8N data structure:
 * {
 *   "Event ID": "11339870",
 *   "Home Team": "NY Knicks (HOLLOW)",
 *   "Away Team": "LA Lakers (HOGGY)",
 *   "Money Line": [{ "home_od": "1.303", "away_od": "3.250", "ss": "51:49", "time_str": "5 - 01:23" }, ...],
 *   "Spread ": [{ "handicap": "-10.5", "home_od": "1.833", "away_od": "1.833", "ss": "51:49", ... }],
 *   "Total Points": [{ "handicap": "132.5", "over_od": "1.833", "under_od": "1.833", ... }],
 * }
 */
async function mapN8NFields(data: Record<string, unknown>): Promise<LiveGame> {
  // Debug: Log all field names received periodically
  const fieldNames = Object.keys(data);
  if (Math.random() < 0.1) {
    console.log('📥 Webhook fields received:', fieldNames.join(', '));
  }

  // Basic fields
  const eventId = String(getField(data, 'Event ID', 'event_id', 'EventID', 'eventId', 'id') || '');
  let homeTeam = String(getField(data, 'Home Team', 'home_team', 'HomeTeam', 'homeTeam') || '');
  let awayTeam = String(getField(data, 'Away Team', 'away_team', 'AwayTeam', 'awayTeam') || '');
  let homeTeamId = String(getField(data, 'Home Team ID', 'Home team ID', 'home_team_id', 'homeTeamId') || '');
  let awayTeamId = String(getField(data, 'Away Team ID', 'Away team ID', 'away_team_id', 'awayTeamId') || '');
  const league = String(getField(data, 'League', 'league') || 'NBA2K');

  // If team names are present, cache them for future lookups
  if (eventId && (homeTeam || awayTeam)) {
    cacheTeamNames(eventId, homeTeam, awayTeam, homeTeamId, awayTeamId);
  }

  // If team names are missing, try to look them up
  if (eventId && !homeTeam && !awayTeam) {
    // First check cache (fast, in-memory)
    const cached = getCachedTeamNames(eventId);
    if (cached) {
      homeTeam = cached.homeTeam;
      awayTeam = cached.awayTeam;
      homeTeamId = cached.homeTeamId || homeTeamId;
      awayTeamId = cached.awayTeamId || awayTeamId;
      console.log(`📦 Used cached team names for ${eventId}: ${homeTeam} vs ${awayTeam}`);
    } else {
      // Fall back to database lookup
      const lookedUp = await getTeamNames(eventId);
      if (lookedUp) {
        homeTeam = lookedUp.homeTeam;
        awayTeam = lookedUp.awayTeam;
        homeTeamId = lookedUp.homeTeamId || homeTeamId;
        awayTeamId = lookedUp.awayTeamId || awayTeamId;
        console.log(`📚 Looked up team names for ${eventId}: ${homeTeam} vs ${awayTeam}`);
      } else {
        console.log(`⚠️ No team names found for event ${eventId} - will need status webhook`);
      }
    }
  }

  // Get odds arrays - look for arrays in the data
  const moneyLineArr = getField(data, 'Money Line', 'MoneyLine', 'money_line');
  const spreadArr = getField(data, 'Spread', 'spread', 'Spreads');
  const totalArr = getField(data, 'Total Points', 'TotalPoints', 'total_points', 'Total', 'Totals');

  // Get first entry from each array (most current odds)
  const mlEntry = getFirstOddsEntry(moneyLineArr);
  const spreadEntry = getFirstOddsEntry(spreadArr);
  const totalEntry = getFirstOddsEntry(totalArr);

  // Extract score and time from Money Line entry (or Spread entry as fallback)
  const oddsEntry = mlEntry || spreadEntry || totalEntry;

  let homeScore = 0;
  let awayScore = 0;
  let quarter = 1;
  let timeMinutes = 12;
  let timeSeconds = 0;

  if (oddsEntry) {
    // Parse score from "ss" field: "51:49"
    const scores = parseScoreString(String(oddsEntry.ss || ''));
    homeScore = scores.home;
    awayScore = scores.away;

    // Parse time from "time_str" field: "5 - 01:23"
    const timeData = parseTimeString(String(oddsEntry.time_str || ''));
    quarter = timeData.quarter;
    timeMinutes = timeData.minutes;
    timeSeconds = timeData.seconds;
  }

  // Fallback: Check for direct score/time fields (backwards compatibility)
  if (homeScore === 0 && awayScore === 0) {
    homeScore = Number(getField(data, 'Home Score ( API )', 'Home Score', 'home_score', 'homeScore') || 0);
    awayScore = Number(getField(data, 'Away Score ( API )', 'Away Score', 'away_score', 'awayScore') || 0);
  }
  if (quarter === 1 && timeMinutes === 12) {
    quarter = Number(getField(data, 'Quarter', 'quarter', 'Period', 'period') || 1);
    timeMinutes = Number(getField(data, 'Time Minutes ( API )', 'Time Minutes', 'time_minutes') || 12);
    timeSeconds = Number(getField(data, 'Time Seconds ( API )', 'Time Seconds', 'time_seconds') || 0);
  }

  const timeRemaining = `${timeMinutes}:${String(timeSeconds).padStart(2, '0')}`;

  // Extract odds values - use null when not present (will be preserved from existing data)
  // These sentinel values indicate "no data received" vs actual odds
  let spread: number | null = null;
  let mlHome: number | null = null;
  let mlAway: number | null = null;
  let total: number | null = null;

  // Money Line odds (decimal to American)
  if (mlEntry) {
    const homeOd = parseFloat(String(mlEntry.home_od || '0'));
    const awayOd = parseFloat(String(mlEntry.away_od || '0'));
    if (homeOd > 0) mlHome = decimalToAmerican(homeOd);
    if (awayOd > 0) mlAway = decimalToAmerican(awayOd);
  }

  // Spread from handicap field
  if (spreadEntry && spreadEntry.handicap !== undefined && spreadEntry.handicap !== null) {
    const handicap = parseFloat(String(spreadEntry.handicap));
    // Accept all numeric values including 0 (pick'em lines)
    if (!isNaN(handicap)) {
      spread = handicap;
    }
  }

  // Total from handicap field in Total Points
  if (totalEntry) {
    const totalHandicap = parseFloat(String(totalEntry.handicap || '0'));
    if (totalHandicap > 0) total = totalHandicap;
  }

  // Debug log if we have odds data
  if (mlEntry || spreadEntry || totalEntry) {
    console.log(`📊 Odds parsed: ML Home=${mlHome}, ML Away=${mlAway}, Spread=${spread}, Total=${total}`);
  } else {
    console.log(`⚠️ No odds data in webhook - will preserve existing odds`);
  }

  // Quarter scores (if available directly)
  const q1Home = Number(getField(data, 'Quarter 1 Home', 'Q1 Home', 'q1_home') || 0);
  const q1Away = Number(getField(data, 'Quarter 1 Away', 'Q1 Away', 'q1_away') || 0);
  const q2Home = Number(getField(data, 'Quarter 2 Home', 'Q2 Home', 'q2_home') || 0);
  const q2Away = Number(getField(data, 'Quarter 2 Away', 'Q2 Away', 'q2_away') || 0);
  const q3Home = Number(getField(data, 'Quarter 3 Home', 'Q3 Home', 'q3_home') || 0);
  const q3Away = Number(getField(data, 'Quarter 3 Away', 'Q3 Away', 'q3_away') || 0);

  let halftimeHome = Number(getField(data, 'Halftime Score Home', 'Halftime Home') || 0);
  let halftimeAway = Number(getField(data, 'Halftime Score Away', 'Halftime Away') || 0);

  // Fallback: Calculate halftime from Q1+Q2 if not provided directly and game is past halftime
  if (halftimeHome === 0 && halftimeAway === 0 && quarter >= 3) {
    halftimeHome = q1Home + q2Home;
    halftimeAway = q1Away + q2Away;
  }

  // Get final scores for Q4 calculation
  const finalHome = Number(getField(data, 'Final Home', 'final_home') || homeScore);
  const finalAway = Number(getField(data, 'Final Away', 'final_away') || awayScore);

  // Calculate Q4 from: Final - Halftime - Q3
  // (API doesn't provide Q4 directly, only Q1-Q3 + Halftime + Final)
  // Q4 = Final - (Q1 + Q2 + Q3) or equivalently Final - Halftime - Q3
  let q4Home = Number(getField(data, 'Quarter 4 Home', 'Q4 Home', 'q4_home') || 0);
  let q4Away = Number(getField(data, 'Quarter 4 Away', 'Q4 Away', 'q4_away') || 0);

  // If Q4 not provided and game is in Q4 or final, calculate it
  if (q4Home === 0 && q4Away === 0 && quarter >= 4) {
    // Calculate Q4 = Final - Halftime - Q3
    const calculatedQ4Home = finalHome - halftimeHome - q3Home;
    const calculatedQ4Away = finalAway - halftimeAway - q3Away;

    // Validate calculation - negative values indicate data corruption
    if (calculatedQ4Home < 0 || calculatedQ4Away < 0) {
      console.warn(
        `⚠️ Invalid Q4 calculation for event ${eventId}:`,
        `Q4 Home=${calculatedQ4Home}, Q4 Away=${calculatedQ4Away}`,
        `(Final: ${finalHome}-${finalAway}, Half: ${halftimeHome}-${halftimeAway}, Q3: ${q3Home}-${q3Away})`
      );
    }

    // Use calculated values, clamping to 0 minimum
    q4Home = Math.max(0, calculatedQ4Home);
    q4Away = Math.max(0, calculatedQ4Away);
  }

  // Determine game status
  let status: LiveGame['status'] = 'live';
  if (quarter === 0) status = 'scheduled';
  else if (quarter === 2 && timeMinutes === 0 && timeSeconds === 0) status = 'halftime';
  else if (quarter >= 5) status = 'final'; // 5th period usually means game over for 4-quarter games
  else if (quarter >= 4 && timeMinutes === 0 && timeSeconds === 0) status = 'final';

  return {
    id: eventId,
    eventId,
    league,
    homeTeam,
    awayTeam,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    quarter,
    timeRemaining,
    status,
    quarterScores: { q1Home, q1Away, q2Home, q2Away, q3Home, q3Away, q4Home, q4Away },
    halftimeScores: { home: halftimeHome, away: halftimeAway },
    finalScores: { home: homeScore, away: awayScore },
    // Use null to indicate "preserve existing" - validateGameData will handle defaults
    spread: spread as number,
    mlHome: mlHome as number,
    mlAway: mlAway as number,
    total: total as number,
    // Store whether odds were actually present in this webhook
    _hasOddsData: !!(mlEntry || spreadEntry || totalEntry),
    lastUpdate: new Date().toISOString(),
    rawData: data,
  } as LiveGame;
}

/**
 * Processes a game update: triggers, signals, Discord alerts, historical saves
 *
 * Two-Stage Flow:
 * 1. Entry triggers → Create signal in 'monitoring' (two-stage) or 'watching' (one-stage)
 * 2. Close triggers → Move signal from 'monitoring' to 'watching'
 * 3. Odds check → When watching, check if odds align → 'bet_taken'
 * 4. Game end → Calculate results, send result alerts
 */
async function processGameUpdate(game: LiveGame): Promise<{
  triggersFireCount: number;
  signalsCreated: number;
  closeTriggersProcessed: number;
  betsAvailable: number;
  discordAlertsSent: number;
  historicalSaved: boolean;
}> {
  let triggersFireCount = 0;
  let signalsCreated = 0;
  let closeTriggersProcessed = 0;
  let betsAvailable = 0;
  let discordAlertsSent = 0;
  let historicalSaved = false;

  try {
    // Get active strategies first (needed for all paths)
    const strategies = await getActiveStrategies();

    // =========================================
    // GAME FINISHED - Save to historical, calculate results, then REMOVE from live
    // =========================================
    if (game.status === 'final') {
      // Save to historical games
      const saved = await saveHistoricalGame(game);
      historicalSaved = saved !== null;

      // Process player stats for both teams
      try {
        const homePlayerName = game.homeTeam ? extractPlayerName(game.homeTeam) : null;
        const awayPlayerName = game.awayTeam ? extractPlayerName(game.awayTeam) : null;

        if (homePlayerName || awayPlayerName) {
          // Convert LiveGame to format expected by processGameForPlayerStats
          const homeScore = game.finalScores?.home || game.homeScore;
          const awayScore = game.finalScores?.away || game.awayScore;
          const winner = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'tie';

          // Calculate spread and total results
          const spread = game.spread || -3.5;
          const total = game.total || 185.5;
          const scoreDiff = homeScore - awayScore;
          const totalPoints = homeScore + awayScore;

          let spreadResult: 'home_cover' | 'away_cover' | 'push' = 'push';
          if (scoreDiff > -spread) spreadResult = 'home_cover';
          else if (scoreDiff < -spread) spreadResult = 'away_cover';

          let totalResult: 'over' | 'under' | 'push' = 'push';
          if (totalPoints > total) totalResult = 'over';
          else if (totalPoints < total) totalResult = 'under';

          const gameData = {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            winner,
            finalHomeScore: homeScore,
            finalAwayScore: awayScore,
            spreadResult,
            totalResult,
            gameDate: new Date().toISOString().split('T')[0],
          };

          await processGameForPlayerStats(gameData as Parameters<typeof processGameForPlayerStats>[0]);
          console.log(`📊 Updated player stats: ${homePlayerName} vs ${awayPlayerName}`);
        }
      } catch (err) {
        console.error('Error processing player stats:', err);
      }

      // Calculate outcomes for bet_taken signals and send result alerts
      let outcomesCalculated = 0;
      try {
        // Fetch signals that have bet_taken status for this game
        const betTakenSignals = await fetchBetTakenSignalsForGame(game.id);

        for (const signal of betTakenSignals) {
          const strategy = strategies.find((s) => s.id === signal.strategyId);

          // Evaluate outcome using win requirements
          const outcomeResult = evaluateOutcome(signal, game, strategy);

          console.log(formatOutcomeResult(signal, outcomeResult));

          // Update signal in Airtable
          await updateSignalOutcome(signal.id, game, outcomeResult.outcome, outcomeResult.summary);
          outcomesCalculated++;

          // Send Discord notification
          if (strategy) {
            const alertCount = await sendGameResultAlert(signal, strategy, game, outcomeResult.outcome);
            discordAlertsSent += alertCount;
          }
        }
      } catch (err) {
        console.error('Error calculating outcomes:', err);
      }

      // Close all remaining active signals for this game (expire any still monitoring/watching)
      const closedCount = await closeAllSignalsForGame(game);

      // REMOVE from live games - final games belong in Historical Games only
      // 1. Remove from in-memory store
      gameStore.removeGame(game.id);
      // 2. Remove from Airtable Active Games table (sync - wait for deletion to confirm cleanup)
      try {
        const deleted = await deleteGameFromDB(game.eventId);
        if (deleted) {
          console.log(`🗑️ Removed game ${game.eventId} from Active Games table`);
        }
      } catch (err) {
        console.error('Error deleting game from Airtable:', err);
      }

      console.log(`🏁 Game finished & removed: ${game.awayTeam} @ ${game.homeTeam} - Closed ${closedCount} signals, Historical: ${historicalSaved}`);

      return { triggersFireCount, signalsCreated, closeTriggersProcessed, betsAvailable, discordAlertsSent, historicalSaved };
    }

    // =========================================
    // GAME NOT LIVE - Skip processing
    // =========================================
    if (game.status !== 'live' && game.status !== 'halftime') {
      return { triggersFireCount, signalsCreated, closeTriggersProcessed, betsAvailable, discordAlertsSent, historicalSaved };
    }

    if (strategies.length === 0) {
      return { triggersFireCount, signalsCreated, closeTriggersProcessed, betsAvailable, discordAlertsSent, historicalSaved };
    }

    // =========================================
    // FETCH PLAYER STATS FOR HEAD-TO-HEAD CONDITIONS (V2 port)
    // =========================================
    let playerStats: { homePlayer: import('@/types').Player | null; awayPlayer: import('@/types').Player | null } | undefined;
    if (game.homeTeam && game.awayTeam) {
      try {
        playerStats = await getPlayersForGame(game.homeTeam, game.awayTeam);
        if (playerStats.homePlayer || playerStats.awayPlayer) {
          console.log(`📊 Player stats loaded: ${playerStats.homePlayer?.name || 'N/A'} (${playerStats.homePlayer?.winRate?.toFixed(1) || 'N/A'}% win) vs ${playerStats.awayPlayer?.name || 'N/A'} (${playerStats.awayPlayer?.winRate?.toFixed(1) || 'N/A'}% win)`);
        }
      } catch (err) {
        console.error('Error fetching player stats:', err);
      }
    }

    // =========================================
    // STEP 0: FILTER STRATEGIES BY RULES
    // =========================================
    // Check rules for each strategy and filter out those that don't pass
    const strategiesPassingRules = strategies.filter(strategy => {
      const rulesCheck = passesRules(strategy.rules, game);
      if (!rulesCheck.passed) {
        console.log(`🚫 Strategy "${strategy.name}" blocked by rule: ${rulesCheck.reason}`);
        return false;
      }
      return true;
    });

    if (strategiesPassingRules.length < strategies.length) {
      console.log(`📋 Rules filtered ${strategies.length - strategiesPassingRules.length} strategies (${strategiesPassingRules.length} remaining)`);
    }

    // =========================================
    // STEP 1: EVALUATE ENTRY TRIGGERS (Create new signals)
    // =========================================
    const activeSignals = signalStore.getAllActiveSignals();
    const results = evaluateAllStrategies(strategiesPassingRules, game, activeSignals, playerStats);
    triggersFireCount = results.length;

    for (const result of results) {
      const { trigger, strategy } = result;

      // Handle ENTRY triggers - create new signals
      if (trigger.entryOrClose === 'entry') {
        console.log(`⚡ Entry trigger: ${formatTriggerResult(result)}`);

        const signal = await createSignal(result, strategy);
        if (signal) {
          signalsCreated++;
        }
      }

      // Handle CLOSE triggers - move signals from monitoring to watching
      if (trigger.entryOrClose === 'close') {
        console.log(`⚡ Close trigger: ${formatTriggerResult(result)}`);

        // Pass trigger info for snapshot creation
        const success = await onCloseTriggerFired(strategy.id, game.id, game, {
          id: trigger.id,
          name: trigger.name,
        });
        if (success) {
          closeTriggersProcessed++;
        }
      }
    }

    // =========================================
    // STEP 2: CHECK WATCHING SIGNALS FOR ODDS ALIGNMENT
    // =========================================
    const betsTaken = await checkWatchingSignalsForOdds(game, strategiesPassingRules);
    betsAvailable = betsTaken.length;

    // Send Discord alerts for each bet that became available
    for (const signal of betsTaken) {
      const strategy = strategiesPassingRules.find(s => s.id === signal.strategyId);
      if (strategy) {
        const alertsSent = await sendBetAvailableAlert(signal, strategy, game);
        discordAlertsSent += alertsSent;
      }
    }

  } catch (error) {
    console.error('Error processing game update:', error);
  }

  return { triggersFireCount, signalsCreated, closeTriggersProcessed, betsAvailable, discordAlertsSent, historicalSaved };
}

/**
 * Validates game data against existing data to prevent backwards movement
 * Scores, quarters, and time should never go backwards
 * Also preserves constant data (team names) from existing records
 */
function validateGameData(newGame: LiveGame, existingGame: LiveGame | undefined): {
  isValid: boolean;
  correctedGame: LiveGame;
  corrections: string[];
} {
  // For brand new games, apply defaults for missing odds
  if (!existingGame) {
    const correctedGame = { ...newGame };
    const hasOddsData = (newGame as LiveGame & { _hasOddsData?: boolean })._hasOddsData;

    // Apply defaults for null odds on new games
    if (!hasOddsData || correctedGame.spread === null || correctedGame.spread === undefined) {
      correctedGame.spread = -3.5;
    }
    if (!hasOddsData || correctedGame.mlHome === null || correctedGame.mlHome === undefined) {
      correctedGame.mlHome = -150;
    }
    if (!hasOddsData || correctedGame.mlAway === null || correctedGame.mlAway === undefined) {
      correctedGame.mlAway = 130;
    }
    if (!hasOddsData || correctedGame.total === null || correctedGame.total === undefined) {
      correctedGame.total = 185.5;
    }

    return { isValid: true, correctedGame, corrections: [] };
  }

  const corrections: string[] = [];
  const correctedGame = { ...newGame };

  // PRESERVE CONSTANT DATA: Use existing team names if new data is empty
  // This ensures team/player info persists even when webhook only sends odds
  if (!newGame.homeTeam && existingGame.homeTeam) {
    correctedGame.homeTeam = existingGame.homeTeam;
  }
  if (!newGame.awayTeam && existingGame.awayTeam) {
    correctedGame.awayTeam = existingGame.awayTeam;
  }
  if (!newGame.homeTeamId && existingGame.homeTeamId) {
    correctedGame.homeTeamId = existingGame.homeTeamId;
  }
  if (!newGame.awayTeamId && existingGame.awayTeamId) {
    correctedGame.awayTeamId = existingGame.awayTeamId;
  }
  if (!newGame.league && existingGame.league) {
    correctedGame.league = existingGame.league;
  }

  // PRESERVE ODDS DATA: If webhook didn't include odds, keep existing odds
  // This prevents default odds from flashing in and potentially false-triggering strategies
  const hasOddsData = (newGame as LiveGame & { _hasOddsData?: boolean })._hasOddsData;

  if (!hasOddsData) {
    // No odds in this webhook - preserve all existing odds
    if (existingGame.spread !== undefined && existingGame.spread !== null) {
      correctedGame.spread = existingGame.spread;
    } else {
      correctedGame.spread = -3.5; // Default only for brand new games
    }
    if (existingGame.mlHome !== undefined && existingGame.mlHome !== null) {
      correctedGame.mlHome = existingGame.mlHome;
    } else {
      correctedGame.mlHome = -150;
    }
    if (existingGame.mlAway !== undefined && existingGame.mlAway !== null) {
      correctedGame.mlAway = existingGame.mlAway;
    } else {
      correctedGame.mlAway = 130;
    }
    if (existingGame.total !== undefined && existingGame.total !== null) {
      correctedGame.total = existingGame.total;
    } else {
      correctedGame.total = 185.5;
    }
    console.log(`📊 Preserving existing odds for ${newGame.id}: Spread=${correctedGame.spread}, ML=${correctedGame.mlHome}/${correctedGame.mlAway}, Total=${correctedGame.total}`);
  } else {
    // Odds were in webhook but might be null for individual fields
    // Preserve existing odds for any null values
    if (newGame.spread === null || newGame.spread === undefined) {
      correctedGame.spread = existingGame.spread ?? -3.5;
    }
    if (newGame.mlHome === null || newGame.mlHome === undefined) {
      correctedGame.mlHome = existingGame.mlHome ?? -150;
    }
    if (newGame.mlAway === null || newGame.mlAway === undefined) {
      correctedGame.mlAway = existingGame.mlAway ?? 130;
    }
    if (newGame.total === null || newGame.total === undefined) {
      correctedGame.total = existingGame.total ?? 185.5;
    }
  }

  // Scores should never decrease
  if (newGame.homeScore < existingGame.homeScore) {
    correctedGame.homeScore = existingGame.homeScore;
    corrections.push(`Home score cannot decrease (${newGame.homeScore} < ${existingGame.homeScore})`);
  }
  if (newGame.awayScore < existingGame.awayScore) {
    correctedGame.awayScore = existingGame.awayScore;
    corrections.push(`Away score cannot decrease (${newGame.awayScore} < ${existingGame.awayScore})`);
  }

  // STATUS CANNOT REGRESS: Once a game is 'final', it stays final
  // This prevents the flapping issue where games go back to 'live' after ending
  if (existingGame.status === 'final') {
    correctedGame.status = 'final';
    correctedGame.quarter = existingGame.quarter;
    correctedGame.timeRemaining = existingGame.timeRemaining;
    if (newGame.status !== 'final') {
      corrections.push(`Status cannot regress from final (attempted: ${newGame.status})`);
    }
    // Return early - no further validation needed for final games
    return { isValid: corrections.length === 0, correctedGame, corrections };
  }

  // Quarter should never decrease (except special cases like halftime)
  if (newGame.quarter < existingGame.quarter && existingGame.quarter !== 0) {
    correctedGame.quarter = existingGame.quarter;
    corrections.push(`Quarter cannot decrease (${newGame.quarter} < ${existingGame.quarter})`);
  }

  // Quarter scores should never decrease
  if (newGame.quarterScores.q1Home < existingGame.quarterScores.q1Home) {
    correctedGame.quarterScores.q1Home = existingGame.quarterScores.q1Home;
  }
  if (newGame.quarterScores.q1Away < existingGame.quarterScores.q1Away) {
    correctedGame.quarterScores.q1Away = existingGame.quarterScores.q1Away;
  }
  if (newGame.quarterScores.q2Home < existingGame.quarterScores.q2Home) {
    correctedGame.quarterScores.q2Home = existingGame.quarterScores.q2Home;
  }
  if (newGame.quarterScores.q2Away < existingGame.quarterScores.q2Away) {
    correctedGame.quarterScores.q2Away = existingGame.quarterScores.q2Away;
  }
  if (newGame.quarterScores.q3Home < existingGame.quarterScores.q3Home) {
    correctedGame.quarterScores.q3Home = existingGame.quarterScores.q3Home;
  }
  if (newGame.quarterScores.q3Away < existingGame.quarterScores.q3Away) {
    correctedGame.quarterScores.q3Away = existingGame.quarterScores.q3Away;
  }
  if (newGame.quarterScores.q4Home < existingGame.quarterScores.q4Home) {
    correctedGame.quarterScores.q4Home = existingGame.quarterScores.q4Home;
  }
  if (newGame.quarterScores.q4Away < existingGame.quarterScores.q4Away) {
    correctedGame.quarterScores.q4Away = existingGame.quarterScores.q4Away;
  }

  // Halftime scores should never decrease
  if (newGame.halftimeScores.home < existingGame.halftimeScores.home) {
    correctedGame.halftimeScores.home = existingGame.halftimeScores.home;
  }
  if (newGame.halftimeScores.away < existingGame.halftimeScores.away) {
    correctedGame.halftimeScores.away = existingGame.halftimeScores.away;
  }

  // Time validation - prevent time from jumping backwards
  const parseTime = (t: string) => {
    const [m, s] = t.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
  };
  const newTimeSeconds = parseTime(newGame.timeRemaining);
  const existingTimeSeconds = parseTime(existingGame.timeRemaining);

  // Calculate total game progress (higher quarter + lower time = more progress)
  // Q4 0:00 is max progress (4 * 720 + 720 = 3600), Q1 12:00 is min progress (1 * 720 + 0 = 720)
  const calcProgress = (quarter: number, timeSeconds: number) => {
    return quarter * 720 + (720 - timeSeconds); // Higher = more game progress
  };
  const newProgress = calcProgress(newGame.quarter, newTimeSeconds);
  const existingProgress = calcProgress(existingGame.quarter, existingTimeSeconds);

  // Game progress should never decrease (time/quarter cannot go backwards)
  if (newProgress < existingProgress) {
    // Keep the existing (more advanced) game state
    correctedGame.quarter = existingGame.quarter;
    correctedGame.timeRemaining = existingGame.timeRemaining;
    corrections.push(`Game progress cannot reverse (Q${newGame.quarter} ${newGame.timeRemaining} < Q${existingGame.quarter} ${existingGame.timeRemaining})`);
  }

  if (corrections.length > 0) {
    console.log(`⚠️ Data validation corrections for game ${newGame.id}:`, corrections);
  }

  return {
    isValid: corrections.length === 0,
    correctedGame,
    corrections,
  };
}

/**
 * POST - Single game update
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const gameData = await mapN8NFields(data);

    if (!gameData.id) {
      return NextResponse.json({ success: false, error: 'Missing event_id' }, { status: 400 });
    }

    // DEBOUNCE: Check if we should process this event
    const debounceResult = shouldProcessEvent(gameData.id);
    if (!debounceResult.shouldProcess) {
      console.log(`⏸️ Debounced webhook for ${gameData.id}: ${debounceResult.reason}`);
      return NextResponse.json({
        success: true,
        message: 'Debounced - duplicate webhook within time window',
        gameId: gameData.id,
        debounced: true,
        reason: debounceResult.reason,
      });
    }

    // LOCK: Prevent concurrent processing of same event
    if (!startProcessing(gameData.id)) {
      console.log(`🔒 Blocked concurrent processing for ${gameData.id}`);
      return NextResponse.json({
        success: true,
        message: 'Already processing this event',
        gameId: gameData.id,
        blocked: true,
      });
    }

    try {
      // Get existing game data and validate (check memory first, then DB)
      let existingGame = gameStore.getGame(gameData.id);
      if (!existingGame) {
        existingGame = await getGameFromDB(gameData.id) || undefined;
      }
      const { correctedGame, corrections } = validateGameData(gameData, existingGame);

      // Update both in-memory store AND Airtable for persistence
      gameStore.updateGame(correctedGame.id, correctedGame);

      // Save to Airtable - AWAIT to prevent race conditions
      try {
        await upsertGame(correctedGame);
      } catch (err) {
        console.error('Airtable upsert error:', err);
      }

      console.log(`Game updated: ${correctedGame.id} - ${correctedGame.homeTeam} vs ${correctedGame.awayTeam} (Q${correctedGame.quarter} ${correctedGame.timeRemaining})${corrections.length > 0 ? ' [CORRECTED]' : ''}`);

      // Process triggers, signals, alerts
      const processResult = await processGameUpdate(correctedGame);

      return NextResponse.json({
        success: true,
        message: 'Game updated',
        gameId: correctedGame.id,
        game: correctedGame,
        processing: processResult,
        corrections: corrections.length > 0 ? corrections : undefined,
      });
    } finally {
      // Always release lock
      finishProcessing(gameData.id);
    }
  } catch (error) {
    console.error('Error in POST game-update:', error);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * PUT - Batch game update
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const games = Array.isArray(data) ? data : [data];

    // Process sequentially to prevent race conditions
    const results = [];
    for (const game of games) {
      const gameData = await mapN8NFields(game);
      if (!gameData.id) {
        results.push({ success: false, error: 'Missing event_id' });
        continue;
      }

      // DEBOUNCE: Check if we should process this event
      const debounceResult = shouldProcessEvent(gameData.id);
      if (!debounceResult.shouldProcess) {
        results.push({
          id: gameData.id,
          success: true,
          debounced: true,
          reason: debounceResult.reason,
        });
        continue;
      }

      // LOCK: Prevent concurrent processing
      if (!startProcessing(gameData.id)) {
        results.push({
          id: gameData.id,
          success: true,
          blocked: true,
        });
        continue;
      }

      try {
        // Get existing game data and validate (check memory first, then DB)
        let existingGame = gameStore.getGame(gameData.id);
        if (!existingGame) {
          existingGame = await getGameFromDB(gameData.id) || undefined;
        }
        const { correctedGame, corrections } = validateGameData(gameData, existingGame);

        gameStore.updateGame(correctedGame.id, correctedGame);

        // Save to Airtable - AWAIT to prevent race conditions
        try {
          await upsertGame(correctedGame);
        } catch (err) {
          console.error('Airtable upsert error:', err);
        }

        const processResult = await processGameUpdate(correctedGame);

        results.push({
          id: correctedGame.id,
          success: true,
          ...processResult,
          corrections: corrections.length > 0 ? corrections : undefined,
        });
      } finally {
        finishProcessing(gameData.id);
      }
    }

    const totalTriggers = results.reduce((sum, r) => sum + ('triggersFireCount' in r ? r.triggersFireCount : 0), 0);
    const totalSignals = results.reduce((sum, r) => sum + ('signalsCreated' in r ? r.signalsCreated : 0), 0);
    const totalCloseProcessed = results.reduce((sum, r) => sum + ('closeTriggersProcessed' in r ? r.closeTriggersProcessed : 0), 0);
    const totalBets = results.reduce((sum, r) => sum + ('betsAvailable' in r ? r.betsAvailable : 0), 0);
    const totalAlerts = results.reduce((sum, r) => sum + ('discordAlertsSent' in r ? r.discordAlertsSent : 0), 0);
    const debounced = results.filter(r => 'debounced' in r && r.debounced).length;
    const blocked = results.filter(r => 'blocked' in r && r.blocked).length;

    return NextResponse.json({
      success: true,
      message: `${results.length} games processed (${debounced} debounced, ${blocked} blocked)`,
      results,
      summary: {
        gamesProcessed: results.length,
        gamesDebounced: debounced,
        gamesBlocked: blocked,
        triggersFireCount: totalTriggers,
        signalsCreated: totalSignals,
        closeTriggersProcessed: totalCloseProcessed,
        betsAvailable: totalBets,
        discordAlertsSent: totalAlerts,
      },
    });
  } catch (error) {
    console.error('Error in PUT game-update:', error);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * GET - Get all current games
 * Falls back to Airtable if in-memory store is empty (serverless cold start)
 */
export async function GET() {
  let games = gameStore.getAllGames();

  // If in-memory store is empty, fetch from Airtable (persistent storage)
  if (games.length === 0) {
    console.log('📂 In-memory store empty, fetching from Airtable...');
    const dbGames = await getActiveGames();
    // Populate in-memory store with DB games
    dbGames.forEach(game => gameStore.updateGame(game.id, game));
    games = dbGames;
  }

  // Include debounce stats for debugging
  const debounceStats = getDebounceStats();

  return NextResponse.json({
    success: true,
    count: games.length,
    games,
    debounceStats,
  });
}
