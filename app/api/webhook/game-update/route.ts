// MAI Bets V3 - Webhook Endpoint for N8N Game Updates
import { NextRequest, NextResponse } from 'next/server';
import { updateGame, getGame } from '@/lib/game-store';
import { evaluateStrategiesForGame } from '@/lib/strategy-engine';
import { saveHistoricalGame } from '@/lib/airtable';
import type { WebhookGamePayload, LiveGame } from '@/types';

// Simple auth token (set in environment)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (token !== WEBHOOK_SECRET) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Parse the incoming payload
    const payload: WebhookGamePayload = await request.json();

    // Validate required fields
    if (!payload.event_id) {
      return NextResponse.json(
        { success: false, error: 'Missing event_id' },
        { status: 400 }
      );
    }

    // Get existing game for comparison
    const existingGame = getGame(payload.event_id);
    const wasLive = existingGame?.status === 'live' || existingGame?.status === 'halftime';

    // Update the game in memory
    const game = updateGame({
      event_id: payload.event_id,
      league: payload.league,
      home_team: payload.home_team,
      away_team: payload.away_team,
      home_score: payload.home_score,
      away_score: payload.away_score,
      quarter: payload.quarter,
      time_remaining: payload.time_remaining,
      status: payload.status,
      spread_home: payload.odds?.spread_home,
      spread_away: payload.odds?.spread_away,
      moneyline_home: payload.odds?.moneyline_home,
      moneyline_away: payload.odds?.moneyline_away,
      total_line: payload.odds?.total_line,
    });

    // Evaluate strategies for this game
    await evaluateStrategiesForGame(game);

    // If game just finished, save to historical data
    if (game.status === 'finished' && wasLive) {
      await saveHistoricalGame({
        event_id: game.event_id,
        league: game.league,
        home_team: game.home_team,
        away_team: game.away_team,
        final_home_score: game.home_score,
        final_away_score: game.away_score,
        halftime_home_score: game.halftime_home_score || 0,
        halftime_away_score: game.halftime_away_score || 0,
        opening_spread_home: existingGame?.spread_home || game.spread_home,
        opening_moneyline_home: existingGame?.moneyline_home || game.moneyline_home,
        opening_moneyline_away: existingGame?.moneyline_away || game.moneyline_away,
        opening_total: existingGame?.total_line || game.total_line,
        game_date: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        event_id: game.event_id,
        status: game.status,
        score: `${game.home_score}-${game.away_score}`,
        quarter: game.quarter,
        updated_at: game.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Batch update endpoint
export async function PUT(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (token !== WEBHOOK_SECRET) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const { games }: { games: WebhookGamePayload[] } = await request.json();

    if (!Array.isArray(games)) {
      return NextResponse.json(
        { success: false, error: 'Expected games array' },
        { status: 400 }
      );
    }

    const results: { event_id: string; success: boolean; error?: string }[] = [];

    for (const payload of games) {
      try {
        if (!payload.event_id) {
          results.push({ event_id: 'unknown', success: false, error: 'Missing event_id' });
          continue;
        }

        const game = updateGame({
          event_id: payload.event_id,
          league: payload.league,
          home_team: payload.home_team,
          away_team: payload.away_team,
          home_score: payload.home_score,
          away_score: payload.away_score,
          quarter: payload.quarter,
          time_remaining: payload.time_remaining,
          status: payload.status,
          spread_home: payload.odds?.spread_home,
          spread_away: payload.odds?.spread_away,
          moneyline_home: payload.odds?.moneyline_home,
          moneyline_away: payload.odds?.moneyline_away,
          total_line: payload.odds?.total_line,
        });

        // Evaluate strategies
        await evaluateStrategiesForGame(game);

        results.push({ event_id: payload.event_id, success: true });
      } catch (err) {
        results.push({
          event_id: payload.event_id || 'unknown',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: games.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Batch webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'MAI Bets V3 Webhook Endpoint',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
}
