'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Bell, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { LiveGame } from '@/types';

interface GameWithMeta extends Omit<LiveGame, 'lastUpdate'> {
  createdAt?: string;
  lastUpdate?: string;
}

export default function LiveGamesPage() {
  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [updatedGames, setUpdatedGames] = useState<Set<string>>(new Set());
  const hasGamesRef = useRef(false);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/webhook/game-update');
      const data = await res.json();
      if (data.success && Array.isArray(data.games)) {
        const newGames: GameWithMeta[] = data.games;
        const newUpdated = new Set<string>();

        newGames.forEach(game => {
          const prev = prevScoresRef.current.get(game.id);
          if (prev && (prev.home !== game.homeScore || prev.away !== game.awayScore)) {
            newUpdated.add(game.id);
          }
          prevScoresRef.current.set(game.id, { home: game.homeScore, away: game.awayScore });
        });

        if (newUpdated.size > 0) {
          setUpdatedGames(newUpdated);
          setTimeout(() => setUpdatedGames(new Set()), 800);
        }

        if (newGames.length > 0 || !hasGamesRef.current) {
          const activeGames = newGames.filter((game) => {
            if (game.status === 'final') return false;
            if (game.status === 'scheduled') return false;
            if (game.homeScore > 0 || game.awayScore > 0) return true;
            if (game.quarter === 1 && game.timeRemaining === '12:00') return false;
            return true;
          });

          const sortedGames = [...activeGames].sort((a, b) => {
            const statusOrder: Record<string, number> = { live: 0, halftime: 1, final: 2 };
            const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return (a.eventId || a.id).localeCompare(b.eventId || b.id);
          });
          setGames(sortedGames);
          hasGamesRef.current = sortedGames.length > 0;
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchGames, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchGames]);

  const addDemoGame = async () => {
    await fetch('/api/games/demo', { method: 'POST' });
    fetchGames();
  };

  const clearFinished = async () => {
    await fetch('/api/games/clear-finished', { method: 'POST' });
    fetchGames();
  };

  // Helpers
  const extractPlayerName = (teamStr: string) => {
    const match = teamStr?.match(/\(([^)]+)\)/);
    return match ? match[1] : teamStr;
  };

  const extractTeamName = (teamStr: string) => {
    return teamStr?.replace(/\s*\([^)]+\)/, '') || teamStr;
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-card"
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <Activity className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-gradient">Live Games</h1>
            <p className="text-sm font-medium mt-1" style={{ color: '#718096' }}>
              Real-time tracking with AI strategy triggers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGames}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <span className="live-indicator">Live</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span className="font-semibold">Active Games ({games.length})</span>
          <div className="flex gap-2">
            <button
              onClick={addDemoGame}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors"
            >
              + Add Demo
            </button>
            <span style={{ color: '#E2E8F0' }}>|</span>
            <button
              onClick={clearFinished}
              className="text-xs hover:text-indigo-600 font-medium transition-colors"
              style={{ color: '#718096' }}
            >
              Clear Finished
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="p-16 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: '#E2E8F0' }} />
            <p className="font-medium mb-3" style={{ color: '#718096' }}>No active games</p>
            <button onClick={addDemoGame} className="btn btn-primary">
              Add Demo Game
            </button>
          </div>
        ) : (
          <div className="p-6">
            {games.map(game => {
              const isUpdated = updatedGames.has(game.id);
              const homeWinning = game.homeScore > game.awayScore;
              const awayWinning = game.awayScore > game.homeScore;
              const lead = Math.abs(game.homeScore - game.awayScore);
              const hasTrigger = game.status === 'live' && lead >= 10;

              const awayPlayer = extractPlayerName(game.awayTeam);
              const homePlayer = extractPlayerName(game.homeTeam);
              const awayTeamName = extractTeamName(game.awayTeam);
              const homeTeamName = extractTeamName(game.homeTeam);

              const isLive = game.status === 'live';

              return (
                <div
                  key={game.id}
                  className={`${isLive ? 'game-card-live' : 'game-card'} ${isUpdated ? 'game-row-flash' : ''}`}
                >
                  {/* Game Card Grid Layout */}
                  <div className="grid grid-cols-12 gap-6 items-center">

                    {/* Status Badge & Quarter - Col 1-2 */}
                    <div className="col-span-2 flex flex-col gap-2 items-center">
                      <span className={`status-badge ${game.status}`}>
                        {game.status}
                      </span>
                      <span className="quarter-badge">Q{game.quarter}</span>
                      <span className="time-display text-xs">{game.timeRemaining}</span>
                    </div>

                    {/* Teams & Scores - Col 3-6 */}
                    <div className="col-span-4 space-y-3">
                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`team-name ${awayWinning ? 'winning' : homeWinning ? 'losing' : ''}`}>
                            {awayPlayer}
                          </div>
                          <div className="team-info">{awayTeamName}</div>
                        </div>
                        <div className={`score-value ${awayWinning ? 'winning' : homeWinning ? 'losing' : ''} ${isUpdated ? 'updated' : ''}`}>
                          {game.awayScore}
                        </div>
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`team-name ${homeWinning ? 'winning' : awayWinning ? 'losing' : ''}`}>
                            {homePlayer}
                          </div>
                          <div className="team-info">{homeTeamName}</div>
                        </div>
                        <div className={`score-value ${homeWinning ? 'winning' : awayWinning ? 'losing' : ''} ${isUpdated ? 'updated' : ''}`}>
                          {game.homeScore}
                        </div>
                      </div>

                      {/* Lead Indicator */}
                      {lead > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          {awayWinning ? <TrendingUp className="w-3 h-3 text-coral-500" /> : <TrendingDown className="w-3 h-3 text-slate-400" />}
                          <span className={`text-xs font-semibold ${lead === 0 ? 'text-slate-400' : 'text-coral-500'}`}>
                            Lead: {lead}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Betting Lines - Col 7-10 */}
                    <div className="col-span-4 grid grid-cols-3 gap-3">
                      {/* Spread */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>Spread</span>
                        <div className="flex flex-col gap-1">
                          <span className="odds-badge text-xs">
                            {game.spread > 0 ? '+' : ''}{game.spread}
                          </span>
                          <span className="odds-badge text-xs">
                            {game.spread > 0 ? '' : '+'}{-game.spread}
                          </span>
                        </div>
                      </div>

                      {/* Moneyline */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>ML</span>
                        <div className="flex flex-col gap-1">
                          <span className={`odds-badge text-xs ${(game.mlAway && game.mlAway > 0) ? 'positive' : 'negative'}`}>
                            {game.mlAway || '–'}
                          </span>
                          <span className={`odds-badge text-xs ${(game.mlHome && game.mlHome > 0) ? 'positive' : 'negative'}`}>
                            {game.mlHome || '–'}
                          </span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>O/U</span>
                        <div className="flex flex-col gap-1">
                          <span className="odds-badge text-xs">O {game.total}</span>
                          <span className="odds-badge text-xs">U {game.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Col 11-12 */}
                    <div className="col-span-2 flex flex-col items-center gap-2">
                      {hasTrigger ? (
                        <div className="flex flex-col items-center gap-1">
                          <Zap className="trigger-icon w-6 h-6" />
                          <span className="text-xs font-bold text-amber-600">Trigger!</span>
                        </div>
                      ) : (
                        <Bell className="bell-icon w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
