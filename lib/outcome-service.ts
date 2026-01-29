/**
 * ============================================================================
 * OUTCOME SERVICE - Win Requirement Evaluation & Auto-Outcome Calculation
 * ============================================================================
 *
 * This service handles the evaluation of win requirements to determine
 * the final outcome (win/loss/push) of signals after a game ends.
 *
 * Win Requirements vs Odds Requirements:
 * - OddsRequirement: Determines WHEN to take a bet (spread alignment)
 * - WinRequirement: Determines IF the bet WON based on game result
 *
 * Supported Win Requirement Types:
 * - leading_team_wins: Leading team at signal time must win game
 * - home_wins: Home team must win
 * - away_wins: Away team must win
 * - final_lead_gte: Final lead must be >= threshold
 * - final_lead_lte: Final lead must be <= threshold
 * ============================================================================
 */

import {
  Signal,
  LiveGame,
  Strategy,
  WinRequirement,
  WinRequirementType,
} from '@/types';

/**
 * Outcome result type
 */
export type OutcomeResult = 'win' | 'loss' | 'push';

/**
 * Result of evaluating a single win requirement
 */
export interface WinRequirementEvaluationResult {
  requirement: WinRequirement;
  passed: boolean;
  reason: string;
}

/**
 * Full outcome evaluation result
 */
export interface OutcomeEvaluationResult {
  outcome: OutcomeResult;
  requirementResults: WinRequirementEvaluationResult[];
  summary: string;
}

/**
 * Get the final scores from a game
 * Uses finalScores if available, otherwise falls back to current scores
 */
function getFinalScores(game: LiveGame): { home: number; away: number } {
  return {
    home: game.finalScores?.home ?? game.homeScore,
    away: game.finalScores?.away ?? game.awayScore,
  };
}

/**
 * Determine who won the game
 */
function getGameWinner(game: LiveGame): 'home' | 'away' | 'tie' {
  const { home, away } = getFinalScores(game);
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'tie';
}

/**
 * Get the final lead (winning margin)
 * Positive = home team won by X, Negative = away team won by X
 */
function getFinalLead(game: LiveGame): number {
  const { home, away } = getFinalScores(game);
  return home - away;
}

/**
 * Evaluate a single win requirement against the final game state
 */
export function evaluateWinRequirement(
  requirement: WinRequirement,
  signal: Signal,
  game: LiveGame
): WinRequirementEvaluationResult {
  const { type, value } = requirement;
  const winner = getGameWinner(game);
  const finalLead = getFinalLead(game);
  const finalLeadAbs = Math.abs(finalLead);
  const { home: finalHome, away: finalAway } = getFinalScores(game);

  switch (type) {
    case 'leading_team_wins': {
      // The team that was leading when the signal was created must win
      const leadingTeam = signal.leadingTeamAtTrigger;

      if (!leadingTeam) {
        // If no leading team was recorded, treat as push
        return {
          requirement,
          passed: false,
          reason: 'No leading team recorded at trigger time - cannot evaluate',
        };
      }

      // Tie at signal time (shouldn't happen if leadingTeam is set, but handle edge case)
      if (winner === 'tie') {
        return {
          requirement,
          passed: false,
          reason: `Game ended in tie (${finalHome}-${finalAway})`,
        };
      }

      const passed = leadingTeam === winner;
      return {
        requirement,
        passed,
        reason: passed
          ? `Leading team (${leadingTeam}) won the game (${finalAway}-${finalHome})`
          : `Leading team (${leadingTeam}) lost the game (${finalAway}-${finalHome}, winner: ${winner})`,
      };
    }

    case 'home_wins': {
      if (winner === 'tie') {
        return {
          requirement,
          passed: false,
          reason: `Game ended in tie (${finalHome}-${finalAway})`,
        };
      }

      const passed = winner === 'home';
      return {
        requirement,
        passed,
        reason: passed
          ? `Home team won (${finalHome}-${finalAway})`
          : `Home team lost (${finalAway}-${finalHome})`,
      };
    }

    case 'away_wins': {
      if (winner === 'tie') {
        return {
          requirement,
          passed: false,
          reason: `Game ended in tie (${finalHome}-${finalAway})`,
        };
      }

      const passed = winner === 'away';
      return {
        requirement,
        passed,
        reason: passed
          ? `Away team won (${finalAway}-${finalHome})`
          : `Away team lost (${finalHome}-${finalAway})`,
      };
    }

    case 'final_lead_gte': {
      // Final lead must be >= threshold
      // This is relative to the leading team at trigger time
      const threshold = value ?? 0;
      const leadingTeam = signal.leadingTeamAtTrigger;

      if (!leadingTeam) {
        // No leading team recorded - use absolute margin
        const passed = finalLeadAbs >= threshold;
        return {
          requirement,
          passed,
          reason: passed
            ? `Final margin (${finalLeadAbs}) >= ${threshold}`
            : `Final margin (${finalLeadAbs}) < ${threshold}`,
        };
      }

      // Calculate margin from leading team's perspective
      const leaderFinalMargin =
        leadingTeam === 'home' ? finalLead : -finalLead;
      const passed = leaderFinalMargin >= threshold;

      return {
        requirement,
        passed,
        reason: passed
          ? `${leadingTeam} team's final margin (${leaderFinalMargin}) >= ${threshold}`
          : `${leadingTeam} team's final margin (${leaderFinalMargin}) < ${threshold}`,
      };
    }

    case 'final_lead_lte': {
      // Final lead must be <= threshold
      // Useful for strategies that need close games
      const threshold = value ?? 0;
      const leadingTeam = signal.leadingTeamAtTrigger;

      if (!leadingTeam) {
        // No leading team recorded - use absolute margin
        const passed = finalLeadAbs <= threshold;
        return {
          requirement,
          passed,
          reason: passed
            ? `Final margin (${finalLeadAbs}) <= ${threshold}`
            : `Final margin (${finalLeadAbs}) > ${threshold}`,
        };
      }

      // Calculate margin from leading team's perspective
      const leaderFinalMargin =
        leadingTeam === 'home' ? finalLead : -finalLead;
      const passed = leaderFinalMargin <= threshold;

      return {
        requirement,
        passed,
        reason: passed
          ? `${leadingTeam} team's final margin (${leaderFinalMargin}) <= ${threshold}`
          : `${leadingTeam} team's final margin (${leaderFinalMargin}) > ${threshold}`,
      };
    }

    default: {
      // Unknown requirement type - treat as failed
      const unknownType = type as string;
      return {
        requirement,
        passed: false,
        reason: `Unknown win requirement type: ${unknownType}`,
      };
    }
  }
}

