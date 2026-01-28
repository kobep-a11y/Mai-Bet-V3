import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { LiveGame } from '@/types';
import { getActiveStrategies } from '@/lib/strategy-service';
import { evaluateAllStrategies, formatTriggerResult } from '@/lib/trigger-engine';
import {
  signalStore,
  createSignal,
  closeAllSignalsForGame,
  onCloseTriggerFired,
  checkWatchingSignalsForOdds,
} from '@/lib/signal-service';
import { sendSignalAlert, sendBetAvailableAlert, sendGameResultAlert } from '@/lib/discord-service';
import { saveHistoricalGame } from '@/lib/historical-service';

/**
 * Helper to get a value from data with multiple possible field names
 */
function getField(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }
  }
  return undefined;
}

/**
 * Maps N8N/external webhook fields to our LiveGame structure
 */
function mapN8NFields(data: Record<string, unknown>): LiveGame {
  // Debug: Log all field names received (first time only or periodically)
  const fieldNames = Object.keys(data);
  if (Math.random() < 0.05) { // Log ~5% of requests to see field names
    console.log('📥 Webhook fields received:', fieldNames.join(', '));
  }

  const eventId = String(getField(data, 'Event ID', 'event_id', 'EventID', 'eventId', 'id') || '');
  const homeTeam = String(getField(data, 'Home Team', 'home_team', 'HomeTeam', 'homeTeam') || '');
  const awayTeam = String(getField(data, 'Away Team', 'away_team', 'AwayTeam', 'awayTeam') || '');
  const homeTeamId = String(getField(data, 'Home Team ID', 'Home team ID', 'home_team_id', 'homeTeamId') || '');
  const awayTeamId = String(getField(data, 'Away Team ID', 'away_team_id', 'awayTeamId') || '');
  const homeScore = Number(getField(data, 'Home Score ( API )', 'Home Score', 'home_score', 'homeScore', 'HomeScore') || 0);
  const awayScore = Number(getField(data, 'Away Score ( API )', 'Away Score', 'away_score', 'awayScore', 'AwayScore') || 0);

  // Quarter scores
  const q1Home = Number(getField(data, 'Quarter 1 Home', 'Q1 Home', 'q1_home', 'q1Home') || 0);
  const q1Away = Number(getField(data, 'Quarter 1 Away', 'Q1 Away', 'q1_away', 'q1Away') || 0);
  const q2Home = Number(getField(data, 'Quarter 2 Home', 'Q2 Home', 'q2_home', 'q2Home') || 0);
  const q2Away = Number(getField(data, 'Quarter 2 Away', 'Q2 Away', 'q2_away', 'q2Away') || 0);
  const q3Home = Number(getField(data, 'Quarter 3 Home', 'Q3 Home', 'q3_home', 'q3Home') || 0);
  const q3Away = Number(getField(data, 'Quarter 3 Away', 'Q3 Away', 'q3_away', 'q3Away') || 0);
  const q4Home = Number(getField(data, 'Quarter 4 Home', 'Q4 Home', 'q4_home', 'q4Home') || 0);
  const q4Away = Number(getField(data, 'Quarter 4 Away', 'Q4 Away', 'q4_away', 'q4Away') || 0);

  const halftimeHome = Number(getField(data, 'Halftime Score Home', 'Halftime Home', 'halftime_home', 'halftimeHome') || 0);
  const halftimeAway = Number(getField(data, 'Halftime Score Away', 'Halftime Away', 'halftime_away', 'halftimeAway') || 0);
  const finalHome = Number(getField(data, 'Final Home', 'final_home', 'finalHome') || homeScore);
  const finalAway = Number(getField(data, 'Final Away', 'final_away', 'finalAway') || awayScore);

  const quarter = Number(getField(data, 'Quarter', 'quarter', 'Period', 'period') || 1);

  // Time - check for multiple possible field names
  const timeMinutes = Number(getField(data,
    'Time Minutes ( API )', 'Time Minutes', 'time_minutes', 'timeMinutes',
    'Minutes', 'minutes', 'Time_Minutes', 'GameMinutes'
  ) || 0);
  const timeSeconds = Number(getField(data,
    'Time Seconds ( API )', 'Time Seconds', 'time_seconds', 'timeSeconds',
    'Seconds', 'seconds', 'Time_Seconds', 'GameSeconds'
  ) || 0);
  const timeRemaining = `${timeMinutes}:${String(timeSeconds).padStart(2, '0')}`;

  // ODDS - Check many possible field name variations
  const spread = Number(getField(data,
    'Spread', 'spread', 'Home Spread', 'home_spread', 'HomeSpread',
    'Point Spread', 'point_spread', 'Line', 'line', 'Handicap', 'handicap'
  ) ?? -3.5);

  const mlHome = Number(getField(data,
    'ML Home', 'ml_home', 'mlHome', 'Home ML', 'home_ml', 'HomeML',
    'Home Moneyline', 'home_moneyline', 'MoneylineHome'
  ) ?? -150);

  const mlAway = Number(getField(data,
    'ML Away', 'ml_away', 'mlAway', 'Away ML', 'away_ml', 'AwayML',
    'Away Moneyline', 'away_moneyline', 'MoneylineAway'
  ) ?? 130);

  const total = Number(getField(data,
    'Total', 'total', 'Over Under', 'over_under', 'OverUnder', 'O/U', 'ou',
    'Total Points', 'total_points', 'TotalPoints', 'Game Total', 'game_total'
  ) ?? 185.5);

  // Debug: Log odds values if they're using defaults
  if (spread === -3.5 && mlHome === -150 && total === 185.5) {
    console.log('⚠️ Odds using defaults - check field names. Received:',
      Object.entries(data)
        .filter(([k]) => k.toLowerCase().includes('spread') ||
                        k.toLowerCase().includes('ml') ||
                        k.toLowerCase().includes('total') ||
                        k.toLowerCase().includes('line') ||
                        k.toLowerCase().includes('moneyline'))
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') || 'No odds fields found'
    );
  }

  // Determine game status
  let status: LiveGame['status'] = 'live';
  if (quarter === 0) status = 'scheduled';
  else if (quarter === 2 && timeMinutes === 0 && timeSeconds === 0) status = 'halftime';
  else if (quarter >= 4 && timeMinutes === 0 && timeSeconds === 0) status = 'final';
  else if (quarter === 5) status = 'final';

  return {
    id: eventId,
    eventId,
    league: String(getField(data, 'League', 'league') || 'NBA2K'),
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
    finalScores: { home: finalHome, away: finalAway },
    spread,
    mlHome,
    mlAway,
    total,
    lastUpdate: new Date().toISOString(),
    rawData: data,
  };
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
    // GAME FINISHED - Save to historical, calculate results
    // =========================================
    if (game.status === 'final') {
      // Save to historical games
      const saved = await saveHistoricalGame(game);
      historicalSaved = saved !== null;

      // Close all active signals for this game and send result alerts
      const closedCount = await closeAllSignalsForGame(game);

      // TODO: Send result notifications for each closed signal
      // const signals = await getSignalsForGame(game.id);
      // for (const signal of signals.filter(s => s.status === 'bet_taken')) {
      //   await sendGameResultAlert(signal, game);
      //   discordAlertsSent++;
      // }

      console.log(`🏁 Game finished: ${game.awayTeam} @ ${game.homeTeam} - Closed ${closedCount} signals`);
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
    // STEP 1: EVALUATE ENTRY TRIGGERS (Create new signals)
    // =========================================
    const activeSignals = signalStore.getAllActiveSignals();
    const results = evaluateAllStrategies(strategies, game, activeSignals);
    triggersFireCount = results.length;

    for (const result of results) {
      const { trigger, strategy } = result;

      // Handle ENTRY triggers - create new signals
      if (trigger.entryOrClose === 'entry') {
        console.log(`⚡ Entry trigger: ${formatTriggerResult(result)}`);

        const signal = await createSignal(result, strategy);
        if (signal) {
          signalsCreated++;
          // Note: We DON'T send Discord alerts for entry triggers
          // We only alert when bet is actually available (odds align)
        }
      }

      // Handle CLOSE triggers - move signals from monitoring to watching
      if (trigger.entryOrClose === 'close') {
        console.log(`⚡ Close trigger: ${formatTriggerResult(result)}`);

        const success = await onCloseTriggerFired(strategy.id, game.id, game);
        if (success) {
          closeTriggersProcessed++;
        }
      }
    }

    // =========================================
    // STEP 2: CHECK WATCHING SIGNALS FOR ODDS ALIGNMENT
    // =========================================
    const betsTaken = await checkWatchingSignalsForOdds(game, strategies);
    betsAvailable = betsTaken.length;

    // Send Discord alerts for each bet that became available
    for (const signal of betsTaken) {
      const strategy = strategies.find(s => s.id === signal.strategyId);
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
 */
function validateGameData(newGame: LiveGame, existingGame: LiveGame | undefined): {
  isValid: boolean;
  correctedGame: LiveGame;
  corrections: string[];
} {
  if (!existingGame) {
    return { isValid: true, correctedGame: newGame, corrections: [] };
  }

  const corrections: string[] = [];
  const correctedGame = { ...newGame };

  // Scores should never decrease
  if (newGame.homeScore < existingGame.homeScore) {
    correctedGame.homeScore = existingGame.homeScore;
    corrections.push(`Home score cannot decrease (${newGame.homeScore} < ${existingGame.homeScore})`);
  }
  if (newGame.awayScore < existingGame.awayScore) {
    correctedGame.awayScore = existingGame.awayScore;
    corrections.push(`Away score cannot decrease (${newGame.awayScore} < ${existingGame.awayScore})`);
  }

  // Quarter should never decrease (except special cases like halftime)
  if (newGame.quarter < existingGame.quarter && existingGame.quarter !== 0) {
    correctedGame.quarter = existingGame.quarter;
    corrections.push(`Quarter cannot decrease (${newGame.quarter} < ${existingGame.quarter})`);
  }

  // Quarter scores should never decrease
  if (newGame.quarterScores.q1Home < existingGame.quarterScores.q1Home) {
    correctedGame.quarterScores.q1Home = existingGame.quarterScores.q1Home;
    corrections.push('Q1 Home score cannot decrease');
  }
  if (newGame.quarterScores.q1Away < existingGame.quarterScores.q1Away) {
    correctedGame.quarterScores.q1Away = existingGame.quarterScores.q1Away;
    corrections.push('Q1 Away score cannot decrease');
  }
  if (newGame.quarterScores.q2Home < existingGame.quarterScores.q2Home) {
    correctedGame.quarterScores.q2Home = existingGame.quarterScores.q2Home;
    corrections.push('Q2 Home score cannot decrease');
  }
  if (newGame.quarterScores.q2Away < existingGame.quarterScores.q2Away) {
    correctedGame.quarterScores.q2Away = existingGame.quarterScores.q2Away;
    corrections.push('Q2 Away score cannot decrease');
  }
  if (newGame.quarterScores.q3Home < existingGame.quarterScores.q3Home) {
    correctedGame.quarterScores.q3Home = existingGame.quarterScores.q3Home;
    corrections.push('Q3 Home score cannot decrease');
  }
  if (newGame.quarterScores.q3Away < existingGame.quarterScores.q3Away) {
    correctedGame.quarterScores.q3Away = existingGame.quarterScores.q3Away;
    corrections.push('Q3 Away score cannot decrease');
  }
  if (newGame.quarterScores.q4Home < existingGame.quarterScores.q4Home) {
    correctedGame.quarterScores.q4Home = existingGame.quarterScores.q4Home;
    corrections.push('Q4 Home score cannot decrease');
  }
  if (newGame.quarterScores.q4Away < existingGame.quarterScores.q4Away) {
    correctedGame.quarterScores.q4Away = existingGame.quarterScores.q4Away;
    corrections.push('Q4 Away score cannot decrease');
  }

  // Halftime scores should never decrease
  if (newGame.halftimeScores.home < existingGame.halftimeScores.home) {
    correctedGame.halftimeScores.home = existingGame.halftimeScores.home;
    corrections.push('Halftime Home score cannot decrease');
  }
  if (newGame.halftimeScores.away < existingGame.halftimeScores.away) {
    correctedGame.halftimeScores.away = existingGame.halftimeScores.away;
    corrections.push('Halftime Away score cannot decrease');
  }

  // If we're in the same quarter, time should only go down (or stay same)
  if (newGame.quarter === existingGame.quarter && newGame.status === 'live' && existingGame.status === 'live') {
    const parseTime = (t: string) => {
      const [m, s] = t.split(':').map(Number);
      return (m || 0) * 60 + (s || 0);
    };
    const newTimeSeconds = parseTime(newGame.timeRemaining);
    const existingTimeSeconds = parseTime(existingGame.timeRemaining);

    if (newTimeSeconds > existingTimeSeconds) {
      correctedGame.timeRemaining = existingGame.timeRemaining;
      corrections.push(`Time cannot increase in same quarter (${newGame.timeRemaining} > ${existingGame.timeRemaining})`);
    }
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
    const gameData = mapN8NFields(data);

    if (!gameData.id) {
      return NextResponse.json({ success: false, error: 'Missing event_id' }, { status: 400 });
    }

    // Get existing game data and validate
    const existingGame = gameStore.getGame(gameData.id);
    const { correctedGame, corrections } = validateGameData(gameData, existingGame);

    // Update game store with corrected data
    gameStore.updateGame(correctedGame.id, correctedGame);
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

    const results = await Promise.all(
      games.map(async (game) => {
        const gameData = mapN8NFields(game);
        if (!gameData.id) {
          return { success: false, error: 'Missing event_id' };
        }

        // Get existing game data and validate
        const existingGame = gameStore.getGame(gameData.id);
        const { correctedGame, corrections } = validateGameData(gameData, existingGame);

        gameStore.updateGame(correctedGame.id, correctedGame);
        const processResult = await processGameUpdate(correctedGame);

        return {
          id: correctedGame.id,
          success: true,
          ...processResult,
          corrections: corrections.length > 0 ? corrections : undefined,
        };
      })
    );

    const totalTriggers = results.reduce((sum, r) => sum + ('triggersFireCount' in r ? r.triggersFireCount : 0), 0);
    const totalSignals = results.reduce((sum, r) => sum + ('signalsCreated' in r ? r.signalsCreated : 0), 0);
    const totalCloseProcessed = results.reduce((sum, r) => sum + ('closeTriggersProcessed' in r ? r.closeTriggersProcessed : 0), 0);
    const totalBets = results.reduce((sum, r) => sum + ('betsAvailable' in r ? r.betsAvailable : 0), 0);
    const totalAlerts = results.reduce((sum, r) => sum + ('discordAlertsSent' in r ? r.discordAlertsSent : 0), 0);

    return NextResponse.json({
      success: true,
      message: `${results.length} games updated`,
      results,
      summary: {
        gamesUpdated: results.length,
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
 */
export async function GET() {
  const games = gameStore.getAllGames();
  return NextResponse.json({ success: true, count: games.length, games });
}
