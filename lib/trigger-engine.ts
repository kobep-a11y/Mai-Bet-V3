import {
  LiveGame,
  Strategy,
  StrategyTrigger,
  Condition,
  GameEvaluationContext,
  TriggerEvaluationResult,
  ActiveSignal,
} from '@/types';

/**
 * Converts a LiveGame into an evaluation context with computed fields
 */
export function createEvaluationContext(game: LiveGame): GameEvaluationContext {
  const { quarterScores, halftimeScores } = game;

  // Parse time remaining to seconds
  const timeParts = game.timeRemaining.split(':');
  const timeRemainingSeconds = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);

  // Compute derived values
  const scoreDifferential = game.homeScore - game.awayScore;
  const firstHalfTotal = quarterScores.q1Home + quarterScores.q1Away + quarterScores.q2Home + quarterScores.q2Away;
  const secondHalfTotal = quarterScores.q3Home + quarterScores.q3Away + quarterScores.q4Home + quarterScores.q4Away;

  const halftimeDifferential = halftimeScores.home - halftimeScores.away;

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
    homeLeading: game.homeScore > game.awayScore,
    awayLeading: game.awayScore > game.homeScore,
    spread: game.spread,
    total: game.total,
    status: game.status,

    // =========================================
    // FIELD ALIASES - Match Airtable trigger format
    // =========================================
    // These are the fields used in your Airtable triggers:
    currentLead: Math.abs(scoreDifferential),         // Alias for absScoreDifferential
    halftimeLead: Math.abs(halftimeDifferential),     // Absolute halftime lead

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
  };
}

/**
 * Evaluates a single condition against the game context
 */
export function evaluateCondition(condition: Condition, context: GameEvaluationContext): boolean {
  const fieldValue = context[condition.field as keyof GameEvaluationContext];

  if (fieldValue === undefined) {
    console.warn(`Unknown field: ${condition.field}`);
    return false;
  }

  const value = condition.value;
  const value2 = condition.value2;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === value;

    case 'not_equals':
      return fieldValue !== value;

    case 'greater_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;

    case 'less_than':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;

    case 'greater_than_or_equal':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;

    case 'less_than_or_equal':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;

    case 'between':
      return (
        typeof fieldValue === 'number' &&
        typeof value === 'number' &&
        typeof value2 === 'number' &&
        fieldValue >= value &&
        fieldValue <= value2
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
 */
export function evaluateStrategy(
  strategy: Strategy,
  game: LiveGame,
  activeSignals: ActiveSignal[]
): TriggerEvaluationResult[] {
  // Skip if strategy is not active
  if (!strategy.isActive) {
    return [];
  }

  // Skip if game is not live
  if (game.status !== 'live' && game.status !== 'halftime') {
    return [];
  }

  const context = createEvaluationContext(game);
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
 */
export function evaluateAllStrategies(
  strategies: Strategy[],
  game: LiveGame,
  activeSignals: ActiveSignal[]
): TriggerEvaluationResult[] {
  const allResults: TriggerEvaluationResult[] = [];

  for (const strategy of strategies) {
    const results = evaluateStrategy(strategy, game, activeSignals);
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
