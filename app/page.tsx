'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, RefreshCw, ChevronDown, Bell, Zap } from 'lucide-react';
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

        // Only update games if we got data OR if we had no games before
        // This prevents clearing the display when serverless function returns empty
        if (newGames.length > 0 || !hasGamesRef.current) {
          // Sort games consistently by eventId to prevent flashing/reordering
          const sortedGames = [...newGames].sort((a, b) => {
            // First sort by status: live > halftime > scheduled > final
            const statusOrder: Record<string, number> = { live: 0, halftime: 1, scheduled: 2, final: 3 };
            const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
            if (statusDiff !== 0) return statusDiff;

            // Then by eventId for stable ordering
            return (a.eventId || a.id).localeCompare(b.eventId || b.id);
          });
          setGames(sortedGames);
          hasGamesRef.current = sortedGames.length > 0;
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
      // Don't clear games on error - keep showing what we have
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Folder className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Live Games</h1>
            <p className="text-sm text-slate-500">Real-time game tracking with strategy triggers and live odds</p>
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

      {/* Games Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Active Games ({games.length})</span>
          <div className="flex gap-2">
            <button onClick={addDemoGame} className="text-xs text-purple-600 hover:text-purple-700 font-medium">
              + Add Demo
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={clearFinished} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
              Clear Finished
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 text-center">
            <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-2">No active games</p>
            <button onClick={addDemoGame} className="btn btn-primary">
              Add Demo Game
            </button>
          </div>
        ) : (
          <table className="games-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Player</th>
                <th>Team</th>
                <th style={{ width: '80px' }}>Score</th>
                <th style={{ width: '70px' }}>Lead</th>
                <th style={{ width: '120px' }}>Spread</th>
                <th style={{ width: '80px' }}>ML</th>
                <th style={{ width: '90px' }}>O/U</th>
                <th style={{ width: '70px' }}>Quarter</th>
                <th style={{ width: '70px' }}>Time</th>
                <th style={{ width: '80px' }}>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => {
                const isUpdated = updatedGames.has(game.id);
                const homeWinning = game.homeScore > game.awayScore;
                const awayWinning = game.awayScore > game.homeScore;
                const lead = Math.abs(game.homeScore - game.awayScore);
                const hasTrigger = game.status === 'live' && lead >= 10;

                // Extract player names from team strings like "OKC Thunder (KJMR)"
                const extractPlayerName = (teamStr: string) => {
                  const match = teamStr?.match(/\(([^)]+)\)/);
                  return match ? match[1] : teamStr;
                };
                const awayPlayer = extractPlayerName(game.awayTeam);
                const homePlayer = extractPlayerName(game.homeTeam);

                // Get just the team name without player
                const extractTeamName = (teamStr: string) => {
                  return teamStr?.replace(/\s*\([^)]+\)/, '') || teamStr;
                };
                const awayTeamName = extractTeamName(game.awayTeam);
                const homeTeamName = extractTeamName(game.homeTeam);

                return (
                  <tr key={game.id} className={isUpdated ? 'game-updated' : ''}>
                    {/* Expand */}
                    <td>
                      <ChevronDown className="expand-toggle w-4 h-4" />
                    </td>

                    {/* Players - stacked */}
                    <td>
                      <div className="team-cell">
                        <span className={`team-name ${awayWinning ? 'winning' : homeWinning ? 'losing' : ''}`}>
                          {awayPlayer}
                        </span>
                        <span className={`team-name ${homeWinning ? 'winning' : awayWinning ? 'losing' : ''}`}>
                          {homePlayer}
                        </span>
                      </div>
                    </td>

                    {/* Teams - stacked */}
                    <td>
                      <div className="team-cell">
                        <span className="team-info">{awayTeamName}</span>
                        <span className="team-info">{homeTeamName}</span>
                      </div>
                    </td>

                    {/* Scores - stacked */}
                    <td>
                      <div className="score-cell">
                        <span className={`score-value ${isUpdated ? 'updated' : ''}`}>
                          {game.awayScore}
                        </span>
                        <span className={`score-value ${isUpdated ? 'updated' : ''}`}>
                          {game.homeScore}
                        </span>
                      </div>
                    </td>

                    {/* Lead */}
                    <td className="text-center">
                      {lead > 0 && (
                        <span className="lead-value">{lead}</span>
                      )}
                    </td>

                    {/* Spread - stacked */}
                    <td>
                      <div className="line-cell">
                        <div>
                          <span className="line-value">
                            {game.spread > 0 ? '+' : ''}{game.spread}
                          </span>
                          <span className="line-juice ml-1">(-120)</span>
                        </div>
                        <div>
                          <span className="line-value">
                            {game.spread > 0 ? '' : '+'}{-game.spread}
                          </span>
                          <span className="line-juice ml-1">(-120)</span>
                        </div>
                      </div>
                    </td>

                    {/* Moneyline - stacked */}
                    <td>
                      <div className="line-cell">
                        <div className="line-value">{game.mlAway || '–'}</div>
                        <div className="line-value">{game.mlHome || '–'}</div>
                      </div>
                    </td>

                    {/* Over/Under - stacked */}
                    <td>
                      <div className="line-cell">
                        <div>
                          <span className="line-value">O</span>
                          <span className="ml-1">{game.total}</span>
                        </div>
                        <div>
                          <span className="line-value">U</span>
                          <span className="ml-1">{game.total}</span>
                        </div>
                      </div>
                    </td>

                    {/* Quarter */}
                    <td className="text-center">
                      <span className="quarter-badge">Q{game.quarter}</span>
                    </td>

                    {/* Time */}
                    <td className="text-center">
                      <span className="time-display">{game.timeRemaining}</span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${game.status}`}>
                        {game.status}
                      </span>
                    </td>

                    {/* Bell / Trigger */}
                    <td>
                      {hasTrigger ? (
                        <Zap className="trigger-icon" />
                      ) : (
                        <Bell className="bell-icon w-4 h-4" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
