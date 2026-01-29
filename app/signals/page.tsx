'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bell, RefreshCw, Clock, CheckCircle, XCircle, Eye, Zap,
  AlertCircle, ChevronDown, ChevronUp, Filter, X, Calendar,
  TrendingUp, Activity
} from 'lucide-react';
import { Signal, SignalStatus, TriggerHistoryEntry } from '@/types';

// Status configuration with icons and colors
const STATUS_CONFIG: Record<SignalStatus, { icon: React.ReactNode; bg: string; text: string; label: string; color: string }> = {
  monitoring: {
    icon: <Eye className="w-4 h-4" />,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Monitoring',
    color: 'blue',
  },
  watching: {
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Watching',
    color: 'yellow',
  },
  bet_taken: {
    icon: <Zap className="w-4 h-4" />,
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Bet Taken',
    color: 'green',
  },
  expired: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Expired',
    color: 'red',
  },
  won: {
    icon: <CheckCircle className="w-4 h-4" />,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    label: 'Won',
    color: 'emerald',
  },
  lost: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Lost',
    color: 'red',
  },
  pushed: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    label: 'Pushed',
    color: 'slate',
  },
  closed: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Closed',
    color: 'slate',
  },
};

// ============================================
// TRIGGER TIMELINE COMPONENT
// ============================================

interface TriggerTimelineProps {
  signal: Signal;
}

