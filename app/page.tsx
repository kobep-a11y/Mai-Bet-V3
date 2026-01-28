'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import { LiveGame } from '@/types';

interface GameWithMeta extends LiveGame {
  createdAt?: string;
  lastUpdate?: string;
}

export default function LiveGamesPage() {
  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [updatedGames, setUpdatedGames] = useState<Set<string>>(new Set());

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/webhook/game-update');
      const data = await res.json();
      if (data.success) {
        const newGames: GameWithMeta[] = data.games || [];
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

        setGames(newGames);
        setLastUpdate(new Date());
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

  const stats = {
    total: games.length,
    live: games.filter(g => g.status === 'live').length,
    halftime: games.filter(g => g.status === 'halftime').length,
    final: games.filter(g => g.status === 'final').length,
  };

  return (
    <div className="p-5">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-green-400" />
          <div>
            <h1 className="text-lg font-semibold">Live Games</h1>
            <p className="text-xs text-slate-400">{lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${
              autoRefresh ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {autoRefresh ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={fetchGames} className="p-1.5 hover:bg-slate-700 rounded">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={addDemoGame} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">
            <Plus className="w-3 h-3" /> Demo
          </button>
          <button onClick={clearFinished} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-400">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="flex gap-4 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Live', value: stats.live, color: 'text-green-400' },
          { label: 'Half', value: stats.halftime, color: 'text-yellow-400' },
          { label: 'Final', value: stats.final, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Games List - Compact */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No games. Click Demo to add test data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map(game => {
            const isExpanded = expandedGame === game.id;
            const isUpdated = updatedGames.has(game.id);
            const homeWinning = game.homeScore > game.awayScore;
            const awayWinning = game.awayScore > game.homeScore;
            const lead = Math.abs(game.homeScore - game.awayScore);

            return (
              <div
                key={game.id}
                className={`game-card ${game.status === 'live' ? 'is-live' : ''} ${isUpdated ? 'recently-updated' : ''}`}
              >
                {/* Compact Main Row */}
                <div
                  className="flex items-center px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                >
                  {/* Status */}
                  <div className="w-16 shrink-0">
                    <span className={`status-badge ${game.status}`}>
                      {game.status === 'live' && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
                      {game.status}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="w-20 text-center shrink-0">
                    <span className="text-xs text-slate-400">Q{game.quarter}</span>
                    <span className="text-xs text-slate-500 ml-1">{game.timeRemaining}</span>
                  </div>

                  {/* Away Team */}
                  <div className={`flex-1 text-right pr-3 ${awayWinning ? 'team-winning' : homeWinning ? 'team-losing' : ''}`}>
                    <span className="text-sm font-medium">{game.awayTeam}</span>
                  </div>

                  {/* Away Score */}
                  <div className={`w-10 text-center ${awayWinning ? 'team-winning' : ''}`}>
                    <span className={`text-lg font-bold score-value ${isUpdated ? 'updated' : ''}`}>
                      {game.awayScore}
                    </span>
                  </div>

                  {/* VS */}
                  <div className="w-8 text-center text-xs text-slate-600">@</div>

                  {/* Home Score */}
                  <div className={`w-10 text-center ${homeWinning ? 'team-winning' : ''}`}>
                    <span className={`text-lg font-bold score-value ${isUpdated ? 'updated' : ''}`}>
                      {game.homeScore}
                    </span>
                  </div>

                  {/* Home Team */}
                  <div className={`flex-1 pl-3 ${homeWinning ? 'team-winning' : awayWinning ? 'team-losing' : ''}`}>
                    <span className="text-sm font-medium">{game.homeTeam}</span>
                  </div>

                  {/* Lead */}
                  <div className="w-16 text-center shrink-0">
                    {lead > 0 && (
                      <span className="text-xs text-green-400 font-medium">+{lead}</span>
                    )}
                  </div>

                  {/* Lines */}
                  <div className="w-24 text-right text-xs text-slate-500 shrink-0 hidden lg:block">
                    <span>Sprd {game.spread > 0 ? '+' : ''}{game.spread}</span>
                  </div>

                  {/* Expand */}
                  <div className="w-8 text-right shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-700/50">
                    <div className="flex gap-6 text-xs">
                      {/* Quarter Scores */}
                      {game.quarterScores && (
                        <div className="flex-1">
                          <table className="quarter-table">
                            <thead>
                              <tr className="text-slate-500">
                                <th className="text-left w-20">Team</th>
                                <th>Q1</th>
                                <th>Q2</th>
                                <th className="text-yellow-400/60">H</th>
                                <th>Q3</th>
                                <th>Q4</th>
                                <th className="text-green-400/60">F</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-300">
                              <tr className={homeWinning ? 'text-green-400' : ''}>
                                <td className="text-left font-medium">{game.homeTeam.split(' ').pop()}</td>
                                <td>{game.quarterScores.q1Home}</td>
                                <td>{game.quarterScores.q2Home}</td>
                                <td className="text-yellow-400/80">{game.halftimeScores?.home || '-'}</td>
                                <td>{game.quarterScores.q3Home}</td>
                                <td>{game.quarterScores.q4Home}</td>
                                <td className="font-bold">{game.homeScore}</td>
                              </tr>
                              <tr className={awayWinning ? 'text-green-400' : ''}>
                                <td className="text-left font-medium">{game.awayTeam.split(' ').pop()}</td>
                                <td>{game.quarterScores.q1Away}</td>
                                <td>{game.quarterScores.q2Away}</td>
                                <td className="text-yellow-400/80">{game.halftimeScores?.away || '-'}</td>
                                <td>{game.quarterScores.q3Away}</td>
                                <td>{game.quarterScores.q4Away}</td>
                                <td className="font-bold">{game.awayScore}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Betting Lines */}
                      <div className="flex gap-4 text-slate-400 items-center">
                        <div className="text-center">
                          <div className="text-slate-600 text-[10px]">SPREAD</div>
                          <div>{game.spread > 0 ? '+' : ''}{game.spread}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-600 text-[10px]">ML</div>
                          <div>{game.mlHome}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-600 text-[10px]">TOTAL</div>
                          <div>{game.total}</div>
                        </div>
                      </div>
                    </div>

                    {/* IDs */}
                    <div className="mt-2 pt-2 border-t border-slate-700/30 text-[10px] text-slate-600 flex gap-4">
                      <span>ID: {game.eventId || game.id}</span>
                      <span>Home: {game.homeTeamId || 'N/A'}</span>
                      <span>Away: {game.awayTeamId || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Endpoint - Compact */}
      <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-500">Webhook:</span>
            <code className="ml-2 text-green-400">POST /api/webhook/game-update</code>
          </div>
          <span className="text-[10px] text-slate-600">20s stale timeout</span>
        </div>
      </div>
    </div>
  );
}
