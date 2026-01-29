import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalGames, bulkImportHistoricalGames } from '@/lib/historical-service';
import { AirtableHistoricalGameFields } from '@/types';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

/**
 * GET - Fetch historical games with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = searchParams.get('offset') || undefined;
    const homeTeam = searchParams.get('homeTeam');
    const awayTeam = searchParams.get('awayTeam');
    const winner = searchParams.get('winner');

    // Build filter formula if params provided
    let filterByFormula: string | undefined;
    const filters: string[] = [];

    if (homeTeam) {
      filters.push(`FIND("${homeTeam}", {Home Team})`);
    }
    if (awayTeam) {
      filters.push(`FIND("${awayTeam}", {Away Team})`);
    }
    if (winner) {
      filters.push(`{Winner} = "${winner}"`);
    }

    if (filters.length > 0) {
      filterByFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
    }

    const result = await getHistoricalGames({ limit, offset, filterByFormula });

    return NextResponse.json({
      success: true,
      count: result.games.length,
      data: result.games,
      offset: result.offset,
    });
  } catch (error) {
    console.error('Error fetching historical games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical games' },
      { status: 500 }
    );
  }
}

/**
 * POST - Bulk import historical games
 *
 * Expected body format:
 * {
 *   "games": [
 *     {
 *       "Name": "event-123",
 *       "Home Team": "LA Lakers",
 *       "Away Team": "BOS Celtics",
 *       "Home Score": 105,
 *       "Away Score": 98,
 *       ...
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const games: Partial<AirtableHistoricalGameFields>[] = body.games || [];

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No games provided. Expected { games: [...] }' },
        { status: 400 }
      );
    }

    // Validate required fields
    for (let i = 0; i < games.length; i++) {
      if (!games[i].Name) {
        return NextResponse.json(
          { success: false, error: `Game at index ${i} missing required field: Name (Event ID)` },
          { status: 400 }
        );
      }
    }

    console.log(`Starting bulk import of ${games.length} historical games...`);
    const result = await bulkImportHistoricalGames(games);

    return NextResponse.json({
      success: true,
      message: `Import complete: ${result.success} succeeded, ${result.failed} failed`,
      imported: result.success,
      failed: result.failed,
      total: games.length,
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import historical games' },
      { status: 500 }
    );
  }
}
