import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { signalStore } from '@/lib/signal-service';
import { getActiveStrategies } from '@/lib/strategy-service';
import { sendGameResultAlert } from '@/lib/discord-service';
import { saveHistoricalGame } from '@/lib/historical-service';
import { processGameForPlayerStats, extractPlayerName } from '@/lib/player-service';
import { Signal, LiveGame, Strategy, HistoricalGame } from '@/types';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Airtable REST API configuration
// Using REST API instead of SDK to avoid AbortSignal bug on Vercel serverless
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

/**
 * Calculate the result of a bet based on final scores
 *
 * For spread bets:
 * - Leading team bet: Did the leading team cover the spread?
 * - Trailing team bet: Did the trailing team cover?
 *
 * For moneyline bets:
 * - Did the bet side win outright?
 *
 * For total bets:
 * - Did the game go over/under the total?
 */
function calculateBetResult(
  signal: Signal,
  game: LiveGame,
  strategy: Strategy
): 'win' | 'loss' | 'push' {
  const finalHome = game.finalScores?.home || game.homeScore;
  const finalAway = game.finalScores?.away || game.awayScore;
  const finalDiff = finalHome - finalAway; // Positive = home won by X

  const oddsReq = strategy.oddsRequirement;
  if (!oddsReq) {
    // No odds requirement, can't determine result
    return 'push';
  }

  const { type, betSide, value } = oddsReq;
  const leadingAtTrigger = signal.leadingTeamAtTrigger ||
    (signal.homeScore > signal.awayScore ? 'home' : 'away');

  // Determine which team was bet on
  let bettingOnHome: boolean;
  if (betSide === 'leading_team') {
    bettingOnHome = leadingAtTrigger === 'home';
  } else if (betSide === 'trailing_team') {
    bettingOnHome = leadingAtTrigger !== 'home';
  } else if (betSide === 'home') {
    bettingOnHome = true;
  } else {
    bettingOnHome = false;
  }

  // Calculate based on bet type
  switch (type) {
    case 'spread': {
      // For spread bets, we need to check if the bet side covered
      // The spread is from home's perspective
      // If betting on home: homeDiff > spread = win (home covered)
      // If betting on away: homeDiff < -spread = win (away covered)
      const spreadUsed = signal.actualSpreadAtEntry || value;

      if (bettingOnHome) {
        // Home covers if they win by more than the spread
        // Or if spread is negative (home is favorite), they can lose by less than spread
        const homeCover = finalDiff > -spreadUsed;
        const push = finalDiff === -spreadUsed;
        return push ? 'push' : homeCover ? 'win' : 'loss';
      } else {
        // Away covers if they win by more than the spread
        // Away spread is -homeSpread
        const awayCover = -finalDiff > spreadUsed;
        const push = -finalDiff === spreadUsed;
        return push ? 'push' : awayCover ? 'win' : 'loss';
      }
    }

    case 'moneyline': {
      // Moneyline is simple - did the bet side win?
      if (finalHome === finalAway) return 'push';
      const homeWon = finalHome > finalAway;
      return (bettingOnHome === homeWon) ? 'win' : 'loss';
    }

    case 'total_over': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) return 'push';
      return totalPoints > totalLine ? 'win' : 'loss';
    }

    case 'total_under': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) return 'push';
      return totalPoints < totalLine ? 'win' : 'loss';
    }

    default:
      return 'push';
  }
}

/**
 * Get signals that have bet_taken status and need result calculation
 */
async function getSignalsNeedingResults(gameId: string): Promise<Signal[]> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Game ID} = '${gameId}', {Status} = 'bet_taken')`);

    const response = await airtableRequest('Signals', `?${params.toString()}`);
    if (!response.ok) {
      console.error('Error fetching signals:', response.status);
      return [];
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    return records.map((record) => {
      const fields = record.fields;
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
        entryTriggerTime: fields['Entry Trigger Time'] as string | undefined,
        closeTriggerTime: fields['Close Trigger Time'] as string | undefined,
        oddsAlignedTime: fields['Odds Aligned Time'] as string | undefined,
        entrySpread: fields['Entry Spread'] as number | undefined,
        entryTotal: fields['Entry Total'] as number | undefined,
        requiredSpread: fields['Required Spread'] as number | undefined,
        actualSpreadAtEntry: fields['Actual Spread At Entry'] as number | undefined,
        leadingTeamAtTrigger: fields['Leading Team At Trigger'] as 'home' | 'away' | undefined,
        leadingTeamSpreadAtEntry: fields['Leading Team Spread'] as number | undefined,
        status: (fields['Status'] as Signal['status']) || 'bet_taken',
        createdAt: record.createdTime || '',
      } as Signal;
    });
  } catch (error) {
    console.error('Error fetching signals needing results:', error);
    return [];
  }
}

/**
 * Update signal with final result
 */
async function updateSignalResult(
  signalId: string,
  game: LiveGame,
  result: 'win' | 'loss' | 'push'
): Promise<boolean> {
  try {
    const finalStatus = result === 'win' ? 'won' : result === 'loss' ? 'lost' : 'pushed';

    const response = await airtableRequest('Signals', `/${signalId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          Status: finalStatus,
          Result: result,
          'Final Home Score': game.finalScores?.home || game.homeScore,
          'Final Away Score': game.finalScores?.away || game.awayScore,
          Notes: `Game ended. Final: ${game.awayScore}-${game.homeScore}. Result: ${result.toUpperCase()}`,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating signal result:', error);
    return false;
  }
}