/**
 * Evaluate all win requirements for a signal
 *
 * Logic:
 * - If ANY requirement fails, the bet loses
 * - If ALL requirements pass, the bet wins
 * - Special handling for ties (push) when applicable
 *
 * @param signal The signal to evaluate
 * @param game The final game state
 * @param strategy The strategy (used to get win requirements if not stored on signal)
 * @returns The outcome and detailed evaluation results
 */
export function evaluateOutcome(
  signal: Signal,
  game: LiveGame,
  strategy?: Strategy
): OutcomeEvaluationResult {
  // Get win requirements - prefer signal's stored requirements, fall back to strategy
  const winRequirements =
    signal.winRequirements ||
    strategy?.winRequirements ||
    [];

  // If no win requirements defined, fall back to basic spread/ML logic
  if (winRequirements.length === 0) {
    return evaluateOutcomeBasic(signal, game, strategy);
  }

  // Evaluate each requirement
  const requirementResults = winRequirements.map((req) =>
    evaluateWinRequirement(req, signal, game)
  );

  // Check if all requirements passed
  const allPassed = requirementResults.every((r) => r.passed);
  const anyFailed = requirementResults.some((r) => !r.passed);

  // Determine outcome
  let outcome: OutcomeResult;
  let summary: string;

  if (allPassed) {
    outcome = 'win';
    summary = `All ${requirementResults.length} win requirements passed`;
  } else {
    outcome = 'loss';
    const failedCount = requirementResults.filter((r) => !r.passed).length;
    summary = `${failedCount}/${requirementResults.length} win requirements failed`;
  }

  return {
    outcome,
    requirementResults,
    summary,
  };
}

/**
 * Basic outcome evaluation when no win requirements are defined
 * Falls back to spread/ML logic based on OddsRequirement
 *
 * This is the existing logic from game-end-check/route.ts
 */
