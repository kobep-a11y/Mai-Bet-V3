import { Strategy, HistoricalGame, LiveGame, Condition, TriggerEvaluationResult } from '@/types';
import { createEvaluationContext, evaluateTrigger } from './trigger-engine';
import { getHistoricalGames } from './historical-service';

export interface BacktestResult {
  strategyId: string;
  strategyName: string;
  gamesAnalyzed: number;
  triggersFound: number;
  potentialBets: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number; // Return on Investment assuming -110 juice
  avgOdds: number;
  triggers: BacktestTrigger[];
}

export interface BacktestTrigger {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  triggerQuarter: number;
  triggerTime: string;
  triggerScore: string;
  leadAtTrigger: number;
  finalScore: string;
  spreadAtTrigger?: number;
  result: 'win' | 'loss' | 'push' | 'no_bet';
  reason?: string;
}

/**
 * Convert a HistoricalGame to a LiveGame format for evaluation
 * We simulate different points in the game based on quarter
 */
function historicalToLiveGame(
  historical: HistoricalGame,
  atQuarter: number,
  timeRemaining: string = '5:00'
): LiveGame {
  // Calculate scores at different points in the game
  let homeScore = 0;
  let awayScore = 0;

  if (atQuarter >= 1) {
    homeScore += historical.q1Home;
    awayScore += historical.q1Away;
  }
  if (atQuarter >= 2) {
    homeScore += historical.q2Home;
    awayScore += historical.q2Away;
  }
  if (atQuarter >= 3) {
    homeScore += historical.q3Home;
    awayScore += historical.q3Away;
  }
  if (atQuarter >= 4) {
    homeScore += historical.q4Home;
    awayScore += historical.q4Away;
  }

  return {
    id: historical.id,
    eventId: historical.eventId,
    league: historical.league,
    homeTeam: historical.homeTeam,
    awayTeam: historical.awayTeam,
    homeTeamId: historical.homeTeamId,
    awayTeamId: historical.awayTeamId,
    homeScore,
    awayScore,
    quarter: atQuarter,
    timeRemaining,
    status: atQuarter >= 4 && timeRemaining === '0:00' ? 'final' : 'live',
    quarterScores: {
      q1Home: historical.q1Home,
      q1Away: historical.q1Away,
      q2Home: historical.q2Home,
      q2Away: historical.q2Away,
      q3Home: historical.q3Home,
      q3Away: historical.q3Away,
      q4Home: historical.q4Home,
      q4Away: historical.q4Away,
    },
    halftimeScores: {
      home: historical.halftimeHome,
      away: historical.halftimeAway,
    },
    finalScores: {
      home: historical.finalHomeScore,
      away: historical.finalAwayScore,
    },
    spread: historical.spread || -3.5,
    mlHome: -150,
    mlAway: 130,
    total: historical.total || 215.5,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Simulate a strategy against a historical game
 * Returns trigger points and theoretical results
 */
function simulateStrategy(
  strategy: Strategy,
  historical: HistoricalGame
): BacktestTrigger | null {
  // Find entry triggers
  const entryTriggers = strategy.triggers.filter((t) => t.entryOrClose === 'entry');

  // Test at different game states (every quarter with various time remainings)
  const testPoints = [
    { quarter: 1, time: '10:00' },
    { quarter: 1, time: '5:00' },
    { quarter: 2, time: '10:00' },
    { quarter: 2, time: '5:00' },
    { quarter: 3, time: '10:00' },
    { quarter: 3, time: '5:00' },
    { quarter: 3, time: '2:00' },
    { quarter: 4, time: '10:00' },
    { quarter: 4, time: '8:00' },
    { quarter: 4, time: '5:00' },
    { quarter: 4, time: '3:00' },
    { quarter: 4, time: '2:20' },
  ];

  for (const point of testPoints) {
    const liveGame = historicalToLiveGame(historical, point.quarter, point.time);
    const context = createEvaluationContext(liveGame);

    for (const trigger of entryTriggers) {
      const evaluation = evaluateTrigger(trigger, context);

      if (evaluation.passed) {
        // Entry trigger fired at this point
        const leadAtTrigger = Math.abs(liveGame.homeScore - liveGame.awayScore);
        const leadingTeam = liveGame.homeScore > liveGame.awayScore ? 'home' : 'away';

        // Determine result based on strategy odds requirement
        let result: 'win' | 'loss' | 'push' | 'no_bet' = 'no_bet';
        let reason: string | undefined;

        if (strategy.oddsRequirement) {
          const { type, value, betSide } = strategy.oddsRequirement;

          // Determine which team we're betting on
          let bettingOnHome: boolean;
          if (betSide === 'leading_team') {
            bettingOnHome = leadingTeam === 'home';
          } else if (betSide === 'trailing_team') {
            bettingOnHome = leadingTeam !== 'home';
          } else if (betSide === 'home') {
            bettingOnHome = true;
          } else {
            bettingOnHome = false;
          }

          // Calculate result based on bet type
          const finalDiff = historical.finalHomeScore - historical.finalAwayScore;
          const totalPoints = historical.finalHomeScore + historical.finalAwayScore;

          switch (type) {
            case 'spread': {
              // Assume the spread at trigger is similar to the required value
              const spreadUsed = value;
              if (bettingOnHome) {
                const homeCover = finalDiff > -spreadUsed;
                const push = finalDiff === -spreadUsed;
                result = push ? 'push' : homeCover ? 'win' : 'loss';
              } else {
                const awayCover = -finalDiff > spreadUsed;
                const push = -finalDiff === spreadUsed;
                result = push ? 'push' : awayCover ? 'win' : 'loss';
              }
              break;
            }
            case 'moneyline': {
              if (finalDiff === 0) {
                result = 'push';
              } else {
                const homeWon = finalDiff > 0;
                result = bettingOnHome === homeWon ? 'win' : 'loss';
              }
              break;
            }
            case 'total_over': {
              const totalLine = historical.total || 215.5;
              if (totalPoints === totalLine) {
                result = 'push';
              } else {
                result = totalPoints > totalLine ? 'win' : 'loss';
              }
              break;
            }
            case 'total_under': {
              const totalLine = historical.total || 215.5;
              if (totalPoints === totalLine) {
                result = 'push';
              } else {
                result = totalPoints < totalLine ? 'win' : 'loss';
              }
              break;
            }
          }
        } else {
          reason = 'No odds requirement defined';
        }

        return {
          gameId: historical.id,
          homeTeam: historical.homeTeam,
          awayTeam: historical.awayTeam,
          triggerQuarter: point.quarter,
          triggerTime: point.time,
          triggerScore: `${liveGame.awayScore}-${liveGame.homeScore}`,
          leadAtTrigger,
          finalScore: `${historical.finalAwayScore}-${historical.finalHomeScore}`,
          spreadAtTrigger: historical.spread,
          result,
          reason,
        };
      }
    }
  }

  return null;
}

/**
 * Run a full backtest of a strategy against historical games
 */
export async function runBacktest(
  strategy: Strategy,
  options: {
    limit?: number;
    fromDate?: string;
    toDate?: string;
  } = {}
): Promise<BacktestResult> {
  const { limit = 1000, fromDate, toDate } = options;

  // Build filter
  let filterByFormula: string | undefined;
  if (fromDate || toDate) {
    const filters: string[] = [];
    if (fromDate) filters.push(`{Game Date} >= '${fromDate}'`);
    if (toDate) filters.push(`{Game Date} <= '${toDate}'`);
    filterByFormula = filters.length > 1 ? `AND(${filters.join(',')})` : filters[0];
  }

  // Get historical games
  const { games } = await getHistoricalGames({ limit, filterByFormula });

  const triggers: BacktestTrigger[] = [];
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let noBets = 0;

  for (const game of games) {
    const triggerResult = simulateStrategy(strategy, game);
    if (triggerResult) {
      triggers.push(triggerResult);

      switch (triggerResult.result) {
        case 'win':
          wins++;
          break;
        case 'loss':
          losses++;
          break;
        case 'push':
          pushes++;
          break;
        case 'no_bet':
          noBets++;
          break;
      }
    }
  }

  // Calculate stats
  const totalBets = wins + losses;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 1000) / 10 : 0;

  // ROI assuming -110 juice (bet $110 to win $100)
  // Win: +$100, Loss: -$110
  const profit = wins * 100 - losses * 110;
  const totalWagered = (wins + losses) * 110;
  const roi = totalWagered > 0 ? Math.round((profit / totalWagered) * 1000) / 10 : 0;

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    gamesAnalyzed: games.length,
    triggersFound: triggers.length,
    potentialBets: wins + losses + pushes,
    wins,
    losses,
    pushes,
    winRate,
    roi,
    avgOdds: -110, // Standard juice
    triggers,
  };
}

