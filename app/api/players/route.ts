import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPlayers,
  getPlayer,
  getPlayerLeaderboard,
  clearPlayerCache,
} from '@/lib/player-service';

/**
 * GET - Get all players or a single player
 *
 * Query params:
 * - name: Get a specific player by name
 * - leaderboard: Get top players (true/false)
 * - sortBy: Sort leaderboard by (winRate, gamesPlayed, avgMargin, atsWinRate)
 * - limit: Limit results (default 10 for leaderboard)
 * - refresh: Force cache refresh (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const leaderboard = searchParams.get('leaderboard') === 'true';
    const sortBy = searchParams.get('sortBy') as 'winRate' | 'gamesPlayed' | 'avgMargin' | 'atsWinRate' | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const refresh = searchParams.get('refresh') === 'true';

    // Force cache refresh if requested
    if (refresh) {
      clearPlayerCache();
    }

    // Get single player by name
    if (name) {
      const player = await getPlayer(name);
      if (!player) {
        return NextResponse.json(
          { success: false, error: `Player '${name}' not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        player,
      });
    }

    // Get leaderboard
    if (leaderboard) {
      const players = await getPlayerLeaderboard(sortBy || 'winRate', limit);
      return NextResponse.json({
        success: true,
        count: players.length,
        sortBy: sortBy || 'winRate',
        players,
      });
    }

    // Get all players
    const players = await getAllPlayers(refresh);
    return NextResponse.json({
      success: true,
      count: players.length,
      players,
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching players' },
      { status: 500 }
    );
  }
}

/**
 * POST - Recalculate player stats from historical data
 * Useful after bulk importing historical games
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh') {
      clearPlayerCache();
      const players = await getAllPlayers(true);
      return NextResponse.json({
        success: true,
        message: 'Player cache refreshed',
        count: players.length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: refresh' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in player action:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing player action' },
      { status: 500 }
    );
  }
}
