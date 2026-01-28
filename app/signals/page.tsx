'use client';

import { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { Signal } from '@/types';

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'today' | 'all'>('active');

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/signals');
      const data = await res.json();
      if (data.success) {
        setSignals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const stats = {
    total: signals.length,
    won: signals.filter(s => s.status === 'won').length,
    lost: signals.filter(s => s.status === 'lost').length,
    active: signals.filter(s => s.status === 'active').length,
    winRate: signals.length > 0
      ? Math.round((signals.filter(s => s.status === 'won').length / signals.filter(s => s.status !== 'active').length) * 100) || 0
      : 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold">Signals</h1>
            <p className="text-gray-400 text-sm">Track your betting signals • Synced from Airtable</p>
          </div>
        </div>
        <button
          onClick={fetchSignals}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase">Won</p>
          <p className="text-2xl font-bold text-green-400">{stats.won}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase">Lost</p>
          <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase">Win Rate</p>
          <p className="text-2xl font-bold text-purple-400">{stats.winRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['active', 'today', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === f ? 'bg-gray-700' : 'hover:bg-gray-700/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Bell className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No signals found</h3>
          <p className="text-gray-400">Signals will appear here when strategies trigger on live games</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{signal.strategyName}</p>
                  <p className="text-sm text-gray-400">
                    {signal.homeTeam} vs {signal.awayTeam}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  signal.status === 'won' ? 'bg-green-500/20 text-green-400' :
                  signal.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                  signal.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {signal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
