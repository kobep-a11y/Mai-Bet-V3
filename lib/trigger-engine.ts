import {
  LiveGame,
  Strategy,
  StrategyTrigger,
  Condition,
  GameEvaluationContext,
  TriggerEvaluationResult,
  ActiveSignal,
  Player,
  Rule,
  TriggerSnapshot,
} from '@/types';

/**
 * Player stats for evaluation context
 */
export interface PlayerStatsForEval {
  homePlayer: Player | null;
  awayPlayer: Player | null;
}

/**
 * Calculate previous leader fields for sequential trigger evaluation
 * Reference V2: lines 1314-1358
 *
 * @param game - The current game state
 * @param prevSnapshot - The snapshot from the previous trigger (if any)
 * @returns Object with prev_leader_* fields
 */
function calculatePrevLeaderFields(
  game: LiveGame,
  prevSnapshot?: TriggerSnapshot
): {
  prev_leader_still_leads: number | null;
  prev_leader_current_score: number | null;
  prev_trailer_current_score: number | null;
  prev_leader_current_margin: number | null;
  prev_leader_was_home: number | null;
} {
  // If no previous snapshot, all fields are null
  if (!prevSnapshot) {
    return {
      prev_leader_still_leads: null,
      prev_leader_current_score: null,
      prev_trailer_current_score: null,
      prev_leader_current_margin: null,
      prev_leader_was_home: null,
    };
  }

  // Determine the previous leader
  const prevLeaderWasHome = prevSnapshot.leadingTeam === 'home';
  const prevLeaderWasAway = prevSnapshot.leadingTeam === 'away';

  // If it was a tie, we can't track previous leader meaningfully
  if (!prevLeaderWasHome && !prevLeaderWasAway) {
    return {
      prev_leader_still_leads: null,
      prev_leader_current_score: null,
      prev_trailer_current_score: null,
      prev_leader_current_margin: null,
      prev_leader_was_home: null,
    };
  }

  // Get current scores for the previous leader and trailer
  const prevLeaderCurrentScore = prevLeaderWasHome ? game.homeScore : game.awayScore;
  const prevTrailerCurrentScore = prevLeaderWasHome ? game.awayScore : game.homeScore;

  // Calculate current margin from previous leader's perspective
  // Positive means prev leader is still ahead, negative means they fell behind
  const prevLeaderCurrentMargin = prevLeaderCurrentScore - prevTrailerCurrentScore;

  // Check if previous leader still leads
  const prevLeaderStillLeads = prevLeaderCurrentMargin > 0 ? 1 : 0;

  return {
    prev_leader_still_leads: prevLeaderStillLeads,
    prev_leader_current_score: prevLeaderCurrentScore,
    prev_trailer_current_score: prevTrailerCurrentScore,
    prev_leader_current_margin: prevLeaderCurrentMargin,
    prev_leader_was_home: prevLeaderWasHome ? 1 : 0,
  };
}

/**
 * Converts a LiveGame into an evaluation context with computed fields
 * Now includes player stats for head-to-head comparisons (V2 port)
 *
 * @param game - The current game state
 * @param playerStats - Optional player stats for head-to-head comparisons
 * @param previousTriggerSnapshot - Optional snapshot from the previous trigger (for sequential evaluation)
 */
export function createEvaluationContext(
  game: LiveGame,
  playerStats?: PlayerStatsForEval,
  previousTriggerSnapshot?: TriggerSnapshot
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

    // =========================================
    // PREVIOUS LEADER FIELDS (for sequential modes)
    // Reference V2: lines 1314-1358
    // =========================================
    ...calculatePrevLeaderFields(game, previousTriggerSnapshot),
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
 * Parses a time string in "Q4 2:20" format to quarter and seconds
 * Returns { quarter, seconds } or null if invalid
 */
function parseStopAtTime(value: string): { quarter: number; seconds: number } | null {
  const match = value.match(/Q(\d+)\s+(\d+):(\d+)/i);
  if (!match) return null;

  const quarter = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);

  return {
    quarter,
    seconds: minutes * 60 + seconds,
  };
}

/**
 * Evaluates all rules for a strategy
 * Returns true if all rules pass (strategy can execute)
 * Returns false if any rule blocks the strategy
 */
