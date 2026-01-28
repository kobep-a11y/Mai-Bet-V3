'use client';

import { useState, useEffect } from 'react';
import { Bell, RefreshCw, Clock, CheckCircle, XCircle, Eye, Zap, AlertCircle } from 'lucide-react';
import { Signal, SignalStatus } from '@/types';

// Status configuration with icons and colors
const STATUS_CONFIG: Record<SignalStatus, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  monitoring: {
    icon: <Eye className="w-4 h-4" />,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Monitoring',
  },
  watching: {
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Watching for Odds',
  },
  bet_taken: {
    icon: <Zap className="w-4 h-4" />,
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Bet Taken',
  },
  expired: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Expired',
  },
  won: {
    icon: <CheckCircle className="w-4 h-4" />,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    label: 'Won',
  },
  lost: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Lost',
  },
  pushed: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    label: 'Pushed',
  },
  closed: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Closed',
  },
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'live' | 'completed' | 'all'>('all');

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
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const stats = {
    total: signals.length,
    monitoring: signals.filter(s => s.status === 'monitoring').length,
    watching: signals.filter(s => s.status === 'watching').length,
    betTaken: signals.filter(s => s.status === 'bet_taken').length,
    expired: signals.filter(s => s.status === 'expired').length,
    won: signals.filter(s => s.status === 'won').length,
    lost: signals.filter(s => s.status === 'lost').length,
  };

  // Calculate live signals (monitoring + watching)
  const liveCount = stats.monitoring + stats.watching;

  // Win rate calculation (only for completed bets)
  const completedBets = stats.won + stats.lost;
  const winRate = completedBets > 0 ? Math.round((stats.won / completedBets) * 100) : 0;

  // Bet success rate (how often we actually got to bet when trigger fired)
  const triggeredSignals = stats.betTaken + stats.expired + stats.won + stats.lost;
  const betSuccessRate = triggeredSignals > 0
    ? Math.round(((stats.betTaken + stats.won + stats.lost) / triggeredSignals) * 100)
    : 0;

  // Filter signals
  const filteredSignals = signals.filter(signal => {
    if (filter === 'live') {
      return signal.status === 'monitoring' || signal.status === 'watching';
    }
    if (filter === 'completed') {
      return ['bet_taken', 'expired', 'won', 'lost', 'pushed', 'closed'].includes(signal.status);
    }
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Signal Tracker</h1>
            <p className="text-slate-500 text-sm">Two-stage signal lifecycle • Auto-refreshes every 10s</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <p className="text-xs text-blue-500 uppercase font-medium">🔵 Monitoring</p>
          <p className="text-2xl font-bold text-blue-600">{stats.monitoring}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-600 uppercase font-medium">🟡 Watching</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.watching}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 uppercase font-medium">🟢 Bet Taken</p>
          <p className="text-2xl font-bold text-green-600">{stats.betTaken}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
          <p className="text-xs text-red-500 uppercase font-medium">🔴 Expired</p>
          <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <p className="text-xs text-purple-600 uppercase font-medium">Bet Rate</p>
          <p className="text-2xl font-bold text-purple-600">{betSuccessRate}%</p>
        </div>
      </div>

      {/* Win/Loss Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <p className="text-xs text-emerald-600 uppercase font-medium">Won</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.won}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-xs text-red-600 uppercase font-medium">Lost</p>
          <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-purple-600 uppercase font-medium">Win Rate</p>
          <p className="text-2xl font-bold text-purple-600">{winRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'all', label: 'All Signals' },
          { key: 'live', label: `Live (${liveCount})` },
          { key: 'completed', label: 'Completed' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === key
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No signals found</h3>
          <p className="text-slate-500">Signals will appear here when strategies trigger on live games</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.closed;

            return (
              <div
                key={signal.id}
                className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{signal.strategyName}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {signal.awayTeam} @ {signal.homeTeam}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Q{signal.quarter} {signal.timeRemaining} • Score: {signal.awayScore}-{signal.homeScore}
                    </p>
                  </div>

                  <div className="text-right">
                    {/* Odds info */}
                    {signal.requiredSpread !== undefined && (
                      <div className="text-xs text-slate-500">
                        Required: <span className="font-medium">{signal.requiredSpread}</span>
                      </div>
                    )}
                    {signal.actualSpreadAtEntry !== undefined && (
                      <div className="text-xs text-green-600">
                        Entry: <span className="font-medium">{signal.actualSpreadAtEntry}</span>
                      </div>
                    )}
                    {signal.leadingTeamAtTrigger && (
                      <div className="text-xs text-slate-400">
                        Leading: {signal.leadingTeamAtTrigger === 'home' ? signal.homeTeam : signal.awayTeam}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {signal.entryTriggerTime && (
                      <span>Entry Trigger: {new Date(signal.entryTriggerTime).toLocaleTimeString()}</span>
                    )}
                    {signal.closeTriggerTime && (
                      <span>Close Trigger: {new Date(signal.closeTriggerTime).toLocaleTimeString()}</span>
                    )}
                    {signal.oddsAlignedTime && (
                      <span className="text-green-600">Odds Aligned: {new Date(signal.oddsAlignedTime).toLocaleTimeString()}</span>
                    )}
                    {signal.expiryTime && (
                      <span className="text-red-500">Expired: {new Date(signal.expiryTime).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {signal.notes && (
                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2">
                    {signal.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-medium text-slate-700 mb-3">Signal Lifecycle</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-600">🔵 Monitoring - Entry trigger fired, waiting for close trigger</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-600">🟡 Watching - All conditions met, waiting for odds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-600">🟢 Bet Taken - Odds aligned, entry available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-600">🔴 Expired - Odds never aligned before 2:20 Q4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
