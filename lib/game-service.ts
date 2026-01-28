import Airtable from 'airtable';
import { LiveGame } from '@/types';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

const GAMES_TABLE = 'Active Games';

// Cache for reducing Airtable API calls (still useful within a single request)
let gamesCache: Map<string, { game: LiveGame; recordId: string; timestamp: number }> = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Upsert a game - create if doesn't exist, update if it does
 * Preserves constant data (team names) if new values are empty
 */
export async function upsertGame(game: LiveGame): Promise<void> {
  try {
    // Check if game exists
    const existingRecords = await base(GAMES_TABLE)
      .select({
        filterByFormula: `{Event ID} = '${game.eventId}'`,
        maxRecords: 1,
      })
      .firstPage();

    // Build game data, preserving existing team names if new values are empty
    const existingFields = existingRecords[0]?.fields || {};

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
    // This prevents default odds from overwriting actual odds in Airtable
    const existingSpread = existingFields['Spread'] as number | undefined;
    const existingMLHome = existingFields['ML Home'] as number | undefined;
    const existingMLAway = existingFields['ML Away'] as number | undefined;
    const existingTotal = existingFields['Total'] as number | undefined;

    // Only update spread if we have a real value (not null and not undefined)
    if (game.spread !== null && game.spread !== undefined) {
      gameData['Spread'] = game.spread;
    } else if (existingSpread !== undefined) {
      gameData['Spread'] = existingSpread;
    }

    // Only update ML if we have real values
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

    // Only update total if we have a real value
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

    if (game.awayTeam) {
      gameData['Away Team'] = game.awayTeam;
    } else if (existingFields['Away Team']) {
      gameData['Away Team'] = existingFields['Away Team'];
    }

    if (game.league) {
      gameData['League'] = game.league;
    } else if (existingFields['League']) {
      gameData['League'] = existingFields['League'];
    }

    if (existingRecords.length > 0) {
      // Update existing record
      await base(GAMES_TABLE).update(existingRecords[0].id, gameData);
    } else {
      // Create new record
      await base(GAMES_TABLE).create(gameData);
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

    const records = await base(GAMES_TABLE)
      .select({
        filterByFormula: `AND(
          {Status} != 'final',
          IS_AFTER({Last Update}, '${fiveMinutesAgo}')
        )`,
        sort: [{ field: 'Last Update', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
      const fields = record.fields;
      return {
        id: String(fields['Event ID'] || ''),
        eventId: String(fields['Event ID'] || ''),
        homeTeam: String(fields['Home Team'] || ''),
        awayTeam: String(fields['Away Team'] || ''),
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
    const records = await base(GAMES_TABLE)
      .select({
        filterByFormula: `{Event ID} = '${eventId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;

    const fields = records[0].fields;
    const game: LiveGame = {
      id: String(fields['Event ID'] || ''),
      eventId: String(fields['Event ID'] || ''),
      homeTeam: String(fields['Home Team'] || ''),
      awayTeam: String(fields['Away Team'] || ''),
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
    const records = await base(GAMES_TABLE)
      .select({
        filterByFormula: `{Event ID} = '${eventId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      await base(GAMES_TABLE).update(records[0].id, {
        'Status': 'final',
      });
    }
  } catch (error) {
    console.error('Error marking game as finished:', error);
  }
}

/**
 * Clean up old games (games that ended more than 1 hour ago)
 */
export async function cleanupOldGames(): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const records = await base(GAMES_TABLE)
      .select({
        filterByFormula: `AND(
          {Status} = 'final',
          IS_BEFORE({Last Update}, '${oneHourAgo}')
        )`,
      })
      .all();

    // Delete old records
    const recordIds = records.map(r => r.id);
    if (recordIds.length > 0) {
      // Airtable delete in batches of 10
      for (let i = 0; i < recordIds.length; i += 10) {
        const batch = recordIds.slice(i, i + 10);
        await base(GAMES_TABLE).destroy(batch);
      }
    }

    return recordIds.length;
  } catch (error) {
    console.error('Error cleaning up old games:', error);
    return 0;
  }
}
