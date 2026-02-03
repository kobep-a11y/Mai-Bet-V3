'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Zap, Clock, CheckCircle } from 'lucide-react';
import { LiveGame, Strategy, Condition } from '@/types';

interface GameWithMeta extends Omit<LiveGame, 'lastUpdate'> {
  createdAt?: string;
  lastUpdate?: string;
}

interface LiveGameCardProps {
  game: GameWithMeta;
  strategies: Strategy[];
  isUpdated: boolean;
}

interface StrategyStatus {
  strategy: Strategy;
  status: 'active' | 'waiting' | 'inactive';
  matchedConditions: number;
  totalConditions: number;
  reason?: string;
}

/**
 * Simplified client-side evaluation of a condition against game state
 */
function evaluateConditionSimple(
  condition: Condition,
  game: GameWithMeta
): boolean {
  const scoreDifferential = game.homeScore - game.awayScore;
  const absScoreDifferential = Math.abs(scoreDifferential);
  const totalScore = game.homeScore + game.awayScore;

  // Parse time remaining to seconds
  const timeParts = game.timeRemaining.split(':');
  const timeRemainingSeconds = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);

  // Build context mapping
  const contextMap: Record<string, number | string | boolean> = {
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    timeRemainingSeconds,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    totalScore,
    scoreDifferential,
    absScoreDifferential,
    currentLead: absScoreDifferential,
    homeLeading: game.homeScore > game.awayScore,
    awayLeading: game.awayScore > game.homeScore,
    spread: game.spread,
    total: game.total,
    status: game.status,
  };

  const fieldValue = contextMap[condition.field];
  if (fieldValue === undefined) return false;

  const value = condition.value;
  const value2 = condition.value2;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericValue2 = typeof value2 === 'string' ? parseFloat(value2) : value2;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === value || fieldValue === numericValue;
    case 'not_equals':
      return fieldValue !== value && fieldValue !== numericValue;
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof numericValue === 'number' && fieldValue > numericValue;
    case 'less_than':
      return typeof fieldValue === 'number' && typeof numericValue === 'number' && fieldValue < numericValue;
    case 'greater_than_or_equal':
      return typeof fieldValue === 'number' && typeof numericValue === 'number' && fieldValue >= numericValue;
    case 'less_than_or_equal':
      return typeof fieldValue === 'number' && typeof numericValue === 'number' && fieldValue <= numericValue;
    case 'between':
      return (
        typeof fieldValue === 'number' &&
        typeof numericValue === 'number' &&
        typeof numericValue2 === 'number' &&
        fieldValue >= numericValue &&
        fieldValue <= numericValue2
      );
    default:
      return false;
  }
}

/**
 * Evaluates a strategy's entry trigger conditions against the game
 */
function evaluateStrategyForGame(
  strategy: Strategy,
  game: GameWithMeta
): StrategyStatus {
  // Strategy must be active
  if (!strategy.isActive) {
    return {
      strategy,
      status: 'inactive',
      matchedConditions: 0,
      totalConditions: 0,
      reason: 'Strategy inactive',
    };
  }

  // Get entry triggers (or all if no entry/close distinction)
  const entryTriggers = strategy.triggers.filter(
    (t) => t.entryOrClose === 'entry' || strategy.triggers.length === 1
  );

  if (entryTriggers.length === 0) {
    return {
      strategy,
      status: 'waiting',
      matchedConditions: 0,
      totalConditions: 0,
      reason: 'No entry triggers',
    };
  }

  // Check all triggers
  let bestMatch = { matched: 0, total: 0, triggered: false };

  for (const trigger of entryTriggers) {
    if (trigger.conditions.length === 0) continue;

    let matched = 0;
    for (const condition of trigger.conditions) {
      if (evaluateConditionSimple(condition, game)) {
        matched++;
      }
    }

    const total = trigger.conditions.length;
    const triggered = matched === total && total > 0;

    if (triggered || matched > bestMatch.matched) {
      bestMatch = { matched, total, triggered };
    }

    if (triggered) break; // Found a triggering condition set
  }

  if (bestMatch.triggered) {
    return {
      strategy,
      status: 'active',
      matchedConditions: bestMatch.matched,
      totalConditions: bestMatch.total,
      reason: 'All conditions met',
    };
  }

  return {
    strategy,
    status: 'waiting',
    matchedConditions: bestMatch.matched,
    totalConditions: bestMatch.total,
    reason: `${bestMatch.matched}/${bestMatch.total} conditions met`,
  };
}

// Helper functions
const extractPlayerName = (teamStr: string, fallback: string = '') => {
  if (!teamStr) return fallback;
  const match = teamStr.match(/\(([^)]+)\)/);
  return match ? match[1] : (teamStr || fallback);
};

const extractTeamName = (teamStr: string, fallback: string = '') => {
  if (!teamStr) return fallback;
  const cleaned = teamStr.replace(/\s*\([^)]+\)/, '').trim();
  return cleaned || fallback;
};