export function passesRules(
  rules: Rule[] | undefined,
  game: LiveGame
): { passed: boolean; failedRule?: Rule; reason?: string } {
  // If no rules, all checks pass
  if (!rules || rules.length === 0) {
    return { passed: true };
  }

  const totalScore = game.homeScore + game.awayScore;

  // Parse time remaining to seconds for stop_at comparison
  const timeParts = game.timeRemaining.split(':');
  const timeRemainingSeconds = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);

  for (const rule of rules) {
    switch (rule.type) {
      case 'first_half_only': {
        // Block if Q > 2
        if (game.quarter > 2) {
          return {
            passed: false,
            failedRule: rule,
            reason: `first_half_only: Game is in Q${game.quarter} (blocked after Q2)`,
          };
        }
        break;
      }

      case 'second_half_only': {
        // Block if Q < 3
        if (game.quarter < 3) {
          return {
            passed: false,
            failedRule: rule,
            reason: `second_half_only: Game is in Q${game.quarter} (blocked before Q3)`,
          };
        }
        break;
      }

      case 'specific_quarter': {
        // Block if not in specific quarter
        const requiredQuarter = typeof rule.value === 'number' ? rule.value : parseInt(rule.value as string);
        if (game.quarter !== requiredQuarter) {
          return {
            passed: false,
            failedRule: rule,
            reason: `specific_quarter: Game is in Q${game.quarter} (required Q${requiredQuarter})`,
          };
        }
        break;
      }

      case 'exclude_overtime': {
        // Block if Q > 4
        if (game.quarter > 4) {
          return {
            passed: false,
            failedRule: rule,
            reason: `exclude_overtime: Game is in Q${game.quarter} (overtime not allowed)`,
          };
        }
        break;
      }

      case 'stop_at': {
        // Block after Q + time (e.g., "Q4 2:20" means stop after Q4 2:20)
        if (!rule.value) break;

        const stopAt = parseStopAtTime(rule.value as string);
        if (!stopAt) {
          console.warn(`Invalid stop_at format: ${rule.value}`);
          break;
        }

        // If we're past the stop quarter, block
        if (game.quarter > stopAt.quarter) {
          return {
            passed: false,
            failedRule: rule,
            reason: `stop_at: Game is past Q${stopAt.quarter} (stopped at ${rule.value})`,
          };
        }

        // If we're in the stop quarter and past the time, block
        if (game.quarter === stopAt.quarter && timeRemainingSeconds < stopAt.seconds) {
          return {
            passed: false,
            failedRule: rule,
            reason: `stop_at: Game has passed ${rule.value} (${game.timeRemaining} remaining)`,
          };
        }
        break;
      }

      case 'minimum_score': {
        // Block if total score < threshold
        const threshold = typeof rule.value === 'number' ? rule.value : parseInt(rule.value as string);
        if (totalScore < threshold) {
          return {
            passed: false,
            failedRule: rule,
            reason: `minimum_score: Total score ${totalScore} is below threshold ${threshold}`,
          };
        }
        break;
      }

      default: {
        console.warn(`Unknown rule type: ${rule.type}`);
        break;
      }
    }
  }

  return { passed: true };
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

/**
 * Creates a trigger snapshot from a trigger evaluation result
 * Captures the game state at the moment the trigger fires
 *
 * @param trigger - The trigger that fired
 * @param game - The current game state
 * @returns A TriggerSnapshot capturing the current state
 */
export function createTriggerSnapshot(
  trigger: { id: string; name: string },
  game: LiveGame
): TriggerSnapshot {
  const homeLeading = game.homeScore > game.awayScore;
  const awayLeading = game.awayScore > game.homeScore;

  let leadingTeam: 'home' | 'away' | 'tie' = 'tie';
  if (homeLeading) leadingTeam = 'home';
  else if (awayLeading) leadingTeam = 'away';

  const leadAmount = Math.abs(game.homeScore - game.awayScore);

  return {
    triggerId: trigger.id,
    triggerName: trigger.name,
    timestamp: new Date().toISOString(),
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    leadingTeam,
    leadAmount,
    homeSpread: game.spread,
    awaySpread: game.spread ? -game.spread : undefined,
    totalLine: game.total,
  };
}
