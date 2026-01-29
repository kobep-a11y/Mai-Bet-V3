import { NextRequest, NextResponse } from 'next/server';
import { bulkImportHistoricalGames, getHistoricalGames } from '@/lib/historical-service';
import { processGameForPlayerStats, getAllPlayers } from '@/lib/player-service';
import { AirtableHistoricalGameFields, HistoricalGame } from '@/types';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


/**
 * POST - Import historical games from JSON data
 *
 * Expected format:
 * {
 *   games: [
 *     {
 *       eventId: "12345",
 *       homeTeam: "LA Lakers (HYPER)",
 *       awayTeam: "BOS Celtics (EXO)",
 *       homeScore: 112,
 *       awayScore: 108,
 *       q1Home: 28, q1Away: 26,
 *       q2Home: 30, q2Away: 25,
 *       q3Home: 27, q3Away: 29,
 *       q4Home: 27, q4Away: 28,
 *       spread: -3.5,
 *       total: 215.5,
 *       gameDate: "2024-01-15T20:30:00Z"
 *     },
 *     ...
 *   ],
 *   updatePlayerStats: true  // Whether to update player stats
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { games, updatePlayerStats = false } = body;

    if (!games || !Array.isArray(games)) {
      return NextResponse.json(
        { success: false, error: 'games array is required' },
        { status: 400 }
      );
    }

    console.log(`📥 Importing ${games.length} historical games...`);

    // Transform to Airtable format
    const airtableRecords: Partial<AirtableHistoricalGameFields>[] = games.map((game: {
      eventId?: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
      homeTeamId?: string;
      awayTeamId?: string;
      q1Home?: number;
      q1Away?: number;
      q2Home?: number;
      q2Away?: number;
      q3Home?: number;
      q3Away?: number;
      q4Home?: number;
      q4Away?: number;
      halftimeHome?: number;
      halftimeAway?: number;
      spread?: number;
      total?: number;
      gameDate?: string;
    }) => {
      const totalPoints = game.homeScore + game.awayScore;
      const pointDiff = game.homeScore - game.awayScore;

      // Determine winner
      let winner: 'home' | 'away' | 'tie' = 'tie';
      if (game.homeScore > game.awayScore) winner = 'home';
      else if (game.awayScore > game.homeScore) winner = 'away';

      // Calculate spread result
      let spreadResult: 'home_cover' | 'away_cover' | 'push' | undefined;
      if (game.spread !== undefined) {
        const adjustedMargin = pointDiff + game.spread;
        if (adjustedMargin > 0) spreadResult = 'home_cover';
        else if (adjustedMargin < 0) spreadResult = 'away_cover';
        else spreadResult = 'push';
      }

      // Calculate total result
      let totalResult: 'over' | 'under' | 'push' | undefined;
      if (game.total !== undefined) {
        if (totalPoints > game.total) totalResult = 'over';
        else if (totalPoints < game.total) totalResult = 'under';
        else totalResult = 'push';
      }

      // Calculate halftime if not provided
      const halftimeHome = game.halftimeHome ?? ((game.q1Home || 0) + (game.q2Home || 0));
      const halftimeAway = game.halftimeAway ?? ((game.q1Away || 0) + (game.q2Away || 0));

      return {
        Name: game.eventId || `${game.awayTeam}-${game.homeTeam}-${game.gameDate}`,
        'Home Team': game.homeTeam,
        'Away Team': game.awayTeam,
        'Home Team ID': game.homeTeamId,
        'Away Team ID': game.awayTeamId,
        'Home Score': game.homeScore,
        'Away Score': game.awayScore,
        'Q1 Home': game.q1Home || 0,
        'Q1 Away': game.q1Away || 0,
        'Q2 Home': game.q2Home || 0,
        'Q2 Away': game.q2Away || 0,
        'Halftime Home': halftimeHome,
        'Halftime Away': halftimeAway,
        'Q3 Home': game.q3Home || 0,
        'Q3 Away': game.q3Away || 0,
        'Q4 Home': game.q4Home || 0,
        'Q4 Away': game.q4Away || 0,
        'Total Points': totalPoints,
        'Point Differential': pointDiff,
        Winner: winner,
        Spread: game.spread,
        Total: game.total,
        'Spread Result': spreadResult,
        'Total Result': totalResult,
        'Game Date': game.gameDate || new Date().toISOString(),
      };
    });

    // Import to Airtable
    const importResult = await bulkImportHistoricalGames(airtableRecords);

    console.log(`✅ Imported ${importResult.success} games, ${importResult.failed} failed`);

    // Update player stats if requested
    let playerStatsUpdated = 0;
    if (updatePlayerStats && importResult.success > 0) {
      console.log('📊 Updating player stats from imported games...');

      // Convert to HistoricalGame format for player processing
      for (const game of games) {
        const historicalGame: HistoricalGame = {
          id: '',
          eventId: game.eventId || '',
          league: 'NBA2K',
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeTeamId: game.homeTeamId || '',
          awayTeamId: game.awayTeamId || '',
          finalHomeScore: game.homeScore,
          finalAwayScore: game.awayScore,
          q1Home: game.q1Home || 0,
          q1Away: game.q1Away || 0,
          q2Home: game.q2Home || 0,
          q2Away: game.q2Away || 0,
          halftimeHome: game.halftimeHome || ((game.q1Home || 0) + (game.q2Home || 0)),
          halftimeAway: game.halftimeAway || ((game.q1Away || 0) + (game.q2Away || 0)),
          q3Home: game.q3Home || 0,
          q3Away: game.q3Away || 0,
          q4Home: game.q4Home || 0,
          q4Away: game.q4Away || 0,
          winner: game.homeScore > game.awayScore ? 'home' : game.awayScore > game.homeScore ? 'away' : 'tie',
          totalPoints: game.homeScore + game.awayScore,
          pointDifferential: game.homeScore - game.awayScore,
          spread: game.spread,
          total: game.total,
          gameDate: game.gameDate || new Date().toISOString(),
        };

        // Add spread and total results
        if (game.spread !== undefined) {
          const adjustedMargin = (game.homeScore - game.awayScore) + game.spread;
          historicalGame.spreadResult = adjustedMargin > 0 ? 'home_cover' : adjustedMargin < 0 ? 'away_cover' : 'push';
        }
        if (game.total !== undefined) {
          const totalPoints = game.homeScore + game.awayScore;
          historicalGame.totalResult = totalPoints > game.total ? 'over' : totalPoints < game.total ? 'under' : 'push';
        }

        await processGameForPlayerStats(historicalGame);
        playerStatsUpdated++;
      }

      console.log(`✅ Updated stats for ${playerStatsUpdated} games`);
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${importResult.success} historical games`,
      results: {
        gamesSubmitted: games.length,
        gamesImported: importResult.success,
        gamesFailed: importResult.failed,
        playerStatsUpdated: updatePlayerStats ? playerStatsUpdated : 0,
      },
    });
  } catch (error) {
    console.error('Error importing historical games:', error);
    return NextResponse.json(
      { success: false, error: 'Error importing historical games' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get historical games with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const player = searchParams.get('player');

    // Build filter formula
    let filterByFormula: string | undefined;
    if (player) {
      filterByFormula = `OR(SEARCH('${player}', {Home Team}), SEARCH('${player}', {Away Team}))`;
    }

    const { games } = await getHistoricalGames({
      limit,
      filterByFormula,
    });

    return NextResponse.json({
      success: true,
      count: games.length,
      games,
    });
  } catch (error) {
    console.error('Error fetching historical games:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching historical games' },
      { status: 500 }
    );
  }
}