function TriggerTimeline({ signal }: TriggerTimelineProps) {
  const timelineEvents = useMemo(() => {
    const events: {
      time: string;
      label: string;
      description: string;
      type: 'entry' | 'close' | 'odds' | 'expiry' | 'result';
      snapshot?: TriggerHistoryEntry['snapshot'];
    }[] = [];

    // Add entry trigger
    if (signal.entryTriggerTime) {
      events.push({
        time: signal.entryTriggerTime,
        label: 'Entry Trigger',
        description: `Q${signal.quarter} ${signal.timeRemaining} - ${signal.awayScore}-${signal.homeScore}`,
        type: 'entry',
      });
    }

    // Add trigger history entries
    if (signal.triggerHistory && signal.triggerHistory.length > 0) {
      signal.triggerHistory.forEach((entry, index) => {
        events.push({
          time: entry.timestamp,
          label: entry.triggerName || `Trigger ${index + 1}`,
          description: `Q${entry.snapshot.quarter} ${entry.snapshot.timeRemaining} - ${entry.snapshot.awayScore}-${entry.snapshot.homeScore}`,
          type: index === 0 ? 'entry' : 'close',
          snapshot: entry.snapshot,
        });
      });
    }

    // Add close trigger
    if (signal.closeTriggerTime) {
      events.push({
        time: signal.closeTriggerTime,
        label: 'Close Trigger',
        description: 'Conditions met',
        type: 'close',
      });
    }

    // Add odds aligned
    if (signal.oddsAlignedTime) {
      events.push({
        time: signal.oddsAlignedTime,
        label: 'Odds Aligned',
        description: `Spread: ${signal.actualSpreadAtEntry || 'N/A'}`,
        type: 'odds',
      });
    }

    // Add expiry
    if (signal.expiryTime) {
      events.push({
        time: signal.expiryTime,
        label: 'Expired',
        description: 'Odds never aligned',
        type: 'expiry',
      });
    }

    // Sort by time
    events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return events;
  }, [signal]);

  if (timelineEvents.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-4">
        No timeline data available
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entry': return 'bg-blue-500';
      case 'close': return 'bg-purple-500';
      case 'odds': return 'bg-green-500';
      case 'expiry': return 'bg-red-500';
      case 'result': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'entry': return 'text-blue-600';
      case 'close': return 'text-purple-600';
      case 'odds': return 'text-green-600';
      case 'expiry': return 'text-red-600';
      case 'result': return 'text-yellow-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

      {/* Timeline events */}
      <div className="space-y-4">
        {timelineEvents.map((event, index) => (
          <div key={index} className="relative flex items-start gap-4 pl-0">
            {/* Dot */}
            <div className={`relative z-10 w-6 h-6 rounded-full ${getTypeColor(event.type)} flex items-center justify-center`}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${getTypeTextColor(event.type)}`}>
                  {event.label}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(event.time).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-600">{event.description}</p>

              {/* Snapshot details */}
              {event.snapshot && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-400">Leader:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {event.snapshot.leadingTeam === 'tie' ? 'Tied' : event.snapshot.leadingTeam.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Lead:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        +{event.snapshot.leadAmount}
                      </span>
                    </div>
                    {event.snapshot.homeSpread !== undefined && (
                      <div>
                        <span className="text-slate-400">Spread:</span>
                        <span className="ml-1 font-medium text-slate-700">
                          {event.snapshot.homeSpread > 0 ? '+' : ''}{event.snapshot.homeSpread}
                        </span>
                      </div>
                    )}
                    {event.snapshot.totalLine !== undefined && (
                      <div>
                        <span className="text-slate-400">Total:</span>
                        <span className="ml-1 font-medium text-slate-700">
                          {event.snapshot.totalLine}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SIGNAL CARD COMPONENT
// ============================================

interface SignalCardProps {
  signal: Signal;
  isExpanded: boolean;
  onToggle: () => void;
}

function SignalCard({ signal, isExpanded, onToggle }: SignalCardProps) {
  const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.closed;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Main content - clickable */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
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

          <div className="flex items-center gap-3">
            <div className="text-right">
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
            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Timeline */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {signal.entryTriggerTime && (
              <span>Entry: {new Date(signal.entryTriggerTime).toLocaleTimeString()}</span>
            )}
            {signal.closeTriggerTime && (
              <span>Close: {new Date(signal.closeTriggerTime).toLocaleTimeString()}</span>
            )}
            {signal.oddsAlignedTime && (
              <span className="text-green-600">Odds: {new Date(signal.oddsAlignedTime).toLocaleTimeString()}</span>
            )}
            {signal.expiryTime && (
              <span className="text-red-500">Expired: {new Date(signal.expiryTime).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Trigger Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Trigger Timeline
              </h4>
              <TriggerTimeline signal={signal} />
            </div>

            {/* Signal Details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Signal Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-slate-500">Strategy</span>
                  <span className="font-medium text-slate-700">{signal.strategyName}</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-slate-500">Trigger</span>
                  <span className="font-medium text-slate-700">{signal.triggerName}</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-slate-500">Game ID</span>
                  <span className="font-medium text-slate-700 font-mono text-xs">{signal.gameId}</span>
                </div>
                {signal.entrySpread !== undefined && (
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-slate-500">Entry Spread</span>
                    <span className="font-medium text-slate-700">{signal.entrySpread}</span>
                  </div>
                )}
                {signal.entryML !== undefined && (
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-slate-500">Entry ML</span>
                    <span className="font-medium text-slate-700">{signal.entryML > 0 ? '+' : ''}{signal.entryML}</span>
                  </div>
                )}
                {signal.finalHomeScore !== undefined && signal.finalAwayScore !== undefined && (
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-slate-500">Final Score</span>
                    <span className="font-medium text-slate-700">
                      {signal.finalAwayScore} - {signal.finalHomeScore}
                    </span>
                  </div>
                )}
                {signal.profitLoss !== undefined && (
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-slate-500">P/L</span>
                    <span className={`font-medium ${signal.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.profitLoss > 0 ? '+' : ''}{signal.profitLoss.toFixed(2)}u
                    </span>
                  </div>
                )}
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium text-slate-700 text-xs">
                    {new Date(signal.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {signal.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">{signal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// FILTER PANEL COMPONENT
// ============================================

interface FilterPanelProps {
  strategies: string[];
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  dateRange: 'today' | 'week' | 'month' | 'all';
  onDateRangeChange: (range: 'today' | 'week' | 'month' | 'all') => void;
  outcome: 'all' | 'won' | 'lost' | 'pending';
  onOutcomeChange: (outcome: 'all' | 'won' | 'lost' | 'pending') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterPanel({
  strategies,
  selectedStrategy,
  onStrategyChange,
  dateRange,
  onDateRangeChange,
  outcome,
  onOutcomeChange,
  onClearFilters,
  hasActiveFilters,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'bg-purple-50 border-purple-300 text-purple-700'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-purple-500" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Strategy Filter */}
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

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  {(['today', 'week', 'month', 'all'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => onDateRangeChange(range)}
                      className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                        dateRange === range
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {range === 'today' ? 'Today' : range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Outcome</label>
                <div className="flex gap-2">
                  {(['all', 'won', 'lost', 'pending'] as const).map(o => (
                    <button
                      key={o}
                      onClick={() => onOutcomeChange(o)}
                      className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                        outcome === o
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)}
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

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'live' | 'completed' | 'all'>('all');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [outcome, setOutcome] = useState<'all' | 'won' | 'lost' | 'pending'>('all');

  const fetchSignals = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/signals');
      const data = await res.json();
      if (data.success) {
        setSignals(data.data || []);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(() => fetchSignals(), 10000);
    return () => clearInterval(interval);
  }, []);

  // Get unique strategies for filter
  const strategies = useMemo(() => {
    const unique = new Set(signals.map(s => s.strategyName));
    return Array.from(unique).sort();
  }, [signals]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      // Status filter
      if (statusFilter === 'live') {
        if (signal.status !== 'monitoring' && signal.status !== 'watching') return false;
      }
      if (statusFilter === 'completed') {
        if (!['bet_taken', 'expired', 'won', 'lost', 'pushed', 'closed'].includes(signal.status)) return false;
      }

      // Strategy filter
      if (selectedStrategy && signal.strategyName !== selectedStrategy) return false;

      // Date range filter
      if (dateRange !== 'all') {
        const signalDate = new Date(signal.createdAt);
        const now = new Date();
        if (dateRange === 'today') {
          if (signalDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (signalDate < weekAgo) return false;
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (signalDate < monthAgo) return false;
        }
      }

      // Outcome filter
      if (outcome !== 'all') {
        if (outcome === 'won' && signal.status !== 'won') return false;
        if (outcome === 'lost' && signal.status !== 'lost') return false;
        if (outcome === 'pending' && !['monitoring', 'watching', 'bet_taken'].includes(signal.status)) return false;
      }

      return true;
    });
  }, [signals, statusFilter, selectedStrategy, dateRange, outcome]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: signals.length,
    monitoring: signals.filter(s => s.status === 'monitoring').length,
    watching: signals.filter(s => s.status === 'watching').length,
    betTaken: signals.filter(s => s.status === 'bet_taken').length,
    expired: signals.filter(s => s.status === 'expired').length,
    won: signals.filter(s => s.status === 'won').length,
    lost: signals.filter(s => s.status === 'lost').length,
  }), [signals]);

  const liveCount = stats.monitoring + stats.watching;
  const completedBets = stats.won + stats.lost;
  const winRate = completedBets > 0 ? Math.round((stats.won / completedBets) * 100) : 0;
  const triggeredSignals = stats.betTaken + stats.expired + stats.won + stats.lost;
  const betSuccessRate = triggeredSignals > 0
    ? Math.round(((stats.betTaken + stats.won + stats.lost) / triggeredSignals) * 100)
    : 0;

  const hasActiveFilters = selectedStrategy !== '' || dateRange !== 'all' || outcome !== 'all';

  const clearFilters = () => {
    setSelectedStrategy('');
    setDateRange('all');
    setOutcome('all');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Signal Tracker</h1>
            <p className="text-slate-500 text-sm">
              Two-stage signal lifecycle • Last refresh: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchSignals(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors text-slate-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <p className="text-xs text-blue-500 uppercase font-medium">Monitoring</p>
          <p className="text-2xl font-bold text-blue-600">{stats.monitoring}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-600 uppercase font-medium">Watching</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.watching}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 uppercase font-medium">Bet Taken</p>
          <p className="text-2xl font-bold text-green-600">{stats.betTaken}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
          <p className="text-xs text-red-500 uppercase font-medium">Expired</p>
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

      {/* Filters Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'All Signals' },
            { key: 'live', label: `Live (${liveCount})` },
            { key: 'completed', label: 'Completed' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === key
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <FilterPanel
          strategies={strategies}
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          outcome={outcome}
          onOutcomeChange={setOutcome}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500">Active filters:</span>
          {selectedStrategy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {selectedStrategy}
              <button onClick={() => setSelectedStrategy('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              <Calendar className="w-3 h-3" />
              {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
              <button onClick={() => setDateRange('all')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {outcome !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
              <button onClick={() => setOutcome('all')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-500">
        Showing {filteredSignals.length} of {signals.length} signals
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
          <p className="text-slate-500">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Signals will appear here when strategies trigger on live games'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              isExpanded={expandedSignal === signal.id}
              onToggle={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-medium text-slate-700 mb-3">Signal Lifecycle</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-600">Monitoring - Entry trigger fired</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-600">Watching - Waiting for odds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-600">Bet Taken - Odds aligned</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-600">Expired - Odds never aligned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
