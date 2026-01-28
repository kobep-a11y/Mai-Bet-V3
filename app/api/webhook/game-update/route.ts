import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { LiveGame } from '@/types';
import { getActiveStrategies } from '@/lib/strategy-service';
import { evaluateAllStrategies, formatTriggerResult } from '@/lib/trigger-engine';
import { signalStore, createSignal, closeAllSignalsForGame } from '@/lib/signal-service';
import { sendSignalAlert } from '@/lib/discord-service';
import { saveHistoricalGame } from '@/lib/historical-service';

/**
 * Maps N8N/external webhook fields to our LiveGame structure
 */
function mapN8NFields(data: Record<string, unknown>): LiveGame {
  const eventId = String(data['Event ID'] || data['event_id'] || '');
  const homeTeam = String(data['Home Team'] || data['home_team'] || '');
  const awayTeam = String(data['Away Team'] || data['away_team'] || '');
  const homeTeamId = String(data['Home Team ID'] || data['Home team ID'] || '');
  const awayTeamId = String(data['Away Team ID'] || '');
  const homeScore = Number(data['Home Score ( API )'] || data['Home Score'] || 0);
  const awayScore = Number(data['Away Score ( API )'] || data['Away Score'] || 0);
  const q1Home = Number(data['Quarter 1 Home'] || 0);
  const q1Away = Number(data['Quarter 1 Away'] || 0);
  const q2Home = Number(data['Quarter 2 Home'] || 0);
  const q2Away = Number(data['Quarter 2 Away'] || 0);
  const q3Home = Number(data['Quarter 3 Home'] || 0);
  const q3Away = Number(data['Quarter 3 Away'] || 0);
  const q4Home = Number(data['Quarter 4 Home'] || 0);
  const q4Away = Number(data['Quarter 4 Away'] || 0);
  const halftimeHome = Number(data['Halftime Score Home'] || 0);
  const halftimeAway = Number(data['Halftime Score Away'] || 0);
  const finalHome = Number(data['Final Home'] || homeScore);
  const finalAway = Number(data['Final Away'] || awayScore);
  const quarter = Number(data['Quarter'] || 1);
  const timeMinutes = Number(data['Time Minutes ( API )'] || data['Time Minutes'] || 0);
  const timeSeconds = Number(data['Time Seconds ( API )'] || data['Time Seconds'] || 0);
  const timeRemaining = `${timeMinutes}:${String(timeSeconds).padStart(2, '0')}`;

  // Determine game status
  let status: LiveGame['status'] = 'live';
  if (quarter === 0) status = 'scheduled';
  else if (quarter === 2 && timeMinutes === 0 && timeSeconds === 0) status = 'halftime';
  else if (quarter >= 4 && timeMinutes === 0 && timeSeconds === 0) status = 'final';
  else if (quarter === 5) status = 'final';

  return {
    id: eventId,
    eventId,
    league: String(data['League'] || 'NBA2K'),
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
    spread: Number(data['Spread'] || -3.5),
    mlHome: Number(data['ML Home'] || -150),
    mlAway: Number(data['ML Away'] || 130),
    total: Number(data['Total'] || 185.5),
    lastUpdate: new Date().toISOString(),
    rawData: data,
  };
}

/**
 * Processes a game update: triggers, signals, Discord alerts, historical saves
 */
async function processGameUpdate(game: LiveGame): Promise<{
  triggersFireCount: number;
  signalsCreated: number;
  discordAlertsSent: number;
  historicalSaved: boolean;
}> {
  let triggersFireCount = 0;
  let signalsCreated = 0;
  let discordAlertsSent = 0;
  let historicalSaved = false;

  try {
    // If game is finished, save to historical and close all signals
    if (game.status === 'final') {
      // Save to historical games
      const saved = await saveHistoricalGame(game);
      historicalSaved = saved !== null;

      // Close all active signals for this game
      await closeAllSignalsForGame(game);

      return { triggersFireCount, signalsCreated, discordAlertsSent, historicalSaved };
    }

    // Only evaluate triggers for live games
    if (game.status !== 'live' && game.status !== 'halftime') {
      return { triggersFireCount, signalsCreated, discordAlertsSent, historicalSaved };
    }

    // Get active strategies
    const strategies = await getActiveStrategies();
    if (strategies.length === 0) {
      return { triggersFireCount, signalsCreated, discordAlertsSent, historicalSaved };
    }

    // Get current active signals
    const activeSignals = signalStore.getAllActiveSignals();

    // Evaluate all strategies against this game
    const results = evaluateAllStrategies(strategies, game, activeSignals);
    triggersFireCount = results.length;

    // Process each triggered result
    for (const result of results) {
      console.log(formatTriggerResult(result));

      // Create signal in Airtable
      const signal = await createSignal(result);
      if (signal) {
        signalsCreated++;

        // Send Discord alert
        const alertsSent = await sendSignalAlert(signal, result.strategy, result);
        discordAlertsSent += alertsSent;
      }
    }
  } catch (error) {
    console.error('Error processing game update:', error);
  }

  return { triggersFireCount, signalsCreated, discordAlertsSent, historicalSaved };
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

    // Update game store
    gameStore.updateGame(gameData.id, gameData);
    console.log(`Game updated: ${gameData.id} - ${gameData.homeTeam} vs ${gameData.awayTeam} (Q${gameData.quarter} ${gameData.timeRemaining})`);

    // Process triggers, signals, alerts
    const processResult = await processGameUpdate(gameData);

    return NextResponse.json({
      success: true,
      message: 'Game updated',
      gameId: gameData.id,
      game: gameData,
      processing: processResult,
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

        gameStore.updateGame(gameData.id, gameData);
        const processResult = await processGameUpdate(gameData);

        return {
          id: gameData.id,
          success: true,
          ...processResult,
        };
      })
    );

    const totalTriggers = results.reduce((sum, r) => sum + (r.triggersFireCount || 0), 0);
    const totalSignals = results.reduce((sum, r) => sum + (r.signalsCreated || 0), 0);
    const totalAlerts = results.reduce((sum, r) => sum + (r.discordAlertsSent || 0), 0);

    return NextResponse.json({
      success: true,
      message: `${results.length} games updated`,
      results,
      summary: {
        gamesUpdated: results.length,
        triggersFireCount: totalTriggers,
        signalsCreated: totalSignals,
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
