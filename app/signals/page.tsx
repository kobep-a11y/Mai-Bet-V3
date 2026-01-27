'use client';

import { useState, useEffect } from 'react';
import { Bell, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Signal } from '@/types';

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'today' | 'all'>('active');

  const fetchSignals = async () => {
    try {
      setError(null);
      const endpoint = filter === 'all'
        ? '/api/signals'
        : `/api/signals?filter=${filter}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setSignals(data.data);
      } else {
        setError(data.error || 'Failed to load signals');
      }
    } catch (err) {
      setError('Failed to connect to Airtable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    // Auto-refresh active signals
    if (filter === 'active') {
      const interval = setInterval(fetchSignals, 5000);
      return () => clearInterval(interval);
    }
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'lost':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'active':
        return <TrendingUp className="w-5 h-5 text-mai-400 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'border-green-500 bg-green-500/10';
      case 'lost':
        return 'border-red-500 bg-red-500/10';
      case 'active':
        return 'border-mai-500 bg-mai-500/10';
      case 'pending':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-gray-600 bg-gray-800/50';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleString();
  };

  // Calculate stats
  const stats = {
    total: signals.length,
    won: signals.filter(s => s.status === 'won').length,
    lost: signals.filter(s => s.status === 'lost').length,
    active: signals.filter(s => s.status === 'active').length,
    pending: signals.filter(s => s.status === 'pending').length,
  };

  const winRate = stats.won + stats.lost > 0
    ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-mai-500" />
            Signals
          </h1>
          <p className="text-gray-400 mt-1">
            Track your betting signals • Synced from Airtable
          </p>
        </div>

        <button
          onClick={fetchSignals}
          className="px-4 py-2 rounded-lg bg-mai-500 text-white hover:bg-mai-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
          <p className="text-xs text-gray-500">Won</p>
          <p className="text-2xl font-bold text-green-400">{stats.won}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-red-500/30">
          <p className="text-xs text-gray-500">Lost</p>
          <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-mai-500/30">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-mai-400">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-yellow-500/30">
          <p className="text-xs text-gray-500">Win Rate</p>
          <p className="text-2xl font-bold text-yellow-400">{winRate}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-mai-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'today'
              ? 'bg-mai-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-mai-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Error</h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mai-500" />
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No signals found
          </h3>
          <p className="text-gray-500">
            Signals will appear here when strategies trigger on live games
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={`rounded-xl border-l-4 p-4 ${getStatusColor(signal.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(signal.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {signal.team.toUpperCase()} Team Signal
                      </h3>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                        {signal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Game: {signal.game_id}
                    </p>
                  </div>
                </div>

                {signal.result && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      signal.result === 'win'
                        ? 'bg-green-500 text-white'
                        : signal.result === 'loss'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {signal.result.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Entry Q</p>
                  <p className="text-white font-medium">Q{signal.entry_quarter}</p>
                </div>
                <div>
                  <p className="text-gray-500">Entry Lead</p>
                  <p className="text-white font-medium">
                    {signal.entry_lead > 0 ? '+' : ''}{signal.entry_lead}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Spread</p>
                  <p className="text-white font-medium">
                    {signal.entry_spread > 0 ? '+' : ''}{signal.entry_spread}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Moneyline</p>
                  <p className="text-white font-medium">
                    {signal.entry_moneyline > 0 ? '+' : ''}{signal.entry_moneyline}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
                <span>Entry: {formatTime(signal.entry_time)}</span>
                {signal.close_time && (
                  <span>Closed: {formatTime(signal.close_time)}</span>
                )}
                <div className="flex gap-2">
                  {signal.discord_sent && (
                    <span className="text-green-400">📣 Discord</span>
                  )}
                  {signal.sms_sent && (
                    <span className="text-blue-400">📱 SMS</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
