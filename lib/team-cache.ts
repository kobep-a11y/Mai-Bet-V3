/**
 * Team Name Cache Service
 *
 * Stores and retrieves team names by event_id and team_id.
 * Used to populate team names when odds-only webhooks don't include them.
 *
 * Strategy:
 * 1. Cache team names in-memory when we see them in any webhook
 * 2. Persist cache to Airtable for cold start recovery
 * 3. Lookup from Historical Games as fallback
 */

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// In-memory cache: eventId -> { homeTeam, awayTeam, homeTeamId, awayTeamId }
interface TeamInfo {
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  lastSeen: string;
}

const teamCache: Map<string, TeamInfo> = new Map();

// Also cache by team_id for cross-event lookups
const teamIdToName: Map<string, string> = new Map();

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;

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
 * Store team names in cache
 */
export function cacheTeamNames(
  eventId: string,
  homeTeam: string,
  awayTeam: string,
  homeTeamId?: string,
  awayTeamId?: string
): void {
  if (!eventId || (!homeTeam && !awayTeam)) return;

  const now = new Date().toISOString();

  // Store by event ID
  teamCache.set(eventId, {
    homeTeam: homeTeam || '',
    awayTeam: awayTeam || '',
    homeTeamId,
    awayTeamId,
    lastSeen: now,
  });

  // Also store by team ID for cross-event lookups
  if (homeTeamId && homeTeam) {
    teamIdToName.set(homeTeamId, homeTeam);
  }
  if (awayTeamId && awayTeam) {
    teamIdToName.set(awayTeamId, awayTeam);
  }

  console.log(`📦 Cached team names for event ${eventId}: ${homeTeam} vs ${awayTeam}`);
}

/**
 * Get team names from cache
 */
export function getCachedTeamNames(eventId: string): TeamInfo | null {
  return teamCache.get(eventId) || null;
}

/**
 * Get team name by team ID
 */
export function getTeamNameById(teamId: string): string | null {
  return teamIdToName.get(teamId) || null;
}

/**
 * Lookup team names from Historical Games table
 */
export async function lookupTeamNamesFromHistory(eventId: string): Promise<TeamInfo | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Name} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest('Historical Games', `?${params.toString()}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.records || data.records.length === 0) {
      return null;
    }

    const record = data.records[0];
    const fields = record.fields;

    const teamInfo: TeamInfo = {
      homeTeam: fields['Home Team'] || '',
      awayTeam: fields['Away Team'] || '',
      homeTeamId: fields['Home Team ID'],
      awayTeamId: fields['Away Team ID'],
      lastSeen: new Date().toISOString(),
    };

    // Cache for future lookups
    if (teamInfo.homeTeam || teamInfo.awayTeam) {
      cacheTeamNames(eventId, teamInfo.homeTeam, teamInfo.awayTeam, teamInfo.homeTeamId, teamInfo.awayTeamId);
    }

    console.log(`📚 Found team names from history for event ${eventId}: ${teamInfo.homeTeam} vs ${teamInfo.awayTeam}`);
    return teamInfo;
  } catch (error) {
    console.error('Error looking up team names from history:', error);
    return null;
  }
}

/**
 * Lookup team names from Active Games table (in case we stored them before)
 */
export async function lookupTeamNamesFromActiveGames(eventId: string): Promise<TeamInfo | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest('Active Games', `?${params.toString()}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.records || data.records.length === 0) {
      return null;
    }

    const record = data.records[0];
    const fields = record.fields;

    // Check if team names exist in this record
    const homeTeam = fields['Home Team'];
    const awayTeam = fields['Away Team '] || fields['Away Team']; // Note: field has trailing space

    if (!homeTeam && !awayTeam) {
      return null;
    }

    const teamInfo: TeamInfo = {
      homeTeam: homeTeam || '',
      awayTeam: awayTeam || '',
      lastSeen: new Date().toISOString(),
    };

    // Cache for future lookups
    cacheTeamNames(eventId, teamInfo.homeTeam, teamInfo.awayTeam);

    return teamInfo;
  } catch (error) {
    console.error('Error looking up team names from active games:', error);
    return null;
  }
}

/**
 * Get team names with fallback chain:
 * 1. In-memory cache
 * 2. Active Games table
 * 3. Historical Games table
 */
export async function getTeamNames(eventId: string): Promise<TeamInfo | null> {
  // 1. Check in-memory cache first (fastest)
  const cached = getCachedTeamNames(eventId);
  if (cached && cached.homeTeam && cached.awayTeam) {
    return cached;
  }

  // 2. Check Active Games table
  const fromActive = await lookupTeamNamesFromActiveGames(eventId);
  if (fromActive && fromActive.homeTeam && fromActive.awayTeam) {
    return fromActive;
  }

  // 3. Check Historical Games table
  const fromHistory = await lookupTeamNamesFromHistory(eventId);
  if (fromHistory && fromHistory.homeTeam && fromHistory.awayTeam) {
    return fromHistory;
  }

  return null;
}

/**
 * Pre-populate cache from Active Games and Historical Games on startup
 */
export async function initializeTeamCache(): Promise<number> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.log('⚠️ Team cache: Missing Airtable credentials');
    return 0;
  }

  let cached = 0;

  try {
    // Load from Active Games
    const activeResponse = await airtableRequest('Active Games', '?maxRecords=100');
    if (activeResponse.ok) {
      const activeData = await activeResponse.json();
      for (const record of activeData.records || []) {
        const fields = record.fields;
        const eventId = fields['Event ID'];
        const homeTeam = fields['Home Team'];
        const awayTeam = fields['Away Team '] || fields['Away Team'];

        if (eventId && (homeTeam || awayTeam)) {
          cacheTeamNames(eventId, homeTeam || '', awayTeam || '');
          cached++;
        }
      }
    }

    // Load recent Historical Games
    const historyResponse = await airtableRequest('Historical Games', '?maxRecords=100&sort[0][field]=Game Date&sort[0][direction]=desc');
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      for (const record of historyData.records || []) {
        const fields = record.fields;
        const eventId = fields['Name']; // Event ID is stored in Name field
        const homeTeam = fields['Home Team'];
        const awayTeam = fields['Away Team'];
        const homeTeamId = fields['Home Team ID'];
        const awayTeamId = fields['Away Team ID'];

        if (eventId && (homeTeam || awayTeam)) {
          // Only cache if not already present (active games take precedence)
          if (!teamCache.has(eventId)) {
            cacheTeamNames(eventId, homeTeam || '', awayTeam || '', homeTeamId, awayTeamId);
            cached++;
          }
        }
      }
    }

    console.log(`📦 Team cache initialized with ${cached} entries`);
  } catch (error) {
    console.error('Error initializing team cache:', error);
  }

  return cached;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { eventCount: number; teamIdCount: number } {
  return {
    eventCount: teamCache.size,
    teamIdCount: teamIdToName.size,
  };
}

/**
 * Clear the cache (for testing)
 */
export function clearCache(): void {
  teamCache.clear();
  teamIdToName.clear();
}
