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
          <Bell className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Signals</h1>
            <p className="text-slate-500 text-sm">Track your betting signals • Synced from Airtable</p>
          </div>
        </div>
        <button
          onClick={fetchSignals}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Won</p>
          <p className="text-2xl font-bold text-green-600">{stats.won}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Lost</p>
          <p className="text-2xl font-bold text-red-500">{stats.lost}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Active</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Win Rate</p>
          <p className="text-2xl font-bold text-purple-600">{stats.winRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['active', 'today', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No signals found</h3>
          <p className="text-slate-500">Signals will appear here when strategies trigger on live games</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{signal.strategyName}</p>
                  <p className="text-sm text-slate-500">
                    {signal.homeTeam} vs {signal.awayTeam}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  signal.status === 'won' ? 'bg-green-100 text-green-700' :
                  signal.status === 'lost' ? 'bg-red-100 text-red-700' :
                  signal.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-600'
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
