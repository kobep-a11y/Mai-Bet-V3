import { Player, AirtablePlayerFields, HistoricalGame } from '@/types';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Players';

// In-memory cache for players
let playersCache: Map<string, Player> = new Map();
let cacheLastUpdated: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
 * Extract player name from team name
 * e.g., "OKC Thunder (KJMR)" -> "KJMR"
 * e.g., "LA Lakers (HYPER)" -> "HYPER"
 */
export function extractPlayerName(teamName: string): string | null {
  const match = teamName.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

/**
 * Extract team name without player
 * e.g., "OKC Thunder (KJMR)" -> "OKC Thunder"
 */
export function extractTeamName(fullTeamName: string): string {
  return fullTeamName.replace(/\s*\([^)]+\)/, '').trim();
}

/**
 * Get or create a player from a team name
 * Uses REST API directly to avoid Airtable SDK AbortSignal bug
 */
export async function getOrCreatePlayer(fullTeamName: string): Promise<Player | null> {
  const playerName = extractPlayerName(fullTeamName);
  if (!playerName) {
    return null;
  }

  // Check cache first
  if (playersCache.has(playerName)) {
    return playersCache.get(playerName)!;
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  try {
    // Try to find existing player via REST API
    const searchParams = new URLSearchParams();
    searchParams.append('filterByFormula', `{Name} = '${playerName}'`);

    const searchResponse = await airtableRequest(`?${searchParams.toString()}`);
    const searchResult = await searchResponse.json();

    if (searchResponse.ok && searchResult.records?.length > 0) {
      // Clean up duplicates if found
      if (searchResult.records.length > 1) {
        console.log(`⚠️ Found ${searchResult.records.length} duplicate players for ${playerName}, cleaning up...`);
        for (let i = 1; i < searchResult.records.length; i++) {
          try {
            await airtableRequest(`/${searchResult.records[i].id}`, { method: 'DELETE' });
          } catch (err) {
            console.error(`Error deleting duplicate player ${searchResult.records[i].id}:`, err);
          }
        }
      }

      const player = mapRecordToPlayer(searchResult.records[0]);
      playersCache.set(playerName, player);
      return player;
    }

    // Create new player via REST API
    const teamName = extractTeamName(fullTeamName);
    const now = new Date().toISOString();

    const createResponse = await airtableRequest('', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          Name: playerName,
          'Team Name': teamName,
          'Full Team Name': fullTeamName,
          'Games Played': 0,
          Wins: 0,
          Losses: 0,
          'Win Rate': 0,
          'Total Points For': 0,
          'Total Points Against': 0,
          'Avg Points For': 0,
          'Avg Points Against': 0,
          'Avg Margin': 0,
          'Spread Wins': 0,
          'Spread Losses': 0,
          'Spread Pushes': 0,
          'Total Overs': 0,
          'Total Unders': 0,
          'Total Pushes': 0,
          'ATS Win Rate': 0,
          'Over Rate': 0,
          'Recent Form': '[]',
          'Is Active': true,
        },
      }),
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok) {
      console.error('❌ Error creating player:', createResult);
      return null;
    }

    const player: Player = {
      id: createResult.id,
      name: playerName,
      teamName,
      fullTeamName,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPointsFor: 0,
      totalPointsAgainst: 0,
      avgPointsFor: 0,
      avgPointsAgainst: 0,
      avgMargin: 0,
      spreadRecord: { wins: 0, losses: 0, pushes: 0 },
      totalRecord: { overs: 0, unders: 0, pushes: 0 },
      atsWinRate: 0,
      overRate: 0,
      recentForm: [],
      streak: { type: 'W', count: 0 },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    playersCache.set(playerName, player);
    console.log(`✨ Created new player: ${playerName}`);
    return player;
  } catch (error) {
    console.error('Error getting/creating player:', error);
    return null;
  }
}

/**
 * Update player stats after a game
 * Uses REST API directly to avoid Airtable SDK AbortSignal bug
 */
