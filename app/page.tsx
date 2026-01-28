'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { LiveGame } from '@/types';

export default function LiveGamesPage() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'live'>('all');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/webhook/game-update');
      const data = await res.json();
      if (data.success) {
        setGames(data.games || []);
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
    const interval = setInterval(fetchGames, 5000);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'halftime': return 'bg-yellow-500';
      case 'scheduled': return 'bg-blue-500';
      case 'final': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getLead = (game: LiveGame) => {
    const diff = game.homeScore - game.awayScore;
    if (diff === 0) return { team: 'TIE', amount: 0 };
    if (diff > 0) return { team: game.homeTeam.split(' ')[0], amount: diff };
    return { team: game.awayTeam.split(' ')[0], amount: Math.abs(diff) };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-400" />
          <div>
            <h1 className="text-2xl font-bold">Live Games</h1>
            <p className="text-gray-400 text-sm">
              Real-time game tracking • Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={fetchGames}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Live', value: stats.live, color: 'text-green-400' },
          { label: 'Halftime', value: stats.halftime, color: 'text-yellow-400' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-400' },
          { label: 'Finished', value: stats.finished, color: 'text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-gray-700' : 'hover:bg-gray-700/50'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'live' ? 'bg-gray-700' : 'hover:bg-gray-700/50'
            }`}
          >
            Live Only
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addDemoGame}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Demo
          </button>
          <button
            onClick={clearFinished}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Finished
          </button>
        </div>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Activity className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-gray-400 mb-4">Games will appear here when N8N sends webhook updates</p>
          <button
            onClick={addDemoGame}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Add Demo Game
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => {
            const lead = getLead(game);
            const isExpanded = expandedGame === game.id;

            return (
              <div
                key={game.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
              >
                {/* Main Game Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{game.league}</span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`}></span>
                      <span className="text-sm">Q{game.quarter} - {game.timeRemaining}</span>
                    </div>
                    <button
                      onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Home Team */}
                    <div className="text-right">
                      <p className="font-semibold">{game.homeTeam}</p>
                      <p className="text-3xl font-bold">{game.homeScore}</p>
                    </div>

                    {/* VS / Lead */}
                    <div className="text-center">
                      <p className="text-gray-500 text-sm mb-1">VS</p>
                      <p className={`text-sm font-medium ${
                        lead.amount === 0 ? 'text-gray-400' : 'text-green-400'
                      }`}>
                        {lead.amount === 0 ? 'TIE' : `${lead.team} +${lead.amount}`}
                      </p>
                    </div>

                    {/* Away Team */}
                    <div className="text-left">
                      <p className="font-semibold">{game.awayTeam}</p>
                      <p className="text-3xl font-bold">{game.awayScore}</p>
                    </div>
                  </div>

                  {/* Betting Lines */}
                  <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
                    <span>Spread: {game.spread > 0 ? '+' : ''}{game.spread}</span>
                    <span>ML: {game.mlHome}</span>
                    <span>Total: {game.total}</span>
                  </div>
                </div>

                {/* Expanded Quarter Details */}
                {isExpanded && game.quarterScores && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Quarter Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left py-2 pr-4">Team</th>
                            <th className="text-center px-3">Q1</th>
                            <th className="text-center px-3">Q2</th>
                            <th className="text-center px-3 bg-yellow-500/10">Half</th>
                            <th className="text-center px-3">Q3</th>
                            <th className="text-center px-3">Q4</th>
                            <th className="text-center px-3 bg-green-500/10">Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2 pr-4 font-medium">{game.homeTeam.split(' ')[0]}</td>
                            <td className="text-center px-3">{game.quarterScores.q1Home}</td>
                            <td className="text-center px-3">{game.quarterScores.q2Home}</td>
                            <td className="text-center px-3 bg-yellow-500/10 font-medium">{game.halftimeScores?.home || '-'}</td>
                            <td className="text-center px-3">{game.quarterScores.q3Home}</td>
                            <td className="text-center px-3">{game.quarterScores.q4Home}</td>
                            <td className="text-center px-3 bg-green-500/10 font-bold">{game.finalScores?.home || game.homeScore}</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-medium">{game.awayTeam.split(' ')[0]}</td>
                            <td className="text-center px-3">{game.quarterScores.q1Away}</td>
                            <td className="text-center px-3">{game.quarterScores.q2Away}</td>
                            <td className="text-center px-3 bg-yellow-500/10 font-medium">{game.halftimeScores?.away || '-'}</td>
                            <td className="text-center px-3">{game.quarterScores.q3Away}</td>
                            <td className="text-center px-3">{game.quarterScores.q4Away}</td>
                            <td className="text-center px-3 bg-green-500/10 font-bold">{game.finalScores?.away || game.awayScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Event ID</p>
                        <p className="font-mono">{game.eventId || game.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Team IDs</p>
                        <p className="font-mono text-xs">H: {game.homeTeamId || 'N/A'} | A: {game.awayTeamId || 'N/A'}</p>
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
      <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
        <h3 className="font-medium mb-2">📡 Webhook Endpoint</h3>
        <code className="block bg-gray-900 p-3 rounded-lg text-sm text-green-400">
          POST /api/webhook/game-update
        </code>
        <p className="text-xs text-gray-400 mt-2">
          Configure N8N to send game updates to this endpoint. See deployment docs for full setup.
        </p>
      </div>
    </div>
  );
}
