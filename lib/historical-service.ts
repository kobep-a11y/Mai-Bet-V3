import Airtable from 'airtable';
import { LiveGame, HistoricalGame, AirtableHistoricalGameFields } from '@/types';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// Track which games we've already saved (prevent duplicates)
const savedGames = new Set<string>();

/**
 * Converts a finished LiveGame to a HistoricalGame and saves to Airtable
 */
export async function saveHistoricalGame(game: LiveGame): Promise<HistoricalGame | null> {
  // Only save finished games
  if (game.status !== 'final') {
    console.log(`Game ${game.id} is not finished, skipping save`);
    return null;
  }

  // Check if already saved
  if (savedGames.has(game.id)) {
    console.log(`Game ${game.id} already saved to Airtable`);
    return null;
  }

  try {
    const { quarterScores, halftimeScores } = game;

    // Determine winner
    let winner: 'home' | 'away' | 'tie' = 'tie';
    if (game.homeScore > game.awayScore) winner = 'home';
    else if (game.awayScore > game.homeScore) winner = 'away';

    // Calculate spread and total results
    const totalPoints = game.homeScore + game.awayScore;
    const pointDifferential = game.homeScore - game.awayScore;

    // Spread result (negative spread means home is favored)
    let spreadResult: 'home_cover' | 'away_cover' | 'push' | undefined;
    if (game.spread !== undefined) {
      const homeMargin = game.homeScore - game.awayScore;
      const adjustedMargin = homeMargin + game.spread; // Add spread to home
      if (adjustedMargin > 0) spreadResult = 'home_cover';
      else if (adjustedMargin < 0) spreadResult = 'away_cover';
      else spreadResult = 'push';
    }

    // Total result
    let totalResult: 'over' | 'under' | 'push' | undefined;
    if (game.total !== undefined) {
      if (totalPoints > game.total) totalResult = 'over';
      else if (totalPoints < game.total) totalResult = 'under';
      else totalResult = 'push';
    }

    // Create record in Airtable
    const record = await base('Historical Games').create({
      Name: game.eventId || game.id,
      'Home Team': game.homeTeam,
      'Away Team': game.awayTeam,
      'Home Team ID': game.homeTeamId,
      'Away Team ID': game.awayTeamId,
      'Home Score': game.homeScore,
      'Away Score': game.awayScore,
      'Q1 Home': quarterScores.q1Home,
      'Q1 Away': quarterScores.q1Away,
      'Q2 Home': quarterScores.q2Home,
      'Q2 Away': quarterScores.q2Away,
      'Halftime Home': halftimeScores.home,
      'Halftime Away': halftimeScores.away,
      'Q3 Home': quarterScores.q3Home,
      'Q3 Away': quarterScores.q3Away,
      'Q4 Home': quarterScores.q4Home,
      'Q4 Away': quarterScores.q4Away,
      'Total Points': totalPoints,
      'Point Differential': pointDifferential,
      Winner: winner,
      Spread: game.spread,
      Total: game.total,
      'Spread Result': spreadResult,
      'Total Result': totalResult,
      'Game Date': new Date().toISOString(),
      'Raw Data': JSON.stringify(game.rawData || {}),
    } as Partial<AirtableHistoricalGameFields>);

    // Mark as saved
    savedGames.add(game.id);

    const historicalGame: HistoricalGame = {
      id: record.id,
      eventId: game.eventId,
      league: game.league,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      finalHomeScore: game.homeScore,
      finalAwayScore: game.awayScore,
      q1Home: quarterScores.q1Home,
      q1Away: quarterScores.q1Away,
      q2Home: quarterScores.q2Home,
      q2Away: quarterScores.q2Away,
      halftimeHome: halftimeScores.home,
      halftimeAway: halftimeScores.away,
      q3Home: quarterScores.q3Home,
      q3Away: quarterScores.q3Away,
      q4Home: quarterScores.q4Home,
      q4Away: quarterScores.q4Away,
      winner,
      totalPoints,
      pointDifferential,
      spread: game.spread,
      total: game.total,
      spreadResult,
      totalResult,
      gameDate: new Date().toISOString(),
    };

    console.log(`✅ Historical game saved: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    return historicalGame;
  } catch (error) {
    console.error('Error saving historical game to Airtable:', error);
    return null;
  }
}

/**
 * Bulk import historical games
 */
export async function bulkImportHistoricalGames(
  games: Partial<AirtableHistoricalGameFields>[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Airtable allows max 10 records per request
  const batchSize = 10;

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);

    try {
      await base('Historical Games').create(
        batch.map((game) => ({ fields: game }))
      );
      success += batch.length;
      console.log(`Imported batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
    } catch (error) {
      console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
      failed += batch.length;
    }

    // Rate limiting: wait 200ms between batches
    if (i + batchSize < games.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return { success, failed };
}

/**
 * Get all historical games from Airtable
 */
export async function getHistoricalGames(options?: {
  limit?: number;
  offset?: string;
  filterByFormula?: string;
}): Promise<{ games: HistoricalGame[]; offset?: string }> {
  try {
    const records = await base('Historical Games').select({
      sort: [{ field: 'Game Date', direction: 'desc' }],
      pageSize: options?.limit || 100,
      ...(options?.filterByFormula && { filterByFormula: options.filterByFormula }),
    }).all();

    const games: HistoricalGame[] = records.map((record) => {
      const fields = record.fields as unknown as AirtableHistoricalGameFields;
      return {
        id: record.id,
        eventId: fields.Name || '',
        league: 'NBA2K',
        homeTeam: fields['Home Team'] || '',
        awayTeam: fields['Away Team'] || '',
        homeTeamId: fields['Home Team ID'] || '',
        awayTeamId: fields['Away Team ID'] || '',
        finalHomeScore: fields['Home Score'] || 0,
        finalAwayScore: fields['Away Score'] || 0,
        q1Home: fields['Q1 Home'] || 0,
        q1Away: fields['Q1 Away'] || 0,
        q2Home: fields['Q2 Home'] || 0,
        q2Away: fields['Q2 Away'] || 0,
        halftimeHome: fields['Halftime Home'] || 0,
        halftimeAway: fields['Halftime Away'] || 0,
        q3Home: fields['Q3 Home'] || 0,
        q3Away: fields['Q3 Away'] || 0,
        q4Home: fields['Q4 Home'] || 0,
        q4Away: fields['Q4 Away'] || 0,
        winner: fields.Winner || 'tie',
        totalPoints: fields['Total Points'] || 0,
        pointDifferential: fields['Point Differential'] || 0,
        spread: fields.Spread,
        total: fields.Total,
        spreadResult: fields['Spread Result'],
        totalResult: fields['Total Result'],
        gameDate: fields['Game Date'] || '',
      };
    });

    return { games };
  } catch (error) {
    console.error('Error fetching historical games:', error);
    return { games: [] };
  }
}

/**
 * Check if a game has already been saved
 */
export function isGameSaved(gameId: string): boolean {
  return savedGames.has(gameId);
}

/**
 * Clear the saved games cache (useful for testing)
 */
export function clearSavedGamesCache(): void {
  savedGames.clear();
}
