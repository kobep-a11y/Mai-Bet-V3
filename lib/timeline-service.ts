/**
 * Timeline Snapshots Service
 *
 * Captures and manages game state snapshots for backtesting:
 * - Game state at start (for replay/backtesting)
 * - Player stats at game start
 * - Opening odds
 * - Periodic snapshots throughout the game
 * - Backfill logic for late odds
 */

import { LiveGame, Player } from '@/types';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Timeline Snapshots';

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

/**
 * Timeline Snapshot - represents game state at a point in time
 */
export interface TimelineSnapshot {
  id?: string;
  eventId: string;
  snapshotType: 'game_start' | 'quarter_end' | 'halftime' | 'game_end' | 'periodic' | 'odds_update';
  timestamp: string;

  // Game state
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  status: 'scheduled' | 'live' | 'halftime' | 'final';

  // Odds at this point
  spread?: number;
  total?: number;
  mlHome?: number;
  mlAway?: number;

  // Opening odds (only set on game_start snapshot)
  openingSpread?: number;
  openingTotal?: number;
  openingMlHome?: number;
  openingMlAway?: number;

  // Player stats at snapshot time
  homePlayerStats?: PlayerStatsSnapshot;
  awayPlayerStats?: PlayerStatsSnapshot;

  // Metadata
  notes?: string;
}

/**
 * Player stats captured at snapshot time
 */
export interface PlayerStatsSnapshot {
  playerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  recentForm: string; // JSON array as string
  streakType: 'W' | 'L';
  streakCount: number;
}

/**
 * Airtable fields for Timeline Snapshots table
 */
export interface AirtableTimelineFields {
  Name: string; // eventId-timestamp
  'Event ID': string;
  'Snapshot Type': 'game_start' | 'quarter_end' | 'halftime' | 'game_end' | 'periodic' | 'odds_update';
  Timestamp: string;

  // Game state
  'Home Team'?: string;
  'Away Team'?: string;
  'Home Score'?: number;
  'Away Score'?: number;
  Quarter?: number;
  'Time Remaining'?: string;
  Status?: string;

  // Current odds
  Spread?: number;
  Total?: number;
  'ML Home'?: number;
  'ML Away'?: number;

  // Opening odds
  'Opening Spread'?: number;
  'Opening Total'?: number;
  'Opening ML Home'?: number;
  'Opening ML Away'?: number;

  // Player stats (stored as JSON strings)
  'Home Player Stats'?: string;
  'Away Player Stats'?: string;

  Notes?: string;
}

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  endpoint: string = '',
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
 * In-memory cache for opening odds (to backfill later snapshots)
 * Key: eventId, Value: opening odds
 */
const openingOddsCache = new Map<string, {
  spread?: number;
  total?: number;
  mlHome?: number;
  mlAway?: number;
  timestamp: string;
}>();

/**
 * Convert Player to PlayerStatsSnapshot
 */
function playerToSnapshot(player: Player): PlayerStatsSnapshot {
  return {
    playerName: player.name,
    gamesPlayed: player.gamesPlayed,
    wins: player.wins,
    losses: player.losses,
    winRate: player.winRate,
    avgPointsFor: player.avgPointsFor,
    avgPointsAgainst: player.avgPointsAgainst,
    recentForm: JSON.stringify(player.recentForm),
    streakType: player.streak.type,
    streakCount: player.streak.count,
  };
}

/**
 * Capture a game start snapshot
 *
 * This should be called when a game first appears in the system
 * Captures opening odds and player stats for backtesting
 */