export function LiveGameCard({ game, strategies, isUpdated }: LiveGameCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Evaluate all strategies against this game
  const strategyStatuses = useMemo(() => {
    return strategies
      .filter((s) => s.isActive)
      .map((strategy) => evaluateStrategyForGame(strategy, game))
      .sort((a, b) => {
        // Active first, then by matched conditions
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return b.matchedConditions - a.matchedConditions;
      });
  }, [strategies, game]);

  const activeCount = strategyStatuses.filter((s) => s.status === 'active').length;
  const hasActiveStrategies = activeCount > 0;

  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;
  const lead = Math.abs(game.homeScore - game.awayScore);

  const awayPlayer = extractPlayerName(game.awayTeam, 'Away');
  const homePlayer = extractPlayerName(game.homeTeam, 'Home');
  const awayTeamName = extractTeamName(game.awayTeam, 'Away Team');
  const homeTeamName = extractTeamName(game.homeTeam, 'Home Team');

  const isLive = game.status === 'live';

  return (
    <div className={`${isLive ? 'game-card-live' : 'game-card'} ${isUpdated ? 'game-row-flash' : ''}`}>
      {/* Game Card Grid Layout */}
      <div className="grid grid-cols-12 gap-6 items-center">

        {/* Status Badge & Quarter - Col 1-2 */}
        <div className="col-span-2 flex flex-col gap-2 items-center">
          <span className={`status-badge ${game.status}`}>
            {game.status}
          </span>
          <span className="quarter-badge">Q{game.quarter}</span>
          <span className="time-display text-xs">{game.timeRemaining}</span>
        </div>

        {/* Teams & Scores - Col 3-6 */}
        <div className="col-span-4 space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`team-name ${awayWinning ? 'winning' : homeWinning ? 'losing' : ''}`}>
                {awayPlayer}
              </div>
              <div className="team-info">{awayTeamName}</div>
            </div>
            <div className={`score-value ${awayWinning ? 'winning' : homeWinning ? 'losing' : ''} ${isUpdated ? 'updated' : ''}`}>
              {game.awayScore}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`team-name ${homeWinning ? 'winning' : awayWinning ? 'losing' : ''}`}>
                {homePlayer}
              </div>
              <div className="team-info">{homeTeamName}</div>
            </div>
            <div className={`score-value ${homeWinning ? 'winning' : awayWinning ? 'losing' : ''} ${isUpdated ? 'updated' : ''}`}>
              {game.homeScore}
            </div>
          </div>

          {/* Lead Indicator */}
          {lead > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {awayWinning ? <TrendingUp className="w-3 h-3 text-sky-500" /> : <TrendingDown className="w-3 h-3 text-slate-400" />}
              <span className={`text-xs font-semibold ${lead === 0 ? 'text-slate-400' : 'text-sky-500'}`}>
                Lead: {lead}
              </span>
            </div>
          )}
        </div>

        {/* Betting Lines - Col 7-10 */}
        <div className="col-span-4 grid grid-cols-3 gap-3">
          {/* Spread - Gray theme */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>Spread</span>
            <div className="flex flex-col gap-1">
              <span className="odds-badge spread text-xs">
                {game.spread > 0 ? '+' : ''}{game.spread}
              </span>
              <span className="odds-badge spread text-xs">
                {game.spread > 0 ? '' : '+'}{-game.spread}
              </span>
            </div>
          </div>

          {/* Moneyline - Blue theme */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>ML</span>
            <div className="flex flex-col gap-1">
              <span className={`odds-badge moneyline text-xs ${(game.mlAway && game.mlAway > 0) ? 'positive' : ''}`}>
                {game.mlAway || '–'}
              </span>
              <span className={`odds-badge moneyline text-xs ${(game.mlHome && game.mlHome > 0) ? 'positive' : ''}`}>
                {game.mlHome || '–'}
              </span>
            </div>
          </div>

          {/* Total - Gray theme */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#718096' }}>O/U</span>
            <div className="flex flex-col gap-1">
              <span className="odds-badge total text-xs">O {game.total}</span>
              <span className="odds-badge total text-xs">U {game.total}</span>
            </div>
          </div>
        </div>

        {/* Strategy Trigger Indicator & Dropdown - Col 11-12 */}
        <div className="col-span-2 flex flex-col items-center gap-2">
          {hasActiveStrategies ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Zap className="trigger-icon w-6 h-6" />
              <span className="text-xs font-bold text-amber-600">
                {activeCount} Active
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500">
                {strategyStatuses.length} Watching
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Strategy Dropdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Strategy Status
          </div>
          <div className="space-y-2">
            {strategyStatuses.length === 0 ? (
              <div className="text-sm text-slate-400 italic">No active strategies configured</div>
            ) : (
              strategyStatuses.map((ss) => (
                <div
                  key={ss.strategy.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    ss.status === 'active'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ss.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      ss.status === 'active' ? 'text-green-800' : 'text-slate-700'
                    }`}>
                      {ss.strategy.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ss.status === 'active'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {ss.status === 'active' ? 'ACTIVE' : 'WAITING'}
                    </span>
                    {ss.totalConditions > 0 && (
                      <span className="text-xs text-slate-500">
                        {ss.matchedConditions}/{ss.totalConditions}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
