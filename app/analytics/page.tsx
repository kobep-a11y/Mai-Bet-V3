'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Trophy,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  signals: number;
  won: number;
  lost: number;
  pushed: number;
  winRate: number;
  roi: number;
}

interface RecentSignal {
  id: string;
  strategyName: string;
  matchup: string;
  status: string;
  result: string | null;
  entryTime: string;
}

interface SignalsByDay {
  date: string;
  total: number;
  won: number;
  lost: number;
}

interface AnalyticsData {
  totalSignals: number;
  wonSignals: number;
  lostSignals: number;
  pushedSignals: number;
  expiredSignals: number;
  activeSignals: number;
  winRate: number;
  roi: number;
  totalGamesTracked: number;
  strategyPerformance: StrategyPerformance[];
  recentSignals: RecentSignal[];
  signalsByDay: SignalsByDay[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      won: { bg: 'bg-green-100', text: 'text-green-700', label: 'Won' },
      lost: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' },
      pushed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Push' },
      expired: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Expired' },
      monitoring: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Monitoring' },
      watching: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Watching' },
      bet_taken: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Bet Taken' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-slate-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20 text-red-500">
          <AlertCircle className="w-8 h-8 mr-3" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completedBets = data.wonSignals + data.lostSignals;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm">Performance metrics and signal insights</p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Signals */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Total Signals</span>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalSignals}</div>
          <div className="text-xs text-slate-400 mt-1">
            {data.activeSignals} active
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Win Rate</span>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-2xl font-bold ${data.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {data.winRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data.wonSignals}W - {data.lostSignals}L
          </div>
        </div>

        {/* ROI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">ROI (-110)</span>
            {data.roi >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${data.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.roi > 0 ? '+' : ''}{data.roi}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {completedBets} completed bets
          </div>
        </div>

        {/* Games Tracked */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Games Tracked</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalGamesTracked}</div>
          <div className="text-xs text-slate-400 mt-1">
            Historical games
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
          <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">{data.wonSignals}</div>
          <div className="text-xs text-green-600">Won</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-700">{data.lostSignals}</div>
          <div className="text-xs text-red-600">Lost</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center border border-gray-200">
          <div className="w-5 h-5 text-gray-600 mx-auto mb-1 font-bold text-sm">P</div>
          <div className="text-xl font-bold text-gray-700">{data.pushedSignals}</div>
          <div className="text-xs text-gray-600">Pushed</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center border border-amber-200">
          <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-700">{data.expiredSignals}</div>
          <div className="text-xs text-amber-600">Expired</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
          <Activity className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-700">{data.activeSignals}</div>
          <div className="text-xs text-blue-600">Active</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strategy Performance */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Strategy Performance</h2>
            <p className="text-sm text-slate-500">Results by strategy</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.strategyPerformance.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No strategy data yet
              </div>
            ) : (
              data.strategyPerformance.slice(0, 8).map((strat) => (
                <div key={strat.strategyId} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {strat.strategyName}
                    </span>
                    <span className={`text-sm font-semibold ${strat.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {strat.roi > 0 ? '+' : ''}{strat.roi.toFixed(1)}% ROI
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {strat.signals} signals • {strat.won}W-{strat.lost}L
                    </span>
                    <span className={`font-medium ${strat.winRate >= 50 ? 'text-green-600' : 'text-slate-500'}`}>
                      {strat.winRate.toFixed(1)}% Win
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${strat.winRate >= 50 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(strat.winRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Signals */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Recent Signals</h2>
            <p className="text-sm text-slate-500">Latest signal activity</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {data.recentSignals.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No signals yet
              </div>
            ) : (
              data.recentSignals.map((signal) => (
                <div key={signal.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700 text-sm truncate max-w-[180px]">
                      {signal.matchup}
                    </span>
                    {getStatusBadge(signal.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[150px]">{signal.strategyName}</span>
                    <span>{formatDate(signal.entryTime)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Daily Volume Chart (Simple Bar Visualization) */}
      {data.signalsByDay.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Signal Volume</h2>
          <p className="text-sm text-slate-500 mb-4">Daily signal activity (last 30 days)</p>

          <div className="flex items-end gap-1 h-32">
            {data.signalsByDay.map((day, i) => {
              const maxTotal = Math.max(...data.signalsByDay.map(d => d.total), 1);
              const height = (day.total / maxTotal) * 100;
              const wonHeight = day.total > 0 ? (day.won / day.total) * height : 0;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.date}: {day.total} total, {day.won}W-{day.lost}L
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full bg-slate-200 rounded-t relative overflow-hidden"
                    style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-green-500"
                      style={{ height: `${wonHeight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Won</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-200 rounded" />
              <span>Lost/Other</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
