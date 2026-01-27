'use client';

import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Plus, Trash2 } from 'lucide-react';
import GameCard from '@/components/GameCard';
import type { LiveGame } from '@/types';

interface GamesResponse {
  success: boolean;
  data: {
    games: LiveGame[];
    stats: {
      total: number;
      live: number;
      halftime: number;
      scheduled: number;
      finished: number;
    };
  };
  timestamp: string;
}

export default function LiveGamesPage() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    halftime: 0,
    scheduled: 0,
    finished: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'live'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchGames = async () => {
    try {
      const response = await fetch(`/api/games?filter=${filter}`);
      const data: GamesResponse = await response.json();

      if (data.success) {
        setGames(data.data.games);
        setStats(data.data.stats);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDemoGame = async () => {
    try {
      await fetch('/api/games?action=demo');
      fetchGames();
    } catch (error) {
      console.error('Failed to add demo game:', error);
    }
  };

  const clearFinished = async () => {
    try {
      await fetch('/api/games?action=clear');
      fetchGames();
    } catch (error) {
      console.error('Failed to clear games:', error);
    }
  };

  useEffect(() => {
    fetchGames();

    // Auto-refresh every 2 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchGames, 2000);
      return () => clearInterval(interval);
    }
  }, [filter, autoRefresh]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-mai-500" />
            Live Games
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time game tracking • Last update: {lastUpdate || 'Loading...'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchGames}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
          <p className="text-xs text-gray-500">Live</p>
          <p className="text-2xl font-bold text-green-400">{stats.live}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-yellow-500/30">
          <p className="text-xs text-gray-500">Halftime</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.halftime}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/30">
          <p className="text-xs text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
          <p className="text-xs text-gray-500">Finished</p>
          <p className="text-2xl font-bold text-gray-400">{stats.finished}</p>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-mai-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'live'
                ? 'bg-mai-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Live Only
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addDemoGame}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Demo
          </button>
          <button
            onClick={clearFinished}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear Finished
          </button>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mai-500" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No games found
          </h3>
          <p className="text-gray-500 mb-4">
            Games will appear here when N8N sends webhook updates
          </p>
          <button
            onClick={addDemoGame}
            className="px-4 py-2 rounded-lg bg-mai-500 text-white hover:bg-mai-600 transition-colors"
          >
            Add Demo Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.event_id} game={game} />
          ))}
        </div>
      )}

      {/* Webhook Info */}
      <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">
          📡 Webhook Endpoint
        </h3>
        <code className="text-xs text-mai-400 bg-gray-900 px-2 py-1 rounded">
          POST /api/webhook/game-update
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Configure N8N to send game updates to this endpoint. See deployment docs for full setup.
        </p>
      </div>
    </div>
  );
}
