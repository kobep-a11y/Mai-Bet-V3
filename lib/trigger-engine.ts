import {
  LiveGame,
  Strategy,
  StrategyTrigger,
  Condition,
  GameEvaluationContext,
  TriggerEvaluationResult,
  ActiveSignal,
  Player,
} from '@/types';

/**
 * Player stats for evaluation context
 */
export interface PlayerStatsForEval {
  homePlayer: Player | null;
  awayPlayer: Player | null;
}

/**
 * Converts a LiveGame into an evaluation context with computed fields
 * Now includes player stats for head-to-head comparisons (V2 port)
 */
export function createEvaluationContext(
  game: LiveGame,
  playerStats?: PlayerStatsForEval
): GameEvaluationContext {
  const { quarterScores, halftimeScores } = game;

  // Parse time remaining to seconds
  const timeParts = game.timeRemaining.split(':');
  const timeRemainingSeconds = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);

  // Compute derived values
  const scoreDifferential = game.homeScore - game.awayScore;
  const firstHalfTotal = quarterScores.q1Home + quarterScores.q1Away + quarterScores.q2Home + quarterScores.q2Away;
  const secondHalfTotal = quarterScores.q3Home + quarterScores.q3Away + quarterScores.q4Home + quarterScores.q4Away;

  const halftimeDifferential = halftimeScores.home - halftimeScores.away;

  // Extract player stats (null if not provided)
  const homePlayer = playerStats?.homePlayer;
  const awayPlayer = playerStats?.awayPlayer;

  // Calculate player stat fields
  const homePlayerWinPct = homePlayer?.winRate ?? null;
  const awayPlayerWinPct = awayPlayer?.winRate ?? null;
  const homePlayerPpm = homePlayer?.avgPointsFor ?? null;
  const awayPlayerPpm = awayPlayer?.avgPointsFor ?? null;
  const homePlayerGames = homePlayer?.gamesPlayed ?? null;
  const awayPlayerGames = awayPlayer?.gamesPlayed ?? null;

  // Count wins in recent form (last 10 games)
  const homePlayerFormWins = homePlayer?.recentForm
    ? homePlayer.recentForm.filter(r => r === 'W').length
    : null;
  const awayPlayerFormWins = awayPlayer?.recentForm
    ? awayPlayer.recentForm.filter(r => r === 'W').length
    : null;

  // Head-to-head comparisons (null if either player missing)
  const winPctDiff = (homePlayerWinPct !== null && awayPlayerWinPct !== null)
    ? homePlayerWinPct - awayPlayerWinPct
    : null;
  const ppmDiff = (homePlayerPpm !== null && awayPlayerPpm !== null)
    ? homePlayerPpm - awayPlayerPpm
    : null;
  const experienceDiff = (homePlayerGames !== null && awayPlayerGames !== null)
    ? homePlayerGames - awayPlayerGames
    : null;

  // Dynamic leading/losing team odds
  const homeLeading = game.homeScore > game.awayScore;
  const awayLeading = game.awayScore > game.homeScore;

  // Get spread values (home spread is stored, away is inverse)
  const homeSpread = game.spread ?? null;
  const awaySpread = homeSpread !== null ? -homeSpread : null;

  // Get moneyline values
  const homeMoneyline = game.mlHome ?? null;
  const awayMoneyline = game.mlAway ?? null;

  // Leading/losing team odds (null if tied)
  let leadingTeamSpread: number | null = null;
  let losingTeamSpread: number | null = null;
  let leadingTeamMoneyline: number | null = null;
  let losingTeamMoneyline: number | null = null;

  if (homeLeading) {
    leadingTeamSpread = homeSpread;
    losingTeamSpread = awaySpread;
    leadingTeamMoneyline = homeMoneyline;
    losingTeamMoneyline = awayMoneyline;
  } else if (awayLeading) {
    leadingTeamSpread = awaySpread;
    losingTeamSpread = homeSpread;
    leadingTeamMoneyline = awayMoneyline;
    losingTeamMoneyline = homeMoneyline;
  }

  return {
    // Direct fields
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    timeRemainingSeconds,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    totalScore: game.homeScore + game.awayScore,
    scoreDifferential,
    absScoreDifferential: Math.abs(scoreDifferential),
    homeLeading,
    awayLeading,
    spread: game.spread,
    total: game.total,
    status: game.status,

    // =========================================
    // FIELD ALIASES - Match Airtable trigger format
    // =========================================
    currentLead: Math.abs(scoreDifferential),
    halftimeLead: Math.abs(halftimeDifferential),

    // Quarter 1
    q1Home: quarterScores.q1Home,
    q1Away: quarterScores.q1Away,
    q1Total: quarterScores.q1Home + quarterScores.q1Away,
    q1Differential: quarterScores.q1Home - quarterScores.q1Away,

    // Quarter 2
    q2Home: quarterScores.q2Home,
    q2Away: quarterScores.q2Away,
    q2Total: quarterScores.q2Home + quarterScores.q2Away,
    q2Differential: quarterScores.q2Home - quarterScores.q2Away,

    // Quarter 3
    q3Home: quarterScores.q3Home,
    q3Away: quarterScores.q3Away,
    q3Total: quarterScores.q3Home + quarterScores.q3Away,
    q3Differential: quarterScores.q3Home - quarterScores.q3Away,

    // Quarter 4
    q4Home: quarterScores.q4Home,
    q4Away: quarterScores.q4Away,
    q4Total: quarterScores.q4Home + quarterScores.q4Away,
    q4Differential: quarterScores.q4Home - quarterScores.q4Away,

    // Halftime
    halftimeHome: halftimeScores.home,
    halftimeAway: halftimeScores.away,
    halftimeTotal: halftimeScores.home + halftimeScores.away,
    halftimeDifferential,

    // Half totals
    firstHalfTotal,
    secondHalfTotal,

    // =========================================
    // PLAYER STATS (V2 port)
    // =========================================
    homePlayerWinPct,
    awayPlayerWinPct,
    homePlayerPpm,
    awayPlayerPpm,
    homePlayerGames,
    awayPlayerGames,
    homePlayerFormWins,
    awayPlayerFormWins,

    // HEAD-TO-HEAD COMPARISONS
    winPctDiff,
    ppmDiff,
    experienceDiff,

    // =========================================
    // DYNAMIC LEADING/LOSING TEAM ODDS
    // =========================================
    leadingTeamSpread,
    losingTeamSpread,
    leadingTeamMoneyline,
    losingTeamMoneyline,

    // DIRECT ODDS FIELDS
    homeSpread,
    awaySpread,
    homeMoneyline,
    awayMoneyline,
  };
}

