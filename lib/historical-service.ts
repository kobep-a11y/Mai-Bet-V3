import { LiveGame, HistoricalGame, AirtableHistoricalGameFields } from '@/types';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Historical Games';

// Track which games we've already saved (prevent duplicates)
const savedGames = new Set<string>();

/**
 * Helper function to make Airtable REST API requests
 * This avoids the AbortSignal bug in the Airtable SDK on Vercel
 */
async function airtableRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Check if a game already exists in Airtable by event ID
 * This is essential for serverless environments where in-memory cache resets
 */
async function gameExistsInAirtable(eventId: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Name} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    const result = await response.json();

    return response.ok && result.records && result.records.length > 0;
  } catch (error) {
    console.error('Error checking for existing game:', error);
    return false; // On error, allow save attempt (Airtable will reject true duplicates)
  }
}

/**
 * Converts a finished LiveGame to a HistoricalGame and saves to Airtable
 * Uses REST API directly to avoid Airtable SDK AbortSignal bug
 */
export async function saveHistoricalGame(game: LiveGame): Promise<HistoricalGame | null> {
  // Only save finished games
  if (game.status !== 'final') {
    console.log(`Game ${game.id} is not finished, skipping save`);
    return null;
  }

  // Check in-memory cache first (fast path)
  if (savedGames.has(game.id)) {
    console.log(`Game ${game.id} already in memory cache, skipping`);
    return null;
  }

  // Verify credentials
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  // Check Airtable for existing record (handles serverless cold starts)
  const eventId = game.eventId || game.id;
  const existsInAirtable = await gameExistsInAirtable(eventId);
  if (existsInAirtable) {
    console.log(`Game ${eventId} already exists in Airtable, skipping`);
    savedGames.add(game.id); // Update memory cache
    return null;
  }

  try {
    const { quarterScores, halftimeScores } = game;

    // Calculate Q4 if not provided (API doesn't send Q4 directly)
    let q4Home = quarterScores.q4Home;
    let q4Away = quarterScores.q4Away;
    if (q4Home === 0 && q4Away === 0 && game.homeScore > 0) {
      // Q4 = Final - Halftime - Q3
      q4Home = Math.max(0, game.homeScore - halftimeScores.home - quarterScores.q3Home);
      q4Away = Math.max(0, game.awayScore - halftimeScores.away - quarterScores.q3Away);
    }

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

    // Build fields object (only include defined values)
    const fields: Record<string, unknown> = {
      'Name': game.eventId || game.id,
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
      'Q4 Home': q4Home,
      'Q4 Away': q4Away,
      'Total Points': totalPoints,
      'Point Differential': pointDifferential,
      'Winner': winner,
      'Game Date': new Date().toISOString().split('T')[0],
      'Raw Data': JSON.stringify(game.rawData || {}),
    };

    // Only add spread/total fields if they exist
    if (game.spread !== undefined) fields['Spread'] = game.spread;
    if (game.total !== undefined) fields['Total'] = game.total;
    if (spreadResult) fields['Spread Result'] = spreadResult;
    if (totalResult) fields['Total Result'] = totalResult;

    // Create record via REST API
    const response = await airtableRequest('', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Airtable API error:', result);
      return null;
    }

    // Mark as saved
    savedGames.add(game.id);

    const historicalGame: HistoricalGame = {
      id: result.id,
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
      q4Home,
      q4Away,
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
 * Bulk import historical games via REST API
 */
export async function bulkImportHistoricalGames(
  games: Partial<AirtableHistoricalGameFields>[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return { success: 0, failed: games.length };
  }

  // Airtable allows max 10 records per request
  const batchSize = 10;

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);

    try {
      const response = await airtableRequest('', {
        method: 'POST',
        body: JSON.stringify({
          records: batch.map((game) => ({ fields: game })),
        }),
      });

      if (response.ok) {
        success += batch.length;
        console.log(`Imported batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      } else {
        const error = await response.json();
        console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
        failed += batch.length;
      }
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
 * Get all historical games from Airtable via REST API
 */
export async function getHistoricalGames(options?: {
  limit?: number;
  offset?: string;
  filterByFormula?: string;
}): Promise<{ games: HistoricalGame[]; offset?: string }> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return { games: [] };
  }

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Game Date');
    params.append('sort[0][direction]', 'desc');
    params.append('pageSize', String(options?.limit || 100));
    if (options?.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }
    if (options?.offset) {
      params.append('offset', options.offset);
    }

    const response = await airtableRequest(`?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      console.error('Error fetching historical games:', result);
      return { games: [] };
    }

    const games: HistoricalGame[] = result.records.map((record: { id: string; fields: AirtableHistoricalGameFields }) => {
      const fields = record.fields;
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

    return { games, offset: result.offset };
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
