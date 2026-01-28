import { LiveGame } from '@/types';

// Airtable REST API configuration
// Using REST API instead of SDK to avoid AbortSignal bug on Vercel serverless
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const GAMES_TABLE = 'Active Games';

// Cache for reducing Airtable API calls (still useful within a single request)
const gamesCache: Map<string, { game: LiveGame; recordId: string; timestamp: number }> = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(GAMES_TABLE)}${endpoint}`;

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
 * Upsert a game - create if doesn't exist, update if it does
 * Preserves constant data (team names) if new values are empty
 */
export async function upsertGame(game: LiveGame): Promise<void> {
  try {
    // Check if game exists
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${game.eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) {
      console.error('Error checking for existing game:', response.status);
      return;
    }

    const data = await response.json();
    const existingRecords = data.records || [];
    const existingFields = existingRecords[0]?.fields || {};

    // Build game data, preserving existing team names if new values are empty
    const gameData: Record<string, unknown> = {
      'Event ID': game.eventId,
      'Home Score': game.homeScore,
      'Away Score': game.awayScore,
      'Quarter': game.quarter,
      'Time Remaining': game.timeRemaining,
      'Status': game.status,
      'Last Update': new Date().toISOString(),
      'Raw Data': JSON.stringify(game.rawData || {}),
    };

    // Preserve odds: only update if new values are provided (not null/defaults)
    const existingSpread = existingFields['Spread'] as number | undefined;
    const existingMLHome = existingFields['ML Home'] as number | undefined;
    const existingMLAway = existingFields['ML Away'] as number | undefined;
    const existingTotal = existingFields['Total'] as number | undefined;

    if (game.spread !== null && game.spread !== undefined) {
      gameData['Spread'] = game.spread;
    } else if (existingSpread !== undefined) {
      gameData['Spread'] = existingSpread;
    }

    if (game.mlHome !== null && game.mlHome !== undefined) {
      gameData['ML Home'] = game.mlHome;
    } else if (existingMLHome !== undefined) {
      gameData['ML Home'] = existingMLHome;
    }

    if (game.mlAway !== null && game.mlAway !== undefined) {
      gameData['ML Away'] = game.mlAway;
    } else if (existingMLAway !== undefined) {
      gameData['ML Away'] = existingMLAway;
    }

    if (game.total !== null && game.total !== undefined) {
      gameData['Total'] = game.total;
    } else if (existingTotal !== undefined) {
      gameData['Total'] = existingTotal;
    }

    // Only update team names if provided (preserve existing otherwise)
    if (game.homeTeam) {
      gameData['Home Team'] = game.homeTeam;
    } else if (existingFields['Home Team']) {
      gameData['Home Team'] = existingFields['Home Team'];
    }

    // Note: Airtable field has trailing space: "Away Team "
    if (game.awayTeam) {
      gameData['Away Team '] = game.awayTeam;
    } else if (existingFields['Away Team ']) {
      gameData['Away Team '] = existingFields['Away Team '];
    }

    if (game.league) {
      gameData['League'] = game.league;
    } else if (existingFields['League']) {
      gameData['League'] = existingFields['League'];
    }

    if (existingRecords.length > 0) {
      // Update existing record
      const updateResponse = await airtableRequest(`/${existingRecords[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: gameData }),
      });

      if (!updateResponse.ok) {
        console.error('Error updating game:', updateResponse.status);
      }
    } else {
      // Create new record
      const createResponse = await airtableRequest('', {
        method: 'POST',
        body: JSON.stringify({ fields: gameData }),
      });

      if (!createResponse.ok) {
        console.error('Error creating game:', createResponse.status);
      }
    }

    // Update cache
    gamesCache.set(game.eventId, {
      game,
      recordId: existingRecords[0]?.id || '',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error upserting game to Airtable:', error);
    throw error;
  }
}

/**
 * Get all active games from Airtable
 */
