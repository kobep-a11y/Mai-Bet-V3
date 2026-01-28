import { LiveGame } from '@/types';

interface GameWithMeta extends LiveGame {
  createdAt: string;
  lastUpdate: string;
}

class GameStore {
  private games: Map<string, GameWithMeta> = new Map();
  private staleTimeout: number = 20000; // 20 seconds

  updateGame(id: string, game: LiveGame): void {
    const existing = this.games.get(id);
    const now = new Date().toISOString();

    this.games.set(id, {
      ...game,
      createdAt: existing?.createdAt || now,
      lastUpdate: now,
    });
  }

  getGame(id: string): GameWithMeta | undefined {
    return this.games.get(id);
  }

  getAllGames(): GameWithMeta[] {
    // Remove stale games first
    this.removeStaleGames();

    return Array.from(this.games.values()).sort((a, b) => {
      // Sort by: status priority, then by quarter (higher = closer to end), then by time (lower = closer to end)
      const statusOrder: Record<string, number> = { final: 0, live: 1, halftime: 2, scheduled: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // For live games: higher quarter = closer to end (should be at top)
      if (a.status === 'live' && b.status === 'live') {
        const quarterDiff = b.quarter - a.quarter;
        if (quarterDiff !== 0) return quarterDiff;

        // Same quarter: lower time remaining = closer to end (should be at top)
        const timeA = this.parseTimeRemaining(a.timeRemaining);
        const timeB = this.parseTimeRemaining(b.timeRemaining);
        return timeA - timeB;
      }

      // For scheduled: older created = should be at top
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private parseTimeRemaining(time: string): number {
    const parts = time.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }

  getLiveGames(): GameWithMeta[] {
    return this.getAllGames().filter(g => g.status === 'live' || g.status === 'halftime');
  }

  getFinishedGames(): GameWithMeta[] {
    return this.getAllGames().filter(g => g.status === 'final');
  }

  removeGame(id: string): boolean {
    return this.games.delete(id);
  }

  removeStaleGames(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, game] of this.games.entries()) {
      const lastUpdate = new Date(game.lastUpdate).getTime();
      const timeSinceUpdate = now - lastUpdate;

      // Only remove live/halftime games that haven't been updated
      // Keep scheduled and final games
      if ((game.status === 'live' || game.status === 'halftime') && timeSinceUpdate > this.staleTimeout) {
        this.games.delete(id);
        removed++;
        console.log(`Removed stale game: ${id} (${timeSinceUpdate}ms since last update)`);
      }
    }

    return removed;
  }

  clearFinishedGames(): number {
    const finished = this.getFinishedGames();
    finished.forEach(g => this.games.delete(g.id));
    return finished.length;
  }

  clearAllGames(): number {
    const count = this.games.size;
    this.games.clear();
    return count;
  }

  getGameCount(): { total: number; live: number; halftime: number; scheduled: number; finished: number } {
    const games = this.getAllGames();
    return {
      total: games.length,
      live: games.filter(g => g.status === 'live').length,
      halftime: games.filter(g => g.status === 'halftime').length,
      scheduled: games.filter(g => g.status === 'scheduled').length,
      finished: games.filter(g => g.status === 'final').length,
    };
  }

  setStaleTimeout(ms: number): void {
    this.staleTimeout = ms;
  }

  // Add demo game for testing
  addDemoGame(): GameWithMeta {
    const demoId = `demo-${Date.now()}`;
    const now = new Date().toISOString();
    const demoGame: GameWithMeta = {
      id: demoId,
      eventId: demoId,
      league: 'NBA2K',
      homeTeam: 'LA Lakers',
      awayTeam: 'BOS Celtics',
      homeTeamId: 'demo-lakers',
      awayTeamId: 'demo-celtics',
      homeScore: 58,
      awayScore: 54,
      quarter: 3,
      timeRemaining: '4:30',
      status: 'live',
      quarterScores: {
        q1Home: 22,
        q1Away: 18,
        q2Home: 16,
        q2Away: 20,
        q3Home: 20,
        q3Away: 16,
        q4Home: 0,
        q4Away: 0,
      },
      halftimeScores: {
        home: 38,
        away: 38,
      },
      finalScores: {
        home: 0,
        away: 0,
      },
      spread: -3.5,
      mlHome: -150,
      mlAway: 130,
      total: 210.5,
      lastUpdate: now,
      createdAt: now,
    };
    this.games.set(demoId, demoGame);
    return demoGame;
  }
}

// Singleton instance
export const gameStore = new GameStore();
