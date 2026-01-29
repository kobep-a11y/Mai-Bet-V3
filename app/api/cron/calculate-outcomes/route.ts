/**
 * ============================================================================
 * CALCULATE OUTCOMES CRON ENDPOINT
 * ============================================================================
 *
 * This endpoint calculates outcomes for signals from finished games.
 * It uses the WinRequirement system to determine win/loss/push.
 *
 * Workflow:
 * 1. Fetch all signals with status 'bet_taken' (awaiting result)
 * 2. For each signal, get the corresponding game's final state
 * 3. Evaluate win requirements to determine outcome
 * 4. Update signal status in Airtable
 * 5. Optionally update bankroll
 *
 * Can be called by:
 * - Cron job (scheduled)
 * - Manual trigger via POST with specific gameId
 * - Admin endpoint for batch processing
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { Signal, LiveGame, Strategy, WinRequirement } from '@/types';
import { getActiveStrategies, fetchStrategies } from '@/lib/strategy-service';
import { evaluateOutcome, OutcomeEvaluationResult, formatOutcomeResult } from '@/lib/outcome-service';
import { sendGameResultAlert } from '@/lib/discord-service';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Parse a Signal from Airtable record
 */
function parseSignalFromRecord(record: AirtableRecord): Signal {
  const fields = record.fields;

  // Parse win requirements if stored
  let winRequirements: WinRequirement[] | undefined;
  if (fields['Win Requirements']) {
    try {
      winRequirements = JSON.parse(fields['Win Requirements'] as string);
    } catch {
      console.warn(`Failed to parse win requirements for signal ${record.id}`);
    }
  }

  return {
    id: record.id,
    strategyId: Array.isArray(fields['Strategy'])
      ? (fields['Strategy'] as string[])[0]
      : '',
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
    entryTriggerTime: fields['Entry Trigger Time'] as string | undefined,
    closeTriggerTime: fields['Close Trigger Time'] as string | undefined,
    oddsAlignedTime: fields['Odds Aligned Time'] as string | undefined,
    entrySpread: fields['Entry Spread'] as number | undefined,
    entryTotal: fields['Entry Total'] as number | undefined,
    requiredSpread: fields['Required Spread'] as number | undefined,
    actualSpreadAtEntry: fields['Actual Spread At Entry'] as number | undefined,
    leadingTeamAtTrigger: fields['Leading Team At Trigger'] as
      | 'home'
      | 'away'
      | undefined,
    leadingTeamSpreadAtEntry: fields['Leading Team Spread'] as
      | number
      | undefined,
    leadMarginAtTrigger: fields['Lead Margin At Trigger'] as number | undefined,
    winRequirements,
    finalHomeScore: fields['Final Home Score'] as number | undefined,
    finalAwayScore: fields['Final Away Score'] as number | undefined,
    status: (fields['Status'] as Signal['status']) || 'bet_taken',
    result: fields['Result'] as 'win' | 'loss' | 'push' | undefined,
    createdAt: record.createdTime || '',
  };
}

/**
 * Fetch signals that need outcome calculation
 * Status = 'bet_taken' means they were valid bets but don't have results yet
 */
async function getSignalsNeedingOutcomes(gameId?: string): Promise<Signal[]> {
  try {
    const params = new URLSearchParams();

    // Build filter formula
    let filter = "{Status} = 'bet_taken'";
    if (gameId) {
      filter = `AND({Status} = 'bet_taken', {Game ID} = '${gameId}')`;
    }
    params.append('filterByFormula', filter);

    const response = await airtableRequest('Signals', `?${params.toString()}`);

    if (!response.ok) {
      console.error('Error fetching signals:', response.status);
      return [];
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    return records.map(parseSignalFromRecord);
  } catch (error) {
    console.error('Error fetching signals needing outcomes:', error);
    return [];
  }
}

/**
 * Fetch the final game state from Historical Games table
 */
async function getHistoricalGame(gameId: string): Promise<LiveGame | null> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Name} = '${gameId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(
      'Historical Games',
      `?${params.toString()}`
    );

    if (!response.ok) {
      console.error('Error fetching historical game:', response.status);
      return null;
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return null;
    }

    const fields = records[0].fields;

    // Convert historical game record to LiveGame format for outcome evaluation
    return {
      id: (fields['Name'] as string) || gameId,
      eventId: (fields['Name'] as string) || gameId,
      league: 'NBA2K',
      homeTeam: (fields['Home Team'] as string) || '',
      awayTeam: (fields['Away Team'] as string) || '',
      homeTeamId: (fields['Home Team ID'] as string) || '',
      awayTeamId: (fields['Away Team ID'] as string) || '',
      homeScore: (fields['Home Score'] as number) || 0,
      awayScore: (fields['Away Score'] as number) || 0,
      quarter: 4,
      timeRemaining: '0:00',
      status: 'final',
      quarterScores: {
        q1Home: (fields['Q1 Home'] as number) || 0,
        q1Away: (fields['Q1 Away'] as number) || 0,
        q2Home: (fields['Q2 Home'] as number) || 0,
        q2Away: (fields['Q2 Away'] as number) || 0,
        q3Home: (fields['Q3 Home'] as number) || 0,
        q3Away: (fields['Q3 Away'] as number) || 0,
        q4Home: (fields['Q4 Home'] as number) || 0,
        q4Away: (fields['Q4 Away'] as number) || 0,
      },
      halftimeScores: {
        home: (fields['Halftime Home'] as number) || 0,
        away: (fields['Halftime Away'] as number) || 0,
      },
      finalScores: {
        home: (fields['Home Score'] as number) || 0,
        away: (fields['Away Score'] as number) || 0,
      },
      spread: (fields['Spread'] as number) || 0,
      mlHome: 0,
      mlAway: 0,
      total: (fields['Total'] as number) || 0,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching historical game:', error);
    return null;
  }
}