export async function captureGameStartSnapshot(
  game: LiveGame,
  homePlayer?: Player,
  awayPlayer?: Player
): Promise<TimelineSnapshot | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  const now = new Date().toISOString();
  const snapshotId = `${game.eventId}-start`;

  // Check if we already have a start snapshot for this game
  const existingSnapshot = await getSnapshot(game.eventId, 'game_start');
  if (existingSnapshot) {
    console.log(`Game start snapshot already exists for ${game.eventId}`);
    return existingSnapshot;
  }

  // Cache opening odds
  openingOddsCache.set(game.eventId, {
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    timestamp: now,
  });

  const snapshot: TimelineSnapshot = {
    eventId: game.eventId,
    snapshotType: 'game_start',
    timestamp: now,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    timeRemaining: '12:00',
    status: 'scheduled',
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    openingSpread: game.spread,
    openingTotal: game.total,
    openingMlHome: game.mlHome,
    openingMlAway: game.mlAway,
    homePlayerStats: homePlayer ? playerToSnapshot(homePlayer) : undefined,
    awayPlayerStats: awayPlayer ? playerToSnapshot(awayPlayer) : undefined,
    notes: 'Game start snapshot with opening odds and player stats',
  };

  return saveSnapshot(snapshot);
}

/**
 * Capture a periodic snapshot during the game
 *
 * Can be called at regular intervals to track game progression
 */
export async function capturePeriodicSnapshot(
  game: LiveGame,
  notes?: string
): Promise<TimelineSnapshot | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  const now = new Date().toISOString();

  // Get opening odds from cache if available
  const openingOdds = openingOddsCache.get(game.eventId);

  const snapshot: TimelineSnapshot = {
    eventId: game.eventId,
    snapshotType: 'periodic',
    timestamp: now,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    status: game.status,
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    openingSpread: openingOdds?.spread,
    openingTotal: openingOdds?.total,
    openingMlHome: openingOdds?.mlHome,
    openingMlAway: openingOdds?.mlAway,
    notes: notes || `Q${game.quarter} ${game.timeRemaining} - ${game.awayScore}:${game.homeScore}`,
  };

  return saveSnapshot(snapshot);
}

/**
 * Capture a quarter end snapshot
 */
export async function captureQuarterEndSnapshot(
  game: LiveGame,
  quarter: number
): Promise<TimelineSnapshot | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  const now = new Date().toISOString();
  const openingOdds = openingOddsCache.get(game.eventId);

  const snapshotType = quarter === 2 ? 'halftime' : 'quarter_end';

  const snapshot: TimelineSnapshot = {
    eventId: game.eventId,
    snapshotType,
    timestamp: now,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    quarter,
    timeRemaining: '0:00',
    status: quarter === 2 ? 'halftime' : 'live',
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    openingSpread: openingOdds?.spread,
    openingTotal: openingOdds?.total,
    openingMlHome: openingOdds?.mlHome,
    openingMlAway: openingOdds?.mlAway,
    notes: quarter === 2
      ? `Halftime - ${game.awayScore}:${game.homeScore}`
      : `End of Q${quarter} - ${game.awayScore}:${game.homeScore}`,
  };

  return saveSnapshot(snapshot);
}

/**
 * Capture a game end snapshot
 */
export async function captureGameEndSnapshot(
  game: LiveGame
): Promise<TimelineSnapshot | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  const now = new Date().toISOString();
  const openingOdds = openingOddsCache.get(game.eventId);

  const snapshot: TimelineSnapshot = {
    eventId: game.eventId,
    snapshotType: 'game_end',
    timestamp: now,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    quarter: game.quarter,
    timeRemaining: '0:00',
    status: 'final',
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    openingSpread: openingOdds?.spread,
    openingTotal: openingOdds?.total,
    openingMlHome: openingOdds?.mlHome,
    openingMlAway: openingOdds?.mlAway,
    notes: `Final - ${game.awayScore}:${game.homeScore}`,
  };

  // Clean up cache
  openingOddsCache.delete(game.eventId);

  return saveSnapshot(snapshot);
}

/**
 * Capture an odds update snapshot
 *
 * Call when significant odds movement is detected
 */
export async function captureOddsUpdateSnapshot(
  game: LiveGame,
  reason?: string
): Promise<TimelineSnapshot | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  const now = new Date().toISOString();
  const openingOdds = openingOddsCache.get(game.eventId);

  const snapshot: TimelineSnapshot = {
    eventId: game.eventId,
    snapshotType: 'odds_update',
    timestamp: now,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    status: game.status,
    spread: game.spread,
    total: game.total,
    mlHome: game.mlHome,
    mlAway: game.mlAway,
    openingSpread: openingOdds?.spread,
    openingTotal: openingOdds?.total,
    openingMlHome: openingOdds?.mlHome,
    openingMlAway: openingOdds?.mlAway,
    notes: reason || `Odds update: Spread=${game.spread}, Total=${game.total}`,
  };

  return saveSnapshot(snapshot);
}