export async function getActiveGames(): Promise<LiveGame[]> {
  try {
    // Get games updated in the last 5 minutes (active games)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Status} != 'final', IS_AFTER({Last Update}, '${fiveMinutesAgo}'))`);
    params.append('sort[0][field]', 'Last Update');
    params.append('sort[0][direction]', 'desc');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) {
      console.error('Error fetching active games:', response.status);
      return [];
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    return records.map((record) => {
      const fields = record.fields;
      return {
        id: String(fields['Event ID'] || ''),
        eventId: String(fields['Event ID'] || ''),
        homeTeam: String(fields['Home Team'] || ''),
        awayTeam: String(fields['Away Team '] || fields['Away Team'] || ''),
        homeScore: Number(fields['Home Score'] || 0),
        awayScore: Number(fields['Away Score'] || 0),
        quarter: Number(fields['Quarter'] || 1),
        timeRemaining: String(fields['Time Remaining'] || '12:00'),
        status: (fields['Status'] as LiveGame['status']) || 'live',
        spread: Number(fields['Spread'] || 0),
        mlHome: Number(fields['ML Home'] || 0),
        mlAway: Number(fields['ML Away'] || 0),
        total: Number(fields['Total'] || 0),
        league: String(fields['League'] || 'NBA2K'),
        homeTeamId: '',
        awayTeamId: '',
        quarterScores: { q1Home: 0, q1Away: 0, q2Home: 0, q2Away: 0, q3Home: 0, q3Away: 0, q4Home: 0, q4Away: 0 },
        halftimeScores: { home: 0, away: 0 },
        finalScores: { home: Number(fields['Home Score'] || 0), away: Number(fields['Away Score'] || 0) },
        lastUpdate: String(fields['Last Update'] || new Date().toISOString()),
      };
    });
  } catch (error) {
    console.error('Error fetching games from Airtable:', error);
    return [];
  }
}

/**
 * Get a single game by event ID
 */
export async function getGame(eventId: string): Promise<LiveGame | null> {
  // Check cache first
  const cached = gamesCache.get(eventId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.game;
  }

  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) {
      console.error('Error fetching game:', response.status);
      return null;
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length === 0) return null;

    const fields = records[0].fields;
    const game: LiveGame = {
      id: String(fields['Event ID'] || ''),
      eventId: String(fields['Event ID'] || ''),
      homeTeam: String(fields['Home Team'] || ''),
      awayTeam: String(fields['Away Team '] || fields['Away Team'] || ''),
      homeScore: Number(fields['Home Score'] || 0),
      awayScore: Number(fields['Away Score'] || 0),
      quarter: Number(fields['Quarter'] || 1),
      timeRemaining: String(fields['Time Remaining'] || '12:00'),
      status: (fields['Status'] as LiveGame['status']) || 'live',
      spread: Number(fields['Spread'] || 0),
      mlHome: Number(fields['ML Home'] || 0),
      mlAway: Number(fields['ML Away'] || 0),
      total: Number(fields['Total'] || 0),
      league: String(fields['League'] || 'NBA2K'),
      homeTeamId: '',
      awayTeamId: '',
      quarterScores: { q1Home: 0, q1Away: 0, q2Home: 0, q2Away: 0, q3Home: 0, q3Away: 0, q4Home: 0, q4Away: 0 },
      halftimeScores: { home: 0, away: 0 },
      finalScores: { home: Number(fields['Home Score'] || 0), away: Number(fields['Away Score'] || 0) },
      lastUpdate: String(fields['Last Update'] || new Date().toISOString()),
    };

    // Update cache
    gamesCache.set(eventId, {
      game,
      recordId: records[0].id,
      timestamp: Date.now(),
    });

    return game;
  } catch (error) {
    console.error('Error fetching game from Airtable:', error);
    return null;
  }
}

/**
 * Mark a game as finished
 */
export async function markGameFinished(eventId: string): Promise<void> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length > 0) {
      await airtableRequest(`/${records[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: { 'Status': 'final' } }),
      });
    }
  } catch (error) {
    console.error('Error marking game as finished:', error);
  }
}

/**
 * Delete a specific game from Active Games table (after saving to Historical)
 */
export async function deleteGame(eventId: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return false;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length > 0) {
      const deleteResponse = await airtableRequest(`/${records[0].id}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        gamesCache.delete(eventId);
        console.log(`🗑️ Deleted game ${eventId} from Active Games table`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting game from Airtable:', error);
    return false;
  }
}

/**
 * Clean up old games (games that ended more than 1 hour ago)
 */
export async function cleanupOldGames(): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Status} = 'final', IS_BEFORE({Last Update}, '${oneHourAgo}'))`);

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return 0;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    // Delete old records in batches of 10
    let deleted = 0;
    for (let i = 0; i < records.length; i += 10) {
      const batch = records.slice(i, i + 10);
      const deleteParams = batch.map(r => `records[]=${r.id}`).join('&');

      const deleteResponse = await airtableRequest(`?${deleteParams}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        deleted += batch.length;
      }
    }

    return deleted;
  } catch (error) {
    console.error('Error cleaning up old games:', error);
    return 0;
  }
}
