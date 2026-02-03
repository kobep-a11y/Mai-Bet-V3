'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Wifi, WifiOff, Pause, Play } from 'lucide-react';
import { LiveGame, Strategy } from '@/types';
import { LiveGameCard } from '@/components/live-game-card';

interface GameWithMeta extends Omit<LiveGame, 'lastUpdate'> {
  createdAt?: string;
  lastUpdate?: string;
}

const REFRESH_INTERVAL = 3000; // 3 seconds

export default function LiveGamesPage() {
  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL / 1000);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [updatedGames, setUpdatedGames] = useState<Set<string>>(new Set());
  const hasGamesRef = useRef(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Strategy state
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const fetchGames = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setConnectionStatus('connecting');

    try {
      const res = await fetch('/api/webhook/game-update');
      const data = await res.json();

      if (data.success && Array.isArray(data.games)) {
        setConnectionStatus('connected');
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
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setNextRefreshIn(REFRESH_INTERVAL / 1000);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  // Fetch strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await fetch('/api/strategies');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setStrategies(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
      }
    };
    fetchStrategies();
  }, []);

  // Auto-refresh with countdown
  useEffect(() => {
    if (!autoRefresh) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          fetchGames();
          return REFRESH_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, fetchGames]);

  // Pause auto-refresh when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoRefresh(false);
      } else {
        setAutoRefresh(true);
        fetchGames();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchGames]);

  const addDemoGame = async () => {
    await fetch('/api/games/demo', { method: 'POST' });
    fetchGames();
  };

  const clearFinished = async () => {
    await fetch('/api/games/clear-finished', { method: 'POST' });
    fetchGames();
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
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : connectionStatus === 'connecting' ? (
              <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-slate-600">
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-xs font-medium">
              {autoRefresh ? `${nextRefreshIn}s` : 'Paused'}
            </span>
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => fetchGames(true)}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
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
            {games.map(game => (
              <LiveGameCard
                key={game.id}
                game={game}
                strategies={strategies}
                isUpdated={updatedGames.has(game.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