/**
 * Update signal with calculated outcome
 */
async function updateSignalOutcome(
  signalId: string,
  game: LiveGame,
  result: OutcomeEvaluationResult
): Promise<boolean> {
  try {
    const finalStatus =
      result.outcome === 'win'
        ? 'won'
        : result.outcome === 'loss'
          ? 'lost'
          : 'pushed';

    const response = await airtableRequest('Signals', `/${signalId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          Status: finalStatus,
          Result: result.outcome,
          'Final Home Score': game.finalScores?.home || game.homeScore,
          'Final Away Score': game.finalScores?.away || game.awayScore,
          Notes: `${result.outcome.toUpperCase()}: ${result.summary}. Final: ${game.awayScore}-${game.homeScore}`,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating signal outcome:', error);
    return false;
  }
}

/**
 * Process outcomes for all signals from a specific game
 */
async function processGameOutcomes(
  gameId: string,
  strategies: Map<string, Strategy>
): Promise<{
  signalsProcessed: number;
  wins: number;
  losses: number;
  pushes: number;
  alertsSent: number;
  errors: number;
}> {
  const result = {
    signalsProcessed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    alertsSent: 0,
    errors: 0,
  };

  // Get the final game state
  const game = await getHistoricalGame(gameId);
  if (!game) {
    console.log(`Game ${gameId} not found in Historical Games`);
    return result;
  }

  // Get signals for this game
  const signals = await getSignalsNeedingOutcomes(gameId);
  if (signals.length === 0) {
    console.log(`No signals needing outcomes for game ${gameId}`);
    return result;
  }

  console.log(
    `📊 Processing ${signals.length} signals for game ${gameId} (${game.awayTeam} @ ${game.homeTeam})`
  );

  for (const signal of signals) {
    const strategy = strategies.get(signal.strategyId);

    // Evaluate outcome using win requirements
    const outcomeResult = evaluateOutcome(signal, game, strategy);

    // Update signal in Airtable
    const updated = await updateSignalOutcome(signal.id, game, outcomeResult);

    if (updated) {
      result.signalsProcessed++;

      if (outcomeResult.outcome === 'win') result.wins++;
      else if (outcomeResult.outcome === 'loss') result.losses++;
      else result.pushes++;

      console.log(formatOutcomeResult(signal, outcomeResult));

      // Send Discord notification
      if (strategy) {
        try {
          const alertCount = await sendGameResultAlert(
            signal,
            strategy,
            game,
            outcomeResult.outcome
          );
          result.alertsSent += alertCount;
        } catch (error) {
          console.error('Error sending Discord alert:', error);
        }
      }
    } else {
      result.errors++;
      console.error(`Failed to update signal ${signal.id}`);
    }
  }

  return result;
}

/**
 * GET - Calculate outcomes for all pending signals
 * This is the cron job endpoint
 */
export async function GET() {
  try {
    // Get all signals needing outcomes
    const signals = await getSignalsNeedingOutcomes();

    if (signals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No signals need outcome calculation',
        summary: {
          signalsProcessed: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          alertsSent: 0,
        },
      });
    }

    // Get all strategies
    const strategies = await fetchStrategies();
    const strategyMap = new Map(strategies.map((s) => [s.id, s]));

    // Group signals by game
    const signalsByGame = new Map<string, Signal[]>();
    for (const signal of signals) {
      const existing = signalsByGame.get(signal.gameId) || [];
      existing.push(signal);
      signalsByGame.set(signal.gameId, existing);
    }

    console.log(
      `📊 Processing outcomes for ${signals.length} signals across ${signalsByGame.size} games`
    );

    // Process each game
    const totalResult = {
      gamesProcessed: 0,
      signalsProcessed: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      alertsSent: 0,
      errors: 0,
    };

    const gameResults = [];

    for (const [gameId, gameSignals] of signalsByGame) {
      const gameResult = await processGameOutcomes(gameId, strategyMap);

      if (gameResult.signalsProcessed > 0) {
        totalResult.gamesProcessed++;
        totalResult.signalsProcessed += gameResult.signalsProcessed;
        totalResult.wins += gameResult.wins;
        totalResult.losses += gameResult.losses;
        totalResult.pushes += gameResult.pushes;
        totalResult.alertsSent += gameResult.alertsSent;
        totalResult.errors += gameResult.errors;

        gameResults.push({
          gameId,
          signalCount: gameSignals.length,
          ...gameResult,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed outcomes for ${totalResult.signalsProcessed} signals`,
      summary: totalResult,
      gameResults,
    });
  } catch (error) {
    console.error('Error in calculate-outcomes cron:', error);
    return NextResponse.json(
      { success: false, error: 'Error calculating outcomes' },
      { status: 500 }
    );
  }
}

/**
 * POST - Calculate outcomes for a specific game
 * Used for manual triggering or when a game ends
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Get all strategies
    const strategies = await fetchStrategies();
    const strategyMap = new Map(strategies.map((s) => [s.id, s]));

    // Process this specific game
    const result = await processGameOutcomes(gameId, strategyMap);

    if (result.signalsProcessed === 0) {
      return NextResponse.json({
        success: true,
        message: `No signals to process for game ${gameId}`,
        gameId,
        result,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${result.signalsProcessed} signals for game ${gameId}`,
      gameId,
      result,
    });
  } catch (error) {
    console.error('Error in calculate-outcomes POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error calculating outcomes' },
      { status: 500 }
    );
  }
}