export async function updatePlayerStats(
  playerName: string,
  game: {
    isWin: boolean;
    pointsFor: number;
    pointsAgainst: number;
    spreadResult?: 'win' | 'loss' | 'push';
    totalResult?: 'over' | 'under' | 'push';
    gameDate: string;
  }
): Promise<Player | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  try {
    // Get current player via REST API
    const searchParams = new URLSearchParams();
    searchParams.append('filterByFormula', `{Name} = '${playerName}'`);
    searchParams.append('maxRecords', '1');

    const searchResponse = await airtableRequest(`?${searchParams.toString()}`);
    const searchResult = await searchResponse.json();

    if (!searchResponse.ok || !searchResult.records?.length) {
      console.log(`Player ${playerName} not found`);
      return null;
    }

    const record = searchResult.records[0];
    const fields = record.fields as AirtablePlayerFields;

    // Calculate new stats
    const gamesPlayed = (fields['Games Played'] || 0) + 1;
    const wins = (fields.Wins || 0) + (game.isWin ? 1 : 0);
    const losses = (fields.Losses || 0) + (game.isWin ? 0 : 1);
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    const totalPointsFor = (fields['Total Points For'] || 0) + game.pointsFor;
    const totalPointsAgainst = (fields['Total Points Against'] || 0) + game.pointsAgainst;
    const avgPointsFor = gamesPlayed > 0 ? totalPointsFor / gamesPlayed : 0;
    const avgPointsAgainst = gamesPlayed > 0 ? totalPointsAgainst / gamesPlayed : 0;
    const avgMargin = avgPointsFor - avgPointsAgainst;

    // Spread record
    const spreadWins = (fields['Spread Wins'] || 0) + (game.spreadResult === 'win' ? 1 : 0);
    const spreadLosses = (fields['Spread Losses'] || 0) + (game.spreadResult === 'loss' ? 1 : 0);
    const spreadPushes = (fields['Spread Pushes'] || 0) + (game.spreadResult === 'push' ? 1 : 0);
    const spreadGames = spreadWins + spreadLosses;
    const atsWinRate = spreadGames > 0 ? (spreadWins / spreadGames) * 100 : 0;

    // Total record
    const totalOvers = (fields['Total Overs'] || 0) + (game.totalResult === 'over' ? 1 : 0);
    const totalUnders = (fields['Total Unders'] || 0) + (game.totalResult === 'under' ? 1 : 0);
    const totalPushes = (fields['Total Pushes'] || 0) + (game.totalResult === 'push' ? 1 : 0);
    const totalGames = totalOvers + totalUnders;
    const overRate = totalGames > 0 ? (totalOvers / totalGames) * 100 : 0;

    // Recent form (last 10)
    let recentForm: ('W' | 'L')[] = [];
    try {
      recentForm = JSON.parse(fields['Recent Form'] || '[]');
    } catch {
      recentForm = [];
    }
    recentForm.unshift(game.isWin ? 'W' : 'L');
    if (recentForm.length > 10) recentForm.pop();

    // Calculate streak
    let streakType: 'W' | 'L' = recentForm[0] || 'W';
    let streakCount = 0;
    for (const result of recentForm) {
      if (result === streakType) {
        streakCount++;
      } else {
        break;
      }
    }

    // Update in Airtable via REST API (PATCH)
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${record.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Games Played': gamesPlayed,
          Wins: wins,
          Losses: losses,
          'Win Rate': Math.round(winRate * 10) / 10,
          'Total Points For': totalPointsFor,
          'Total Points Against': totalPointsAgainst,
          'Avg Points For': Math.round(avgPointsFor * 10) / 10,
          'Avg Points Against': Math.round(avgPointsAgainst * 10) / 10,
          'Avg Margin': Math.round(avgMargin * 10) / 10,
          'Spread Wins': spreadWins,
          'Spread Losses': spreadLosses,
          'Spread Pushes': spreadPushes,
          'Total Overs': totalOvers,
          'Total Unders': totalUnders,
          'Total Pushes': totalPushes,
          'ATS Win Rate': Math.round(atsWinRate * 10) / 10,
          'Over Rate': Math.round(overRate * 10) / 10,
          'Recent Form': JSON.stringify(recentForm),
          'Streak Type': streakType,
          'Streak Count': streakCount,
          'Last Game Date': game.gameDate,
        },
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Error updating player stats:', error);
      return null;
    }

    // Update cache
    const updatedPlayer: Player = {
      id: record.id,
      name: fields.Name || playerName,
      teamName: fields['Team Name'] || '',
      fullTeamName: fields['Full Team Name'] || '',
      gamesPlayed,
      wins,
      losses,
      winRate,
      totalPointsFor,
      totalPointsAgainst,
      avgPointsFor,
      avgPointsAgainst,
      avgMargin,
      spreadRecord: { wins: spreadWins, losses: spreadLosses, pushes: spreadPushes },
      totalRecord: { overs: totalOvers, unders: totalUnders, pushes: totalPushes },
      atsWinRate,
      overRate,
      recentForm,
      streak: { type: streakType, count: streakCount },
      isActive: fields['Is Active'] !== false,
      lastGameDate: game.gameDate,
      createdAt: record.createdTime || '',
      updatedAt: new Date().toISOString(),
    };

    playersCache.set(playerName, updatedPlayer);
    console.log(`📊 Updated stats for ${playerName}: ${wins}W-${losses}L`);
    return updatedPlayer;
  } catch (error) {
    console.error('Error updating player stats:', error);
    return null;
  }
}

/**
 * Process a historical game and update both players' stats
 */