/**
 * Compare multiple strategies against the same dataset
 */
export async function compareStrategies(
  strategies: Strategy[],
  options: {
    limit?: number;
    fromDate?: string;
    toDate?: string;
  } = {}
): Promise<{
  results: BacktestResult[];
  summary: {
    totalGamesAnalyzed: number;
    bestByWinRate: { strategy: string; winRate: number };
    bestByROI: { strategy: string; roi: number };
    mostTriggers: { strategy: string; triggers: number };
  };
}> {
  const results: BacktestResult[] = [];

  for (const strategy of strategies) {
    const result = await runBacktest(strategy, options);
    results.push(result);
  }

  // Find bests
  const bestByWinRate = results.reduce((best, r) =>
    r.winRate > best.winRate ? r : best
  , results[0]);

  const bestByROI = results.reduce((best, r) =>
    r.roi > best.roi ? r : best
  , results[0]);

  const mostTriggers = results.reduce((best, r) =>
    r.triggersFound > best.triggersFound ? r : best
  , results[0]);

  return {
    results,
    summary: {
      totalGamesAnalyzed: results[0]?.gamesAnalyzed || 0,
      bestByWinRate: {
        strategy: bestByWinRate?.strategyName || 'N/A',
        winRate: bestByWinRate?.winRate || 0,
      },
      bestByROI: {
        strategy: bestByROI?.strategyName || 'N/A',
        roi: bestByROI?.roi || 0,
      },
      mostTriggers: {
        strategy: mostTriggers?.strategyName || 'N/A',
        triggers: mostTriggers?.triggersFound || 0,
      },
    },
  };
}