function evaluateOutcomeBasic(
  signal: Signal,
  game: LiveGame,
  strategy?: Strategy
): OutcomeEvaluationResult {
  const { home: finalHome, away: finalAway } = getFinalScores(game);
  const finalDiff = finalHome - finalAway;

  const oddsReq = strategy?.oddsRequirement;

  // No odds requirement - can't determine result
  if (!oddsReq) {
    return {
      outcome: 'push',
      requirementResults: [],
      summary: 'No win requirements or odds requirement defined - defaulting to push',
    };
  }

  const { type, betSide, value } = oddsReq;
  const leadingAtTrigger =
    signal.leadingTeamAtTrigger ||
    (signal.homeScore > signal.awayScore ? 'home' : 'away');

  // Determine which team was bet on
  let bettingOnHome: boolean;
  if (betSide === 'leading_team') {
    bettingOnHome = leadingAtTrigger === 'home';
  } else if (betSide === 'trailing_team') {
    bettingOnHome = leadingAtTrigger !== 'home';
  } else if (betSide === 'home') {
    bettingOnHome = true;
  } else {
    bettingOnHome = false;
  }

  let outcome: OutcomeResult;
  let summary: string;

  switch (type) {
    case 'spread': {
      const spreadUsed = signal.actualSpreadAtEntry || value;

      if (bettingOnHome) {
        const homeCover = finalDiff > -spreadUsed;
        const push = finalDiff === -spreadUsed;
        if (push) {
          outcome = 'push';
          summary = `Home team pushed at spread ${spreadUsed} (final diff: ${finalDiff})`;
        } else if (homeCover) {
          outcome = 'win';
          summary = `Home team covered spread ${spreadUsed} (final diff: ${finalDiff})`;
        } else {
          outcome = 'loss';
          summary = `Home team failed to cover spread ${spreadUsed} (final diff: ${finalDiff})`;
        }
      } else {
        const awayCover = -finalDiff > spreadUsed;
        const push = -finalDiff === spreadUsed;
        if (push) {
          outcome = 'push';
          summary = `Away team pushed at spread ${-spreadUsed} (final diff: ${-finalDiff})`;
        } else if (awayCover) {
          outcome = 'win';
          summary = `Away team covered spread ${-spreadUsed} (final diff: ${-finalDiff})`;
        } else {
          outcome = 'loss';
          summary = `Away team failed to cover spread ${-spreadUsed} (final diff: ${-finalDiff})`;
        }
      }
      break;
    }

    case 'moneyline': {
      if (finalHome === finalAway) {
        outcome = 'push';
        summary = `Game ended in tie (${finalHome}-${finalAway})`;
      } else {
        const homeWon = finalHome > finalAway;
        if (bettingOnHome === homeWon) {
          outcome = 'win';
          summary = bettingOnHome
            ? `Home team won (${finalHome}-${finalAway})`
            : `Away team won (${finalAway}-${finalHome})`;
        } else {
          outcome = 'loss';
          summary = bettingOnHome
            ? `Home team lost (${finalAway}-${finalHome})`
            : `Away team lost (${finalHome}-${finalAway})`;
        }
      }
      break;
    }

    case 'total_over': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) {
        outcome = 'push';
        summary = `Total points (${totalPoints}) equals line (${totalLine})`;
      } else if (totalPoints > totalLine) {
        outcome = 'win';
        summary = `Over hit: ${totalPoints} > ${totalLine}`;
      } else {
        outcome = 'loss';
        summary = `Over missed: ${totalPoints} < ${totalLine}`;
      }
      break;
    }

    case 'total_under': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) {
        outcome = 'push';
        summary = `Total points (${totalPoints}) equals line (${totalLine})`;
      } else if (totalPoints < totalLine) {
        outcome = 'win';
        summary = `Under hit: ${totalPoints} < ${totalLine}`;
      } else {
        outcome = 'loss';
        summary = `Under missed: ${totalPoints} > ${totalLine}`;
      }
      break;
    }

    default:
      outcome = 'push';
      summary = `Unknown odds type: ${type}`;
  }

  return {
    outcome,
    requirementResults: [],
    summary,
  };
}

/**
 * Batch evaluate outcomes for multiple signals
 * Useful for processing all signals from a finished game
 */
export function evaluateOutcomes(
  signals: Signal[],
  game: LiveGame,
  strategies: Map<string, Strategy>
): Map<string, OutcomeEvaluationResult> {
  const results = new Map<string, OutcomeEvaluationResult>();

  for (const signal of signals) {
    const strategy = strategies.get(signal.strategyId);
    const result = evaluateOutcome(signal, game, strategy);
    results.set(signal.id, result);
  }

  return results;
}

/**
 * Format outcome result for logging/display
 */
export function formatOutcomeResult(
  signal: Signal,
  result: OutcomeEvaluationResult
): string {
  const emoji =
    result.outcome === 'win' ? '✅' :
    result.outcome === 'loss' ? '❌' : '➖';

  return `${emoji} ${signal.strategyName}: ${result.outcome.toUpperCase()} - ${result.summary}`;
}
