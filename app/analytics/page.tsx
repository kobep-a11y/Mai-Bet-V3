'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Filter,
  Calendar,
  ChevronDown,
  X,
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

// ============================================
// MINI BAR CHART COMPONENT
// ============================================

interface MiniBarChartProps {
  data: SignalsByDay[];
  height?: number;
}

function MiniBarChart({ data, height = 120 }: MiniBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((day, i) => {
        const totalHeight = (day.total / maxTotal) * 100;
        const wonHeight = day.total > 0 ? (day.won / day.total) * totalHeight : 0;
        const lostHeight = day.total > 0 ? (day.lost / day.total) * totalHeight : 0;

        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col justify-end group relative"
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <div className="font-medium">{day.date}</div>
              <div className="text-green-400">{day.won}W</div>
              <div className="text-red-400">{day.lost}L</div>
              <div className="text-slate-300">{day.total} total</div>
            </div>

            {/* Stacked Bar */}
            <div
              className="w-full rounded-t relative overflow-hidden transition-all hover:opacity-80"
              style={{ height: `${totalHeight}%`, minHeight: day.total > 0 ? '4px' : '0' }}
            >
              {/* Lost portion */}
              <div
                className="absolute top-0 w-full bg-red-400"
                style={{ height: `${lostHeight}%` }}
              />
              {/* Won portion */}
              <div
                className="absolute bottom-0 w-full bg-green-500"
                style={{ height: `${wonHeight}%` }}
              />
              {/* Neutral/Other */}
              <div
                className="absolute w-full bg-slate-200"
                style={{
                  top: `${lostHeight}%`,
                  height: `${totalHeight - wonHeight - lostHeight}%`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// WIN RATE TREND CHART
// ============================================

interface WinRateTrendProps {
  data: SignalsByDay[];
}

function WinRateTrend({ data }: WinRateTrendProps) {
  const trendData = useMemo(() => {
    let cumulativeWins = 0;
    let cumulativeLosses = 0;

    return data.map(day => {
      cumulativeWins += day.won;
      cumulativeLosses += day.lost;
      const total = cumulativeWins + cumulativeLosses;
      const rate = total > 0 ? (cumulativeWins / total) * 100 : 0;
      return { date: day.date, rate, wins: cumulativeWins, losses: cumulativeLosses };
    });
  }, [data]);

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  const maxRate = 100;
  const minRate = 0;

  // Create SVG path for line chart
  const width = 100;
  const height = 80;
  const points = trendData.map((d, i) => {
    const x = (i / (trendData.length - 1 || 1)) * width;
    const y = height - ((d.rate - minRate) / (maxRate - minRate)) * height;
    return `${x},${y}`;
  }).join(' ');

  const currentRate = trendData[trendData.length - 1]?.rate || 0;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        {/* Reference line at 50% */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#E2E8F0"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        {/* Trend line */}
        <polyline
          fill="none"
          stroke={currentRate >= 50 ? '#22C55E' : '#EF4444'}
          strokeWidth="2"
          points={points}
        />
        {/* End dot */}
        {trendData.length > 0 && (
          <circle
            cx={(trendData.length - 1) / (trendData.length - 1 || 1) * width}
            cy={height - ((currentRate - minRate) / (maxRate - minRate)) * height}
            r="3"
            fill={currentRate >= 50 ? '#22C55E' : '#EF4444'}
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0%</span>
        <span className={`font-medium ${currentRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
          Current: {currentRate.toFixed(1)}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}

// ============================================
// ROI CHART
// ============================================

interface ROIChartProps {
  data: SignalsByDay[];
}

function ROIChart({ data }: ROIChartProps) {
  const roiData = useMemo(() => {
    let cumulativeUnits = 0;

    return data.map(day => {
      // Assume 1 unit per bet, -1.1 for loss (standard -110 odds)
      cumulativeUnits += day.won * 1;
      cumulativeUnits -= day.lost * 1.1;
      return { date: day.date, units: cumulativeUnits };
    });
  }, [data]);

  if (roiData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  const maxUnits = Math.max(...roiData.map(d => Math.abs(d.units)), 1);
  const currentUnits = roiData[roiData.length - 1]?.units || 0;

  const width = 100;
  const height = 80;
  const midY = height / 2;

  const points = roiData.map((d, i) => {
    const x = (i / (roiData.length - 1 || 1)) * width;
    const y = midY - (d.units / maxUnits) * (height / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        {/* Zero line */}
        <line
          x1="0"
          y1={midY}
          x2={width}
          y2={midY}
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        {/* Fill area */}
        <polygon
          fill={currentUnits >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
          points={`0,${midY} ${points} ${width},${midY}`}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke={currentUnits >= 0 ? '#22C55E' : '#EF4444'}
          strokeWidth="2"
          points={points}
        />
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>-{maxUnits.toFixed(1)}u</span>
        <span className={`font-medium ${currentUnits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {currentUnits >= 0 ? '+' : ''}{currentUnits.toFixed(2)}u
        </span>
        <span>+{maxUnits.toFixed(1)}u</span>
      </div>
    </div>
  );
}

// ============================================
// FILTER DROPDOWN
// ============================================

interface FilterDropdownProps {
  strategies: string[];
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  dateRange: 'week' | 'month' | '3months' | 'all';
  onDateRangeChange: (range: 'week' | 'month' | '3months' | 'all') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterDropdown({
  strategies,
  selectedStrategy,
  onStrategyChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-700">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Strategy</label>
                <select
                  value={selectedStrategy}
                  onChange={e => onStrategyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700"
                >
                  <option value="">All Strategies</option>
                  {strategies.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['week', 'month', '3months', 'all'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => onDateRangeChange(range)}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        dateRange === range
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {range === 'week' ? '7D' : range === 'month' ? '30D' : range === '3months' ? '90D' : 'All'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | '3months' | 'all'>('month');

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

  // Get unique strategies
  const strategies = useMemo(() => {
    if (!data) return [];
    return data.strategyPerformance.map(s => s.strategyName).sort();
  }, [data]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filteredPerformance = data.strategyPerformance;
    let filteredSignals = data.recentSignals;
    let filteredByDay = data.signalsByDay;

    // Filter by strategy
    if (selectedStrategy) {
      filteredPerformance = filteredPerformance.filter(s => s.strategyName === selectedStrategy);
      filteredSignals = filteredSignals.filter(s => s.strategyName === selectedStrategy);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      if (dateRange === 'week') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'month') {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      filteredByDay = filteredByDay.filter(d => new Date(d.date) >= cutoffDate);
      filteredSignals = filteredSignals.filter(s => new Date(s.entryTime) >= cutoffDate);
    }

    // Recalculate totals based on filtered data
    const wonSignals = filteredByDay.reduce((sum, d) => sum + d.won, 0);
    const lostSignals = filteredByDay.reduce((sum, d) => sum + d.lost, 0);
    const totalSignals = filteredByDay.reduce((sum, d) => sum + d.total, 0);
    const completedBets = wonSignals + lostSignals;
    const winRate = completedBets > 0 ? Math.round((wonSignals / completedBets) * 100) : 0;

    // Calculate ROI (-110 standard odds)
    const profit = wonSignals * 1 - lostSignals * 1.1;
    const roi = completedBets > 0 ? Math.round((profit / completedBets) * 100) : 0;

    return {
      ...data,
      strategyPerformance: filteredPerformance,
      recentSignals: filteredSignals,
      signalsByDay: filteredByDay,
      wonSignals,
      lostSignals,
      totalSignals,
      winRate,
      roi,
    };
  }, [data, selectedStrategy, dateRange]);

  const hasActiveFilters = selectedStrategy !== '' || dateRange !== 'month';

  const clearFilters = () => {
    setSelectedStrategy('');
    setDateRange('month');
  };

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

  if (!filteredData) return null;

  const completedBets = filteredData.wonSignals + filteredData.lostSignals;

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
        <div className="flex items-center gap-3">
          <FilterDropdown
            strategies={strategies}
            selectedStrategy={selectedStrategy}
            onStrategyChange={setSelectedStrategy}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500">Filters:</span>
          {selectedStrategy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {selectedStrategy}
              <button onClick={() => setSelectedStrategy('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateRange !== 'month' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              <Calendar className="w-3 h-3" />
              {dateRange === 'week' ? 'Last 7 days' : dateRange === '3months' ? 'Last 90 days' : 'All time'}
              <button onClick={() => setDateRange('month')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Total Signals</span>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{filteredData.totalSignals}</div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredData.activeSignals} active
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Win Rate</span>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-2xl font-bold ${filteredData.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {filteredData.winRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredData.wonSignals}W - {filteredData.lostSignals}L
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">ROI (-110)</span>
            {filteredData.roi >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${filteredData.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {filteredData.roi > 0 ? '+' : ''}{filteredData.roi}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {completedBets} completed bets
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Games Tracked</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{filteredData.totalGamesTracked}</div>
          <div className="text-xs text-slate-400 mt-1">
            Historical games
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
          <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">{filteredData.wonSignals}</div>
          <div className="text-xs text-green-600">Won</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-700">{filteredData.lostSignals}</div>
          <div className="text-xs text-red-600">Lost</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center border border-gray-200">
          <div className="w-5 h-5 text-gray-600 mx-auto mb-1 font-bold text-sm">P</div>
          <div className="text-xl font-bold text-gray-700">{filteredData.pushedSignals}</div>
          <div className="text-xs text-gray-600">Pushed</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center border border-amber-200">
          <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-700">{filteredData.expiredSignals}</div>
          <div className="text-xs text-amber-600">Expired</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
          <Activity className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-700">{filteredData.activeSignals}</div>
          <div className="text-xs text-blue-600">Active</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Signal Volume Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Signal Volume</h3>
          <p className="text-xs text-slate-400 mb-4">Daily breakdown</p>
          <MiniBarChart data={filteredData.signalsByDay} />
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-slate-500">Won</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-slate-500">Lost</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-200 rounded" />
              <span className="text-slate-500">Other</span>
            </div>
          </div>
        </div>

        {/* Win Rate Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Win Rate Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Cumulative performance</p>
          <WinRateTrend data={filteredData.signalsByDay} />
        </div>

        {/* ROI Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Profit/Loss</h3>
          <p className="text-xs text-slate-400 mb-4">Units @ -110 odds</p>
          <ROIChart data={filteredData.signalsByDay} />
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
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {filteredData.strategyPerformance.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No strategy data yet
              </div>
            ) : (
              filteredData.strategyPerformance.slice(0, 10).map((strat) => (
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
                      {strat.signals} signals - {strat.won}W-{strat.lost}L
                    </span>
                    <span className={`font-medium ${strat.winRate >= 50 ? 'text-green-600' : 'text-slate-500'}`}>
                      {strat.winRate.toFixed(1)}% Win
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strat.winRate >= 50 ? 'bg-green-500' : 'bg-red-400'}`}
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
            {filteredData.recentSignals.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No signals yet
              </div>
            ) : (
              filteredData.recentSignals.slice(0, 10).map((signal) => (
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
    </div>
  );
}
