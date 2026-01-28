import { LiveGame } from '@/types';

class GameStore {
  private games: Map<string, LiveGame> = new Map();

  updateGame(id: string, game: LiveGame): void {
    this.games.set(id, {
      ...game,
      lastUpdate: new Date().toISOString(),
    });
  }

  getGame(id: string): LiveGame | undefined {
    return this.games.get(id);
  }

  getAllGames(): LiveGame[] {
    return Array.from(this.games.values()).sort((a, b) => {
      // Sort by status (live first, then halftime, then final)
      const statusOrder = { live: 0, halftime: 1, scheduled: 2, final: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }

  getLiveGames(): LiveGame[] {
    return this.getAllGames().filter(g => g.status === 'live' || g.status === 'halftime');
  }

  getFinishedGames(): LiveGame[] {
    return this.getAllGames().filter(g => g.status === 'final');
  }

  removeGame(id: string): boolean {
    return this.games.delete(id);
  }

  clearFinishedGames(): number {
    const finished = this.getFinishedGames();
    finished.forEach(g => this.games.delete(g.id));
    return finished.length;
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

  // Add demo game for testing
  addDemoGame(): LiveGame {
    const demoId = `demo-${Date.now()}`;
    const demoGame: LiveGame = {
      id: demoId,
      eventId: demoId,
      league: 'NBA2K',
      homeTeam: 'LA Lakers (DEMO)',
      awayTeam: 'BOS Celtics (DEMO)',
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
      lastUpdate: new Date().toISOString(),
    };
    this.updateGame(demoId, demoGame);
    return demoGame;
  }
}

// Singleton instance
export const gameStore = new GameStore();
