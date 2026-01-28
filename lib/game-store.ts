import { LiveGame } from '@/types';

interface GameWithMeta extends LiveGame {
  createdAt: string;
  lastUpdate: string;
}

class GameStore {
  private games: Map<string, GameWithMeta> = new Map();
  private staleTimeout: number = 120000; // 2 minutes (increased for webhook reliability)

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
      // Sort by: status priority, then by eventId for STABLE ordering
      const statusOrder: Record<string, number> = { live: 0, halftime: 1, scheduled: 2, final: 3 };
      const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
      if (statusDiff !== 0) return statusDiff;

      // Use eventId for stable ordering (prevents flashing/reordering)
      return (a.eventId || a.id).localeCompare(b.eventId || b.id);
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

    for (const [id, game] of Array.from(this.games.entries())) {
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
