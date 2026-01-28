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
  const [filter, setFilter] = useState<'all' | 'live'>('all');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  // Track previous scores to detect updates
  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [updatedGames, setUpdatedGames] = useState<Set<string>>(new Set());

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/webhook/game-update');
      const data = await res.json();
      if (data.success) {
        const newGames: GameWithMeta[] = data.games || [];

        // Detect score changes for animation
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
          // Clear after animation
          setTimeout(() => setUpdatedGames(new Set()), 1000);
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

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchGames, 3000); // Faster refresh for smoother updates
    return () => clearInterval(interval);
  }, [autoRefresh, fetchGames]);

  const addDemoGame = async () => {
    try {
      await fetch('/api/games/demo', { method: 'POST' });
      fetchGames();
    } catch (error) {
      console.error('Failed to add demo game:', error);
    }
  };

  const clearFinished = async () => {
    try {
      await fetch('/api/games/clear-finished', { method: 'POST' });
      fetchGames();
    } catch (error) {
      console.error('Failed to clear games:', error);
    }
  };

  const filteredGames = filter === 'live'
    ? games.filter(g => g.status === 'live' || g.status === 'halftime')
    : games;

  const stats = {
    total: games.length,
    live: games.filter(g => g.status === 'live').length,
    halftime: games.filter(g => g.status === 'halftime').length,
    scheduled: games.filter(g => g.status === 'scheduled').length,
    finished: games.filter(g => g.status === 'final').length,
  };

  const getTeamStatus = (game: GameWithMeta, isHome: boolean) => {
    const homeLead = game.homeScore - game.awayScore;
    if (homeLead === 0) return 'tied';
    if (isHome) return homeLead > 0 ? 'winning' : 'losing';
    return homeLead < 0 ? 'winning' : 'losing';
  };

  const getLead = (game: GameWithMeta) => {
    const diff = game.homeScore - game.awayScore;
    if (diff === 0) return { team: 'TIE', amount: 0, color: 'text-gray-400' };
    if (diff > 0) return { team: game.homeTeam.split(' ').pop(), amount: diff, color: 'text-emerald-400' };
    return { team: game.awayTeam.split(' ').pop(), amount: Math.abs(diff), color: 'text-emerald-400' };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            {autoRefresh && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1117] live-indicator" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Live Games</h1>
            <p className="text-sm text-gray-500">
              Real-time tracking • Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              autoRefresh
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={fetchGames}
            className="p-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'from-purple-500/20 to-blue-500/20', text: 'text-white', border: 'border-purple-500/30' },
          { label: 'Live', value: stats.live, color: 'from-emerald-500/20 to-cyan-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Halftime', value: stats.halftime, color: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
          { label: 'Scheduled', value: stats.scheduled, color: 'from-blue-500/20 to-indigo-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
          { label: 'Finished', value: stats.finished, color: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-400', border: 'border-gray-600/30' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`stats-card bg-gradient-to-br ${stat.color} border ${stat.border}`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.text} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 p-1 bg-gray-800/30 rounded-lg border border-gray-700/30">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-700/80 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'live'
                ? 'bg-gray-700/80 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Live Only
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addDemoGame}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Demo
          </button>
          <button
            onClick={clearFinished}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 border border-gray-700/50 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Finished
          </button>
        </div>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center mb-4">
            <Activity className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Games will appear here when N8N sends webhook updates. Add a demo game to test the interface.
          </p>
          <button onClick={addDemoGame} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Demo Game
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => {
            const lead = getLead(game);
            const isExpanded = expandedGame === game.id;
            const isUpdated = updatedGames.has(game.id);
            const homeStatus = getTeamStatus(game, true);
            const awayStatus = getTeamStatus(game, false);

            return (
              <div
                key={game.id}
                className={`game-card ${game.status === 'live' ? 'is-live' : ''} ${isUpdated ? 'recently-updated' : ''}`}
              >
                {/* Main Game Info */}
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${game.status}`}>
                        {game.status === 'live' && (
                          <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
                        )}
                        {game.status}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">
                        Q{game.quarter} • {game.timeRemaining}
                      </span>
                      <span className="text-xs text-gray-600 px-2 py-0.5 bg-gray-800/50 rounded">
                        {game.league}
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Scoreboard */}
                  <div className="grid grid-cols-3 gap-6 items-center">
                    {/* Home Team */}
                    <div className={`text-right py-3 px-4 rounded-lg transition-all ${
                      homeStatus === 'winning' ? 'team-winning' :
                      homeStatus === 'losing' ? 'team-losing' : 'team-tied'
                    }`}>
                      <p className="font-semibold text-lg">{game.homeTeam}</p>
                      <p className={`text-4xl font-bold score-value ${isUpdated ? 'updated' : ''}`}>
                        {game.homeScore}
                      </p>
                      {homeStatus === 'winning' && (
                        <span className="text-xs text-emerald-400 font-medium">LEADING</span>
                      )}
                    </div>

                    {/* Center - VS / Lead */}
                    <div className="text-center">
                      <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Lead</div>
                      <div className={`text-2xl font-bold ${lead.color}`}>
                        {lead.amount === 0 ? 'TIE' : `+${lead.amount}`}
                      </div>
                      {lead.amount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">{lead.team}</div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className={`text-left py-3 px-4 rounded-lg transition-all ${
                      awayStatus === 'winning' ? 'team-winning' :
                      awayStatus === 'losing' ? 'team-losing' : 'team-tied'
                    }`}>
                      <p className="font-semibold text-lg">{game.awayTeam}</p>
                      <p className={`text-4xl font-bold score-value ${isUpdated ? 'updated' : ''}`}>
                        {game.awayScore}
                      </p>
                      {awayStatus === 'winning' && (
                        <span className="text-xs text-emerald-400 font-medium">LEADING</span>
                      )}
                    </div>
                  </div>

                  {/* Betting Lines */}
                  <div className="flex justify-center gap-8 mt-5 pt-4 border-t border-gray-800/50">
                    <div className="text-center">
                      <span className="text-xs text-gray-600 uppercase">Spread</span>
                      <p className="text-sm font-medium text-gray-300">
                        {game.spread > 0 ? '+' : ''}{game.spread}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-gray-600 uppercase">ML Home</span>
                      <p className="text-sm font-medium text-gray-300">{game.mlHome}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-gray-600 uppercase">ML Away</span>
                      <p className="text-sm font-medium text-gray-300">{game.mlAway}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-gray-600 uppercase">Total</span>
                      <p className="text-sm font-medium text-gray-300">{game.total}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Quarter Details */}
                {isExpanded && game.quarterScores && (
                  <div className="border-t border-gray-800/50 p-5 bg-black/20">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                      Quarter Breakdown
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="quarter-table">
                        <thead>
                          <tr>
                            <th className="text-left">Team</th>
                            <th>Q1</th>
                            <th>Q2</th>
                            <th className="quarter-highlight">Half</th>
                            <th>Q3</th>
                            <th>Q4</th>
                            <th className="bg-emerald-500/10 rounded">Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={homeStatus === 'winning' ? 'text-emerald-400' : ''}>
                            <td className="text-left font-medium">{game.homeTeam.split(' ').pop()}</td>
                            <td>{game.quarterScores.q1Home}</td>
                            <td>{game.quarterScores.q2Home}</td>
                            <td className="quarter-highlight font-medium">{game.halftimeScores?.home || '-'}</td>
                            <td>{game.quarterScores.q3Home}</td>
                            <td>{game.quarterScores.q4Home}</td>
                            <td className="bg-emerald-500/10 font-bold">{game.finalScores?.home || game.homeScore}</td>
                          </tr>
                          <tr className={awayStatus === 'winning' ? 'text-emerald-400' : ''}>
                            <td className="text-left font-medium">{game.awayTeam.split(' ').pop()}</td>
                            <td>{game.quarterScores.q1Away}</td>
                            <td>{game.quarterScores.q2Away}</td>
                            <td className="quarter-highlight font-medium">{game.halftimeScores?.away || '-'}</td>
                            <td>{game.quarterScores.q3Away}</td>
                            <td>{game.quarterScores.q4Away}</td>
                            <td className="bg-emerald-500/10 font-bold">{game.finalScores?.away || game.awayScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Game Metadata */}
                    <div className="mt-5 pt-4 border-t border-gray-800/30 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Event ID</span>
                        <p className="font-mono text-xs text-gray-400 mt-1">{game.eventId || game.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Home ID</span>
                        <p className="font-mono text-xs text-gray-400 mt-1">{game.homeTeamId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Away ID</span>
                        <p className="font-mono text-xs text-gray-400 mt-1">{game.awayTeamId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Info */}
      <div className="mt-10 card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold">Webhook Endpoint</h3>
            <p className="text-sm text-gray-500">Configure N8N to send game updates</p>
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm border border-gray-800/50">
          <span className="text-emerald-400">POST</span>
          <span className="text-gray-400 ml-2">/api/webhook/game-update</span>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Games without updates for 20 seconds are automatically removed. Finished games persist until cleared.
        </p>
      </div>
    </div>
  );
}