/**
 * Process a finished game:
 * 1. Get all bet_taken signals for this game
 * 2. Calculate win/loss/push for each
 * 3. Update signals in Airtable
 * 4. Send Discord notifications
 * 5. Save to historical games
 */
async function processFinishedGame(game: LiveGame): Promise<{
  signalsProcessed: number;
  alertsSent: number;
  historicalSaved: boolean;
  playerStatsUpdated: boolean;
}> {
  let signalsProcessed = 0;
  let alertsSent = 0;
  let historicalSaved = false;
  let playerStatsUpdated = false;

  try {
    // Get strategies for finding odds requirements
    const strategies = await getActiveStrategies();
    const strategyMap = new Map(strategies.map((s) => [s.id, s]));

    // Get signals that need results
    const signals = await getSignalsNeedingResults(game.id);

    for (const signal of signals) {
      const strategy = strategyMap.get(signal.strategyId);
      if (!strategy) {
        console.log(`Strategy not found for signal ${signal.id}`);
        continue;
      }

      // Calculate result
      const result = calculateBetResult(signal, game, strategy);

      // Update signal in Airtable
      const updated = await updateSignalResult(signal.id, game, result);
      if (updated) {
        signalsProcessed++;

        // Send Discord notification
        const sentCount = await sendGameResultAlert(signal, strategy, game, result);
        alertsSent += sentCount;
      }
    }

    // Save to historical games
    const saved = await saveHistoricalGame(game);
    historicalSaved = saved !== null;

    // Update player stats
    if (historicalSaved) {
      const historicalGame: HistoricalGame = {
        id: '',
        eventId: game.eventId,
        league: game.league,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        finalHomeScore: game.finalScores?.home || game.homeScore,
        finalAwayScore: game.finalScores?.away || game.awayScore,
        q1Home: game.quarterScores.q1Home,
        q1Away: game.quarterScores.q1Away,
        q2Home: game.quarterScores.q2Home,
        q2Away: game.quarterScores.q2Away,
        halftimeHome: game.halftimeScores.home,
        halftimeAway: game.halftimeScores.away,
        q3Home: game.quarterScores.q3Home,
        q3Away: game.quarterScores.q3Away,
        q4Home: game.quarterScores.q4Home,
        q4Away: game.quarterScores.q4Away,
        winner: game.homeScore > game.awayScore ? 'home' : game.awayScore > game.homeScore ? 'away' : 'tie',
        totalPoints: game.homeScore + game.awayScore,
        pointDifferential: game.homeScore - game.awayScore,
        spread: game.spread,
        total: game.total,
        gameDate: new Date().toISOString(),
      };

      // Calculate spread and total results
      if (game.spread !== undefined) {
        const adjustedMargin = (game.homeScore - game.awayScore) + game.spread;
        historicalGame.spreadResult = adjustedMargin > 0 ? 'home_cover' : adjustedMargin < 0 ? 'away_cover' : 'push';
      }
      if (game.total !== undefined) {
        const totalPoints = game.homeScore + game.awayScore;
        historicalGame.totalResult = totalPoints > game.total ? 'over' : totalPoints < game.total ? 'under' : 'push';
      }

      await processGameForPlayerStats(historicalGame);
      playerStatsUpdated = true;
    }

    // Clear any remaining active signals for this game
    signalStore.clearSignalsForGame(game.id);

    console.log(`🏁 Finished processing game ${game.id}: ${signalsProcessed} signals, ${alertsSent} alerts`);

  } catch (error) {
    console.error('Error processing finished game:', error);
  }

  return { signalsProcessed, alertsSent, historicalSaved, playerStatsUpdated };
}

/**
 * GET - Check all games for completion and process results
 * This endpoint can be called by a cron job or external scheduler
 */
export async function GET(request: NextRequest) {
  try {
    const games = gameStore.getAllGames();
    const finishedGames = games.filter((g) => g.status === 'final');

    const results = [];
    let totalSignalsProcessed = 0;
    let totalAlertsSent = 0;
    let totalHistoricalSaved = 0;
    let totalPlayerStatsUpdated = 0;

    for (const game of finishedGames) {
      const processResult = await processFinishedGame(game);
      results.push({
        gameId: game.id,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`,
        finalScore: `${game.awayScore}-${game.homeScore}`,
        ...processResult,
      });

      totalSignalsProcessed += processResult.signalsProcessed;
      totalAlertsSent += processResult.alertsSent;
      if (processResult.historicalSaved) totalHistoricalSaved++;
      if (processResult.playerStatsUpdated) totalPlayerStatsUpdated++;

      // Remove finished game from store after processing
      gameStore.removeGame(game.id);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${finishedGames.length} finished games`,
      summary: {
        gamesProcessed: finishedGames.length,
        signalsProcessed: totalSignalsProcessed,
        alertsSent: totalAlertsSent,
        historicalGamesSaved: totalHistoricalSaved,
        playerStatsUpdated: totalPlayerStatsUpdated,
      },
      results,
    });
  } catch (error) {
    console.error('Error in game-end-check:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing game end checks' },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually trigger processing for a specific game
 */
export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId is required' },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status !== 'final') {
      return NextResponse.json(
        { success: false, error: 'Game is not finished yet', currentStatus: game.status },
        { status: 400 }
      );
    }

    const processResult = await processFinishedGame(game);

    // Remove from store after processing
    gameStore.removeGame(gameId);

    return NextResponse.json({
      success: true,
      message: 'Game processed successfully',
      gameId,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      finalScore: `${game.awayScore}-${game.homeScore}`,
      ...processResult,
    });
  } catch (error) {
    console.error('Error in POST game-end-check:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing game' },
      { status: 500 }
    );
  }
}