/**
 * Save a snapshot to Airtable
 */
async function saveSnapshot(snapshot: TimelineSnapshot): Promise<TimelineSnapshot | null> {
  try {
    const fields: AirtableTimelineFields = {
      Name: `${snapshot.eventId}-${snapshot.snapshotType}-${Date.now()}`,
      'Event ID': snapshot.eventId,
      'Snapshot Type': snapshot.snapshotType,
      Timestamp: snapshot.timestamp,
      'Home Team': snapshot.homeTeam,
      'Away Team': snapshot.awayTeam,
      'Home Score': snapshot.homeScore,
      'Away Score': snapshot.awayScore,
      Quarter: snapshot.quarter,
      'Time Remaining': snapshot.timeRemaining,
      Status: snapshot.status,
    };

    // Add odds if present
    if (snapshot.spread !== undefined) fields.Spread = snapshot.spread;
    if (snapshot.total !== undefined) fields.Total = snapshot.total;
    if (snapshot.mlHome !== undefined) fields['ML Home'] = snapshot.mlHome;
    if (snapshot.mlAway !== undefined) fields['ML Away'] = snapshot.mlAway;

    // Add opening odds if present
    if (snapshot.openingSpread !== undefined) fields['Opening Spread'] = snapshot.openingSpread;
    if (snapshot.openingTotal !== undefined) fields['Opening Total'] = snapshot.openingTotal;
    if (snapshot.openingMlHome !== undefined) fields['Opening ML Home'] = snapshot.openingMlHome;
    if (snapshot.openingMlAway !== undefined) fields['Opening ML Away'] = snapshot.openingMlAway;

    // Add player stats as JSON strings
    if (snapshot.homePlayerStats) {
      fields['Home Player Stats'] = JSON.stringify(snapshot.homePlayerStats);
    }
    if (snapshot.awayPlayerStats) {
      fields['Away Player Stats'] = JSON.stringify(snapshot.awayPlayerStats);
    }

    if (snapshot.notes) fields.Notes = snapshot.notes;

    const response = await airtableRequest('', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      console.error('Failed to save snapshot:', response.status);
      return null;
    }

    const record = await response.json();
    snapshot.id = record.id;

    console.log(`📸 Snapshot saved: ${snapshot.eventId} (${snapshot.snapshotType})`);
    return snapshot;
  } catch (error) {
    console.error('Error saving snapshot:', error);
    return null;
  }
}

/**
 * Get a specific snapshot
 */