/**
 * Evaluates a single condition against the game context
 * Now handles null values for player stats fields
 */
export function evaluateCondition(condition: Condition, context: GameEvaluationContext): boolean {
  const fieldValue = context[condition.field as keyof GameEvaluationContext];

  if (fieldValue === undefined) {
    console.warn(`Unknown field: ${condition.field}`);
    return false;
  }

  // Handle null values (player stats not available)
  if (fieldValue === null) {
    // For player stat conditions, null means data not available - condition fails
    console.log(`  [CONDITION] ${condition.field} = null (data not available)`);
    return false;
  }

  const value = condition.value;
  const value2 = condition.value2;

  // Convert string value to number for numeric comparisons if needed
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

    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluates all conditions for a trigger (AND logic - all must pass)
 */
export function evaluateTrigger(
  trigger: StrategyTrigger,
  context: GameEvaluationContext
): { passed: boolean; matchedConditions: Condition[]; failedConditions: Condition[] } {
  const matchedConditions: Condition[] = [];
  const failedConditions: Condition[] = [];

  // Warn if trigger has no conditions
  if (trigger.conditions.length === 0) {
    console.warn(`⚠️ Trigger "${trigger.name}" has no conditions and will never fire`);
    return {
      passed: false,
      matchedConditions: [],
      failedConditions: [],
    };
  }

  for (const condition of trigger.conditions) {
    if (evaluateCondition(condition, context)) {
      matchedConditions.push(condition);
    } else {
      failedConditions.push(condition);
    }
  }

  return {
    passed: failedConditions.length === 0 && matchedConditions.length > 0,
    matchedConditions,
    failedConditions,
  };
}

/**
 * Evaluates a game against a strategy's triggers
 * Returns triggers that fired
 * Now accepts optional player stats for head-to-head conditions (V2 port)
 */
export function evaluateStrategy(
  strategy: Strategy,
  game: LiveGame,
  activeSignals: ActiveSignal[],
  playerStats?: PlayerStatsForEval
): TriggerEvaluationResult[] {
  // Skip if strategy is not active
  if (!strategy.isActive) {
    return [];
  }

  // Skip if game is not live
  if (game.status !== 'live' && game.status !== 'halftime') {
    return [];
  }

  const context = createEvaluationContext(game, playerStats);
  const results: TriggerEvaluationResult[] = [];

  // Check if we already have an active signal for this strategy/game combo
  const existingSignal = activeSignals.find(
    (s) => s.strategyId === strategy.id && s.gameId === game.id
  );

  // Sort triggers by order
  const sortedTriggers = [...strategy.triggers].sort((a, b) => a.order - b.order);

  for (const trigger of sortedTriggers) {
    // For entry triggers, skip if we already have a signal
    if (trigger.entryOrClose === 'entry' && existingSignal) {
      continue;
    }

    // For close triggers, only run if we have an existing signal awaiting close
    if (trigger.entryOrClose === 'close' && (!existingSignal || !existingSignal.awaitingClose)) {
      continue;
    }

    const evaluation = evaluateTrigger(trigger, context);

    if (evaluation.passed) {
      results.push({
        triggered: true,
        strategy,
        trigger,
        game,
        matchedConditions: evaluation.matchedConditions,
        failedConditions: evaluation.failedConditions,
      });

      // For sequential mode, only the first matching trigger fires
      if (strategy.triggerMode === 'sequential') {
        break;
      }
    }
  }

  return results;
}

/**
 * Evaluates all strategies against a game
 * Now accepts optional player stats for head-to-head conditions (V2 port)
 */
export function evaluateAllStrategies(
  strategies: Strategy[],
  game: LiveGame,
  activeSignals: ActiveSignal[],
  playerStats?: PlayerStatsForEval
): TriggerEvaluationResult[] {
  const allResults: TriggerEvaluationResult[] = [];

  for (const strategy of strategies) {
    const results = evaluateStrategy(strategy, game, activeSignals, playerStats);
    allResults.push(...results);
  }

  return allResults;
}

/**
 * Formats a trigger result for logging/display
 */
export function formatTriggerResult(result: TriggerEvaluationResult): string {
  const { strategy, trigger, game } = result;
  return `[${strategy.name}] ${trigger.name} triggered for ${game.awayTeam} @ ${game.homeTeam} (Q${game.quarter} ${game.timeRemaining})`;
}
