// MAI Bets V3 - Games API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getAllGames, getAllLiveGames, getGame, getGameStats, addDemoGame, clearFinishedGames } from '@/lib/game-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'live', 'all', or specific event_id
    const action = searchParams.get('action'); // 'stats', 'demo', 'clear'

    // Handle actions
    if (action === 'stats') {
      const stats = getGameStats();
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'demo') {
      const game = addDemoGame();
      return NextResponse.json({
        success: true,
        data: game,
        message: 'Demo game added',
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'clear') {
      const count = clearFinishedGames();
      return NextResponse.json({
        success: true,
        data: { cleared: count },
        message: `Cleared ${count} finished games`,
        timestamp: new Date().toISOString(),
      });
    }

    // Get specific game
    if (filter && filter !== 'live' && filter !== 'all') {
      const game = getGame(filter);
      if (!game) {
        return NextResponse.json(
          { success: false, error: 'Game not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: game,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all or live games
    const games = filter === 'live' ? getAllLiveGames() : getAllGames();
    const stats = getGameStats();

    return NextResponse.json({
      success: true,
      data: {
        games,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Games API error:', error);
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