async function getSnapshot(
  eventId: string,
  snapshotType: TimelineSnapshot['snapshotType']
): Promise<TimelineSnapshot | null> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Event ID} = '${eventId}', {Snapshot Type} = '${snapshotType}')`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length === 0) return null;

    return recordToSnapshot(records[0]);
  } catch (error) {
    console.error('Error getting snapshot:', error);
    return null;
  }
}

/**
 * Get all snapshots for a game
 */
export async function getGameSnapshots(eventId: string): Promise<TimelineSnapshot[]> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);
    params.append('sort[0][field]', 'Timestamp');
    params.append('sort[0][direction]', 'asc');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    return records.map(recordToSnapshot).filter((s): s is TimelineSnapshot => s !== null);
  } catch (error) {
    console.error('Error getting game snapshots:', error);
    return [];
  }
}

/**
 * Convert Airtable record to TimelineSnapshot
 */
function recordToSnapshot(record: AirtableRecord): TimelineSnapshot | null {
  const fields = record.fields as unknown as AirtableTimelineFields;

  let homePlayerStats: PlayerStatsSnapshot | undefined;
  let awayPlayerStats: PlayerStatsSnapshot | undefined;

  try {
    if (fields['Home Player Stats']) {
      homePlayerStats = JSON.parse(fields['Home Player Stats']);
    }
    if (fields['Away Player Stats']) {
      awayPlayerStats = JSON.parse(fields['Away Player Stats']);
    }
  } catch {
    // Ignore parse errors
  }

  return {
    id: record.id,
    eventId: fields['Event ID'] || '',
    snapshotType: fields['Snapshot Type'] || 'periodic',
    timestamp: fields.Timestamp || '',
    homeTeam: fields['Home Team'] || '',
    awayTeam: fields['Away Team'] || '',
    homeScore: fields['Home Score'] || 0,
    awayScore: fields['Away Score'] || 0,
    quarter: fields.Quarter || 1,
    timeRemaining: fields['Time Remaining'] || '12:00',
    status: (fields.Status as LiveGame['status']) || 'live',
    spread: fields.Spread,
    total: fields.Total,
    mlHome: fields['ML Home'],
    mlAway: fields['ML Away'],
    openingSpread: fields['Opening Spread'],
    openingTotal: fields['Opening Total'],
    openingMlHome: fields['Opening ML Home'],
    openingMlAway: fields['Opening ML Away'],
    homePlayerStats,
    awayPlayerStats,
    notes: fields.Notes,
  };
}

/**
 * Backfill opening odds for games that started without odds
 *
 * This handles the case where a game starts but odds aren't available yet
 * When odds arrive later, this updates the game_start snapshot
 */
export async function backfillOpeningOdds(
  eventId: string,
  odds: {
    spread: number;
    total: number;
    mlHome: number;
    mlAway: number;
  }
): Promise<boolean> {
  try {
    // Find the game_start snapshot
    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Event ID} = '${eventId}', {Snapshot Type} = 'game_start')`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return false;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length === 0) {
      console.log(`No game_start snapshot found for ${eventId} to backfill`);
      return false;
    }

    const record = records[0];
    const fields = record.fields as unknown as AirtableTimelineFields;

    // Only backfill if opening odds are missing
    if (fields['Opening Spread'] !== undefined) {
      console.log(`Opening odds already present for ${eventId}`);
      return true;
    }

    // Update the snapshot with opening odds
    const updateResponse = await airtableRequest(`/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          'Opening Spread': odds.spread,
          'Opening Total': odds.total,
          'Opening ML Home': odds.mlHome,
          'Opening ML Away': odds.mlAway,
          Spread: odds.spread,
          Total: odds.total,
          'ML Home': odds.mlHome,
          'ML Away': odds.mlAway,
          Notes: `${fields.Notes || ''} [Opening odds backfilled at ${new Date().toISOString()}]`,
        },
      }),
    });

    if (updateResponse.ok) {
      // Update cache
      openingOddsCache.set(eventId, {
        spread: odds.spread,
        total: odds.total,
        mlHome: odds.mlHome,
        mlAway: odds.mlAway,
        timestamp: new Date().toISOString(),
      });

      console.log(`📸 Backfilled opening odds for ${eventId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error backfilling opening odds:', error);
    return false;
  }
}

/**
 * Delete all snapshots for a game
 *
 * Used when cleaning up test data or removing erroneously created snapshots
 */
export async function deleteGameSnapshots(eventId: string): Promise<number> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);

    const response = await airtableRequest(`?${params.toString()}`);
    if (!response.ok) return 0;

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

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

    // Clean up cache
    openingOddsCache.delete(eventId);

    console.log(`🗑️ Deleted ${deleted} snapshots for ${eventId}`);
    return deleted;
  } catch (error) {
    console.error('Error deleting game snapshots:', error);
    return 0;
  }
}

/**
 * Get opening odds from cache or database
 */
export async function getOpeningOdds(eventId: string): Promise<{
  spread?: number;
  total?: number;
  mlHome?: number;
  mlAway?: number;
} | null> {
  // Check cache first
  const cached = openingOddsCache.get(eventId);
  if (cached) return cached;

  // Check database
  const snapshot = await getSnapshot(eventId, 'game_start');
  if (snapshot) {
    const odds = {
      spread: snapshot.openingSpread,
      total: snapshot.openingTotal,
      mlHome: snapshot.openingMlHome,
      mlAway: snapshot.openingMlAway,
      timestamp: snapshot.timestamp,
    };

    // Cache for future use
    openingOddsCache.set(eventId, odds);
    return odds;
  }

  return null;
}