export async function processGameForPlayerStats(game: HistoricalGame): Promise<void> {
  const homePlayer = extractPlayerName(game.homeTeam);
  const awayPlayer = extractPlayerName(game.awayTeam);

  if (!homePlayer || !awayPlayer) {
    console.log(`Could not extract players from game: ${game.awayTeam} @ ${game.homeTeam}`);
    return;
  }

  // Ensure both players exist
  await getOrCreatePlayer(game.homeTeam);
  await getOrCreatePlayer(game.awayTeam);

  const homeWon = game.winner === 'home';
  const awayWon = game.winner === 'away';

  // Update home player
  await updatePlayerStats(homePlayer, {
    isWin: homeWon,
    pointsFor: game.finalHomeScore,
    pointsAgainst: game.finalAwayScore,
    spreadResult: game.spreadResult === 'home_cover' ? 'win' : game.spreadResult === 'away_cover' ? 'loss' : 'push',
    totalResult: game.totalResult,
    gameDate: game.gameDate,
  });

  // Update away player
  await updatePlayerStats(awayPlayer, {
    isWin: awayWon,
    pointsFor: game.finalAwayScore,
    pointsAgainst: game.finalHomeScore,
    spreadResult: game.spreadResult === 'away_cover' ? 'win' : game.spreadResult === 'home_cover' ? 'loss' : 'push',
    totalResult: game.totalResult,
    gameDate: game.gameDate,
  });
}

/**
 * Get all players from Airtable via REST API
 */
export async function getAllPlayers(forceRefresh = false): Promise<Player[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (!forceRefresh && playersCache.size > 0 && now - cacheLastUpdated < CACHE_TTL) {
    return Array.from(playersCache.values());
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return Array.from(playersCache.values());
  }

  try {
    const allRecords: Array<{ id: string; fields: AirtablePlayerFields; createdTime?: string }> = [];
    let offset: string | undefined;

    // Paginate through all records
    do {
      const params = new URLSearchParams();
      params.append('sort[0][field]', 'Win Rate');
      params.append('sort[0][direction]', 'desc');
      params.append('pageSize', '100');
      if (offset) params.append('offset', offset);

      const response = await airtableRequest(`?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching players:', result);
        return Array.from(playersCache.values());
      }

      allRecords.push(...result.records);
      offset = result.offset;
    } while (offset);

    const players = allRecords.map(mapRecordToPlayer);

    // Update cache
    playersCache.clear();
    players.forEach((p) => playersCache.set(p.name, p));
    cacheLastUpdated = now;

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    return Array.from(playersCache.values());
  }
}

/**
 * Get a single player by name via REST API
 */
export async function getPlayer(name: string): Promise<Player | null> {
  // Check cache first
  if (playersCache.has(name)) {
    return playersCache.get(name)!;
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Name} = '${name}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    const result = await response.json();

    if (!response.ok || !result.records?.length) {
      return null;
    }

    const player = mapRecordToPlayer(result.records[0]);
    playersCache.set(name, player);
    return player;
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
}

/**
 * Get player leaderboard
 */
export async function getPlayerLeaderboard(
  sortBy: 'winRate' | 'gamesPlayed' | 'avgMargin' | 'atsWinRate' = 'winRate',
  limit = 10
): Promise<Player[]> {
  const players = await getAllPlayers();

  const sortField = {
    winRate: 'winRate',
    gamesPlayed: 'gamesPlayed',
    avgMargin: 'avgMargin',
    atsWinRate: 'atsWinRate',
  }[sortBy] as keyof Player;

  return players
    .filter((p) => p.gamesPlayed >= 5) // Minimum games threshold
    .sort((a, b) => (b[sortField] as number) - (a[sortField] as number))
    .slice(0, limit);
}

/**
 * Map REST API record to Player object
 */
function mapRecordToPlayer(record: { id: string; fields: AirtablePlayerFields; createdTime?: string }): Player {
  const fields = record.fields;

  let recentForm: ('W' | 'L')[] = [];
  try {
    recentForm = JSON.parse(fields['Recent Form'] || '[]');
  } catch {
    recentForm = [];
  }

  return {
    id: record.id,
    name: fields.Name || '',
    teamName: fields['Team Name'] || '',
    fullTeamName: fields['Full Team Name'] || '',
    gamesPlayed: fields['Games Played'] || 0,
    wins: fields.Wins || 0,
    losses: fields.Losses || 0,
    winRate: fields['Win Rate'] || 0,
    totalPointsFor: fields['Total Points For'] || 0,
    totalPointsAgainst: fields['Total Points Against'] || 0,
    avgPointsFor: fields['Avg Points For'] || 0,
    avgPointsAgainst: fields['Avg Points Against'] || 0,
    avgMargin: fields['Avg Margin'] || 0,
    spreadRecord: {
      wins: fields['Spread Wins'] || 0,
      losses: fields['Spread Losses'] || 0,
      pushes: fields['Spread Pushes'] || 0,
    },
    totalRecord: {
      overs: fields['Total Overs'] || 0,
      unders: fields['Total Unders'] || 0,
      pushes: fields['Total Pushes'] || 0,
    },
    atsWinRate: fields['ATS Win Rate'] || 0,
    overRate: fields['Over Rate'] || 0,
    recentForm,
    streak: {
      type: fields['Streak Type'] || 'W',
      count: fields['Streak Count'] || 0,
    },
    isActive: fields['Is Active'] !== false,
    lastGameDate: fields['Last Game Date'],
    createdAt: record.createdTime || '',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Clear the player cache
 */
export function clearPlayerCache(): void {
  playersCache.clear();
  cacheLastUpdated = 0;
}
