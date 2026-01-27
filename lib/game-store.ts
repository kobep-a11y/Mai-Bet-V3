// MAI Bets V3 - In-Memory Game Store
// Real-time game data stored in memory for fast access
// This resets on server restart - historical data goes to Airtable

import type { LiveGame, LiveGameOdds } from '@/types';

// In-memory stores
const liveGames: Map<string, LiveGame> = new Map();
const gameOddsHistory: Map<string, LiveGameOdds[]> = new Map();
const halftimeScores: Map<string, { home: number; away: number }> = new Map();

// ============================================
// Game Management
// ============================================

export function updateGame(gameData: Partial<LiveGame> & { event_id: string }): LiveGame {
  const existingGame = liveGames.get(gameData.event_id);
  const now = new Date().toISOString();

  // Calculate leads
  const homeScore = gameData.home_score ?? existingGame?.home_score ?? 0;
  const awayScore = gameData.away_score ?? existingGame?.away_score ?? 0;
  const homeLead = homeScore - awayScore;
  const awayLead = awayScore - homeScore;

  // Track halftime scores
  if (gameData.status === 'halftime' || (gameData.quarter === 3 && existingGame?.quarter === 2)) {
    halftimeScores.set(gameData.event_id, { home: homeScore, away: awayScore });
  }

  const halftime = halftimeScores.get(gameData.event_id);

  const game: LiveGame = {
    id: existingGame?.id || `game_${gameData.event_id}`,
    event_id: gameData.event_id,
    league: gameData.league ?? existingGame?.league ?? 'NBA2K',
    home_team: gameData.home_team ?? existingGame?.home_team ?? '',
    away_team: gameData.away_team ?? existingGame?.away_team ?? '',
    home_score: homeScore,
    away_score: awayScore,
    quarter: gameData.quarter ?? existingGame?.quarter ?? 0,
    time_remaining: gameData.time_remaining ?? existingGame?.time_remaining ?? '',
    status: gameData.status ?? existingGame?.status ?? 'scheduled',
    spread_home: gameData.spread_home ?? existingGame?.spread_home ?? 0,
    spread_away: gameData.spread_away ?? existingGame?.spread_away ?? 0,
    moneyline_home: gameData.moneyline_home ?? existingGame?.moneyline_home ?? 0,
    moneyline_away: gameData.moneyline_away ?? existingGame?.moneyline_away ?? 0,
    total_line: gameData.total_line ?? existingGame?.total_line ?? 0,
    home_lead: homeLead,
    away_lead: awayLead,
    halftime_home_score: halftime?.home ?? existingGame?.halftime_home_score,
    halftime_away_score: halftime?.away ?? existingGame?.halftime_away_score,
    halftime_lead: halftime ? halftime.home - halftime.away : existingGame?.halftime_lead,
    created_at: existingGame?.created_at ?? now,
    updated_at: now,
  };

  liveGames.set(gameData.event_id, game);

  // Track odds history if odds changed
  if (
    gameData.spread_home !== undefined ||
    gameData.moneyline_home !== undefined ||
    gameData.total_line !== undefined
  ) {
    const oddsEntry: LiveGameOdds = {
      id: `odds_${gameData.event_id}_${Date.now()}`,
      game_id: game.id,
      spread_home: game.spread_home,
      spread_away: game.spread_away,
      moneyline_home: game.moneyline_home,
      moneyline_away: game.moneyline_away,
      total_line: game.total_line,
      timestamp: now,
    };

    const history = gameOddsHistory.get(gameData.event_id) || [];
    history.push(oddsEntry);

    // Keep only last 50 odds entries per game
    if (history.length > 50) {
      history.shift();
    }

    gameOddsHistory.set(gameData.event_id, history);
  }

  return game;
}

export function getGame(eventId: string): LiveGame | undefined {
  return liveGames.get(eventId);
}

export function getAllLiveGames(): LiveGame[] {
  return Array.from(liveGames.values())
    .filter(game => game.status === 'live' || game.status === 'halftime')
    .sort((a, b) => a.event_id.localeCompare(b.event_id));
}

export function getAllGames(): LiveGame[] {
  return Array.from(liveGames.values())
    .sort((a, b) => {
      // Sort by status first (live games first)
      const statusOrder = { live: 0, halftime: 1, scheduled: 2, finished: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by event_id
      return a.event_id.localeCompare(b.event_id);
    });
}

export function removeGame(eventId: string): boolean {
  const deleted = liveGames.delete(eventId);
  gameOddsHistory.delete(eventId);
  halftimeScores.delete(eventId);
  return deleted;
}

export function clearFinishedGames(): number {
  let count = 0;
  for (const [eventId, game] of liveGames.entries()) {
    if (game.status === 'finished') {
      removeGame(eventId);
      count++;
    }
  }
  return count;
}

// ============================================
// Odds History
// ============================================

export function getOddsHistory(eventId: string): LiveGameOdds[] {
  return gameOddsHistory.get(eventId) || [];
}

// ============================================
// Statistics
// ============================================

export function getGameStats(): {
  total: number;
  live: number;
  halftime: number;
  scheduled: number;
  finished: number;
} {
  const games = Array.from(liveGames.values());
  return {
    total: games.length,
    live: games.filter(g => g.status === 'live').length,
    halftime: games.filter(g => g.status === 'halftime').length,
    scheduled: games.filter(g => g.status === 'scheduled').length,
    finished: games.filter(g => g.status === 'finished').length,
  };
}

// ============================================
// Debug / Development
// ============================================

export function addDemoGame(): LiveGame {
  const demoId = `demo_${Date.now()}`;
  return updateGame({
    event_id: demoId,
    league: 'NBA2K',
    home_team: 'Lakers',
    away_team: 'Celtics',
    home_score: 45,
    away_score: 42,
    quarter: 2,
    time_remaining: '5:30',
    status: 'live',
    spread_home: -3.5,
    spread_away: 3.5,
    moneyline_home: -150,
    moneyline_away: 130,
    total_line: 185.5,
  });
}

export function clearAllGames(): void {
  liveGames.clear();
  gameOddsHistory.clear();
  halftimeScores.clear();
}
