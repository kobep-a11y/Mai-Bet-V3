/**
 * AI Strategy Discovery
 * Analyzes historical data to discover potentially profitable betting strategies
 */

import { HistoricalGame, Condition, ConditionOperator, Strategy, StrategyTrigger, WinRequirement } from '@/types';
import { getHistoricalGames } from '@/lib/historical-service';
import { discoverPatterns, Pattern, PatternStats } from './pattern-miner';

// ============================================
// TYPES
// ============================================

export interface DiscoveredStrategy {
  id: string;
  name: string;
  description: string;
  conditions: Condition[];
  stats: StrategyStats;
  confidence: number; // 0-1 confidence score
  sampleSize: number;
  suggestedWinRequirement?: WinRequirement;
  backtestResults?: BacktestResult;
}

export interface StrategyStats {
  totalSignals: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  profitUnits: number; // Assuming -110 juice
  roi: number;
  avgOdds?: number;
  streak?: { current: number; type: 'W' | 'L' };
}

export interface BacktestResult {
  startDate: string;
  endDate: string;
  gamesEvaluated: number;
  signalsGenerated: number;
  results: { date: string; result: 'win' | 'loss' | 'push' }[];
}

export interface DiscoveryParams {
  minSampleSize?: number; // Minimum games to consider pattern (default: 20)
  minWinRate?: number; // Minimum win rate to include (default: 52%)
  minConfidence?: number; // Minimum confidence score (default: 0.6)
  dateRange?: { start: string; end: string };
  sport?: string;
}

export interface DiscoveryResult {
  strategies: DiscoveredStrategy[];
  totalGamesAnalyzed: number;
  analysisDate: string;
  params: DiscoveryParams;
}

// ============================================
// STRATEGY DISCOVERY
// ============================================

/**
 * Discover profitable strategies from historical data
 */
export async function discoverStrategies(
  params: DiscoveryParams = {}
): Promise<DiscoveryResult> {
  const {
    minSampleSize = 20,
    minWinRate = 52,
    minConfidence = 0.6,
  } = params;

  // Fetch historical games
  const { games } = await getHistoricalGames({ limit: 1000 });

  if (games.length < minSampleSize) {
    return {
      strategies: [],
      totalGamesAnalyzed: games.length,
      analysisDate: new Date().toISOString(),
      params,
    };
  }

  const discoveredStrategies: DiscoveredStrategy[] = [];

  // 1. Discover patterns from the pattern miner
  const patternResult = await discoverPatterns();
  for (const pattern of patternResult.patterns) {
    const strategy = patternToStrategy(pattern, games);
    if (
      strategy.stats.winRate >= minWinRate &&
      strategy.confidence >= minConfidence &&
      strategy.sampleSize >= minSampleSize
    ) {
      discoveredStrategies.push(strategy);
    }
  }

  // 2. Mine additional strategies based on specific conditions
  const leadStrategies = mineLeadBasedStrategies(games, minSampleSize, minWinRate);
  const quarterStrategies = mineQuarterStrategies(games, minSampleSize, minWinRate);
  const scoringStrategies = mineScoringPatternStrategies(games, minSampleSize, minWinRate);

  discoveredStrategies.push(...leadStrategies, ...quarterStrategies, ...scoringStrategies);

  // Sort by expected value (win rate * sample size as proxy)
  discoveredStrategies.sort((a, b) => {
    const scoreA = a.stats.winRate * Math.log(a.sampleSize + 1) * a.confidence;
    const scoreB = b.stats.winRate * Math.log(b.sampleSize + 1) * b.confidence;
    return scoreB - scoreA;
  });

  // Deduplicate similar strategies
  const uniqueStrategies = deduplicateStrategies(discoveredStrategies);

  return {
    strategies: uniqueStrategies.slice(0, 20), // Top 20
    totalGamesAnalyzed: games.length,
    analysisDate: new Date().toISOString(),
    params,
  };
}

// ============================================
// PATTERN TO STRATEGY CONVERSION
// ============================================

function patternToStrategy(
  pattern: Pattern,
  games: HistoricalGame[]
): DiscoveredStrategy {
  // Convert pattern conditions to strategy conditions
  const conditions: Condition[] = pattern.conditions.map((pc) => ({
    field: pc.field as string,
    operator: convertOperator(pc.operator),
    value: Array.isArray(pc.value) ? pc.value[0] : pc.value,
    value2: Array.isArray(pc.value) ? pc.value[1] : undefined,
  }));

  // Calculate stats for this pattern
  const matchingGames = filterGamesWithPattern(games, pattern);
  const stats = calculateStrategyStats(matchingGames);

  // Determine best win requirement based on pattern type
  const winRequirement = suggestWinRequirement(pattern, stats);

  return {
    id: `pattern-${pattern.id}`,
    name: pattern.name,
    description: pattern.description,
    conditions,
    stats,
    confidence: calculatePatternConfidence(pattern, matchingGames.length),
    sampleSize: matchingGames.length,
    suggestedWinRequirement: winRequirement,
  };
}

function convertOperator(op: string): ConditionOperator {
  const mapping: Record<string, ConditionOperator> = {
    '>': 'greater_than',
    '<': 'less_than',
    '>=': 'greater_than_or_equal',
    '<=': 'less_than_or_equal',
    '==': 'equals',
    'between': 'between',
  };
  return mapping[op] || 'equals';
}

function filterGamesWithPattern(
  games: HistoricalGame[],
  pattern: Pattern
): HistoricalGame[] {
  return games.filter((game) => {
    for (const condition of pattern.conditions) {
      const gameValue = getGameFieldValue(game, condition.field);
      if (gameValue === null) return false;

      if (Array.isArray(condition.value)) {
        // Between operator
        if (gameValue < condition.value[0] || gameValue > condition.value[1]) {
          return false;
        }
      } else {
        switch (condition.operator) {
          case '>':
            if (gameValue <= condition.value) return false;
            break;
          case '<':
            if (gameValue >= condition.value) return false;
            break;
          case '>=':
            if (gameValue < condition.value) return false;
            break;
          case '<=':
            if (gameValue > condition.value) return false;
            break;
          case '==':
            if (gameValue !== condition.value) return false;
            break;
        }
      }
    }
    return true;
  });
}

function getGameFieldValue(game: HistoricalGame, field: string): number | null {
  const fieldMapping: Record<string, (g: HistoricalGame) => number | null> = {
    'q1Total': (g) => g.q1Home + g.q1Away,
    'q1Differential': (g) => g.q1Home - g.q1Away,
    'q2Total': (g) => g.q2Home + g.q2Away,
    'q2Differential': (g) => g.q2Home - g.q2Away,
    'q3Total': (g) => g.q3Home + g.q3Away,
    'q3Differential': (g) => g.q3Home - g.q3Away,
    'q4Total': (g) => g.q4Home + g.q4Away,
    'halftimeTotal': (g) => g.halftimeHome + g.halftimeAway,
    'halftimeDifferential': (g) => Math.abs(g.halftimeHome - g.halftimeAway),
    'totalPoints': (g) => g.totalPoints,
    'pointDifferential': (g) => Math.abs(g.pointDifferential),
    'momentumShift': (g) => {
      const htLeader = g.halftimeHome > g.halftimeAway ? 'home' : 'away';
      const q3Winner = g.q3Home > g.q3Away ? 'home' : 'away';
      return htLeader !== q3Winner ? 1 : 0;
    },
  };

  const getValue = fieldMapping[field];
  return getValue ? getValue(game) : null;
}

// ============================================
// LEAD-BASED STRATEGIES
// ============================================

function mineLeadBasedStrategies(
  games: HistoricalGame[],
  minSample: number,
  minWinRate: number
): DiscoveredStrategy[] {
  const strategies: DiscoveredStrategy[] = [];

  // Strategy: Large halftime lead (leader covers)
  const leadThresholds = [8, 10, 12, 15];

  for (const threshold of leadThresholds) {
    const matchingGames = games.filter(
      (g) => Math.abs(g.halftimeHome - g.halftimeAway) >= threshold
    );

    if (matchingGames.length >= minSample) {
      // Check if halftime leader tends to cover
      const leaderCovers = matchingGames.filter((g) => {
        const htLeader = g.halftimeHome > g.halftimeAway ? 'home' : 'away';
        return (
          (htLeader === 'home' && g.spreadResult === 'home_cover') ||
          (htLeader === 'away' && g.spreadResult === 'away_cover')
        );
      }).length;

      const spreadGames = matchingGames.filter(
        (g) => g.spreadResult && g.spreadResult !== 'push'
      ).length;
      const winRate = spreadGames > 0 ? (leaderCovers / spreadGames) * 100 : 50;

      if (winRate >= minWinRate) {
        strategies.push({
          id: `lead-${threshold}-cover`,
          name: `${threshold}+ Point Halftime Lead`,
          description: `Bet on the halftime leader to cover when leading by ${threshold}+ points`,
          conditions: [
            {
              field: 'halftimeLead',
              operator: 'greater_than_or_equal',
              value: threshold,
            },
          ],
          stats: calculateStrategyStats(matchingGames),
          confidence: calculateConfidenceFromSample(
            matchingGames.length,
            winRate
          ),
          sampleSize: matchingGames.length,
          suggestedWinRequirement: { type: 'leading_team_wins' },
        });
      }

      // Check if halftime trailer tends to cover (fade the lead)
      const trailerCovers = matchingGames.filter((g) => {
        const htLeader = g.halftimeHome > g.halftimeAway ? 'home' : 'away';
        return (
          (htLeader === 'home' && g.spreadResult === 'away_cover') ||
          (htLeader === 'away' && g.spreadResult === 'home_cover')
        );
      }).length;

      const fadeWinRate =
        spreadGames > 0 ? (trailerCovers / spreadGames) * 100 : 50;

      if (fadeWinRate >= minWinRate) {
        strategies.push({
          id: `lead-${threshold}-fade`,
          name: `Fade ${threshold}+ Point Lead`,
          description: `Bet on the halftime trailer to cover when down ${threshold}+ points`,
          conditions: [
            {
              field: 'halftimeLead',
              operator: 'greater_than_or_equal',
              value: threshold,
            },
          ],
          stats: {
            ...calculateStrategyStats(matchingGames),
            winRate: fadeWinRate,
          },
          confidence: calculateConfidenceFromSample(
            matchingGames.length,
            fadeWinRate
          ),
          sampleSize: matchingGames.length,
        });
      }
    }
  }

  return strategies;
}

// ============================================
// QUARTER-SPECIFIC STRATEGIES
// ============================================

function mineQuarterStrategies(
  games: HistoricalGame[],
  minSample: number,
  minWinRate: number
): DiscoveredStrategy[] {
  const strategies: DiscoveredStrategy[] = [];

  // Q1 winner correlation with game winner
  const q1HomeWinGames = games.filter((g) => g.q1Home > g.q1Away);

  if (q1HomeWinGames.length >= minSample) {
    const homeWinsGame = q1HomeWinGames.filter(
      (g) => g.winner === 'home'
    ).length;
    const winRate = (homeWinsGame / q1HomeWinGames.length) * 100;

    if (winRate >= minWinRate) {
      strategies.push({
        id: 'q1-winner-wins-game',
        name: 'Q1 Winner Moneyline',
        description:
          'Bet on the Q1 winner to win the game outright',
        conditions: [
          { field: 'q1Differential', operator: 'greater_than', value: 0 },
          { field: 'quarter', operator: 'equals', value: 2 },
        ],
        stats: {
          totalSignals: q1HomeWinGames.length,
          wins: homeWinsGame,
          losses: q1HomeWinGames.length - homeWinsGame,
          pushes: 0,
          winRate,
          profitUnits: calculateProfitUnits(
            homeWinsGame,
            q1HomeWinGames.length - homeWinsGame
          ),
          roi: calculateROI(
            homeWinsGame,
            q1HomeWinGames.length - homeWinsGame,
            q1HomeWinGames.length
          ),
        },
        confidence: calculateConfidenceFromSample(
          q1HomeWinGames.length,
          winRate
        ),
        sampleSize: q1HomeWinGames.length,
        suggestedWinRequirement: { type: 'leading_team_wins' },
      });
    }
  }

  // Q3 scoring explosion correlation with over
  const highQ3Games = games.filter((g) => g.q3Home + g.q3Away > 28);

  if (highQ3Games.length >= minSample) {
    const overs = highQ3Games.filter((g) => g.totalResult === 'over').length;
    const totalGames = highQ3Games.filter(
      (g) => g.totalResult && g.totalResult !== 'push'
    ).length;
    const overRate = totalGames > 0 ? (overs / totalGames) * 100 : 50;

    if (overRate >= minWinRate) {
      strategies.push({
        id: 'q3-explosion-over',
        name: 'Q3 Scoring Explosion Over',
        description:
          'Bet the over when Q3 combined scoring exceeds 28 points',
        conditions: [
          { field: 'q3Total', operator: 'greater_than', value: 28 },
        ],
        stats: {
          totalSignals: highQ3Games.length,
          wins: overs,
          losses: totalGames - overs,
          pushes: highQ3Games.length - totalGames,
          winRate: overRate,
          profitUnits: calculateProfitUnits(overs, totalGames - overs),
          roi: calculateROI(overs, totalGames - overs, totalGames),
        },
        confidence: calculateConfidenceFromSample(highQ3Games.length, overRate),
        sampleSize: highQ3Games.length,
      });
    }
  }

  return strategies;
}

// ============================================
// SCORING PATTERN STRATEGIES
// ============================================

function mineScoringPatternStrategies(
  games: HistoricalGame[],
  minSample: number,
  minWinRate: number
): DiscoveredStrategy[] {
  const strategies: DiscoveredStrategy[] = [];

  // High-scoring first half correlation with over
  const highFirstHalf = games.filter(
    (g) => g.halftimeHome + g.halftimeAway > 55
  );

  if (highFirstHalf.length >= minSample) {
    const overs = highFirstHalf.filter(
      (g) => g.totalResult === 'over'
    ).length;
    const totalGames = highFirstHalf.filter(
      (g) => g.totalResult && g.totalResult !== 'push'
    ).length;
    const overRate = totalGames > 0 ? (overs / totalGames) * 100 : 50;

    if (overRate >= minWinRate) {
      strategies.push({
        id: 'high-first-half-over',
        name: 'High First Half Over',
        description:
          'Bet the over when first half combined scoring exceeds 55',
        conditions: [
          { field: 'firstHalfTotal', operator: 'greater_than', value: 55 },
        ],
        stats: {
          totalSignals: highFirstHalf.length,
          wins: overs,
          losses: totalGames - overs,
          pushes: highFirstHalf.length - totalGames,
          winRate: overRate,
          profitUnits: calculateProfitUnits(overs, totalGames - overs),
          roi: calculateROI(overs, totalGames - overs, totalGames),
        },
        confidence: calculateConfidenceFromSample(highFirstHalf.length, overRate),
        sampleSize: highFirstHalf.length,
      });
    }
  }

  // Low-scoring first half correlation with under
  const lowFirstHalf = games.filter(
    (g) => g.halftimeHome + g.halftimeAway < 45
  );

  if (lowFirstHalf.length >= minSample) {
    const unders = lowFirstHalf.filter(
      (g) => g.totalResult === 'under'
    ).length;
    const totalGames = lowFirstHalf.filter(
      (g) => g.totalResult && g.totalResult !== 'push'
    ).length;
    const underRate = totalGames > 0 ? (unders / totalGames) * 100 : 50;

    if (underRate >= minWinRate) {
      strategies.push({
        id: 'low-first-half-under',
        name: 'Low First Half Under',
        description:
          'Bet the under when first half combined scoring is below 45',
        conditions: [
          { field: 'firstHalfTotal', operator: 'less_than', value: 45 },
        ],
        stats: {
          totalSignals: lowFirstHalf.length,
          wins: unders,
          losses: totalGames - unders,
          pushes: lowFirstHalf.length - totalGames,
          winRate: underRate,
          profitUnits: calculateProfitUnits(unders, totalGames - unders),
          roi: calculateROI(unders, totalGames - unders, totalGames),
        },
        confidence: calculateConfidenceFromSample(lowFirstHalf.length, underRate),
        sampleSize: lowFirstHalf.length,
      });
    }
  }

  // Blowout games (large margin) analysis
  const blowoutGames = games.filter((g) => Math.abs(g.pointDifferential) >= 15);

  if (blowoutGames.length >= minSample) {
    // Check if home team blowouts correlate with home covering
    const homeBlowouts = blowoutGames.filter((g) => g.pointDifferential >= 15);
    if (homeBlowouts.length >= minSample / 2) {
      const homeCovers = homeBlowouts.filter(
        (g) => g.spreadResult === 'home_cover'
      ).length;
      const spreadGames = homeBlowouts.filter(
        (g) => g.spreadResult && g.spreadResult !== 'push'
      ).length;
      const coverRate =
        spreadGames > 0 ? (homeCovers / spreadGames) * 100 : 50;

      if (coverRate >= minWinRate) {
        strategies.push({
          id: 'home-blowout',
          name: 'Home Blowout Cover',
          description:
            'Bet on home team to cover in games where they dominate',
          conditions: [
            { field: 'currentLead', operator: 'greater_than_or_equal', value: 15 },
            { field: 'homeLeading', operator: 'equals', value: 1 },
          ],
          stats: {
            totalSignals: homeBlowouts.length,
            wins: homeCovers,
            losses: spreadGames - homeCovers,
            pushes: homeBlowouts.length - spreadGames,
            winRate: coverRate,
            profitUnits: calculateProfitUnits(
              homeCovers,
              spreadGames - homeCovers
            ),
            roi: calculateROI(
              homeCovers,
              spreadGames - homeCovers,
              spreadGames
            ),
          },
          confidence: calculateConfidenceFromSample(homeBlowouts.length, coverRate),
          sampleSize: homeBlowouts.length,
          suggestedWinRequirement: { type: 'home_wins' },
        });
      }
    }
  }

  return strategies;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateStrategyStats(games: HistoricalGame[]): StrategyStats {
  if (games.length === 0) {
    return {
      totalSignals: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      profitUnits: 0,
      roi: 0,
    };
  }

  // Default to spread results for stats
  const spreadGames = games.filter(
    (g) => g.spreadResult && g.spreadResult !== 'push'
  );
  const wins = games.filter((g) => g.spreadResult === 'home_cover').length;
  const losses = games.filter((g) => g.spreadResult === 'away_cover').length;
  const pushes = games.filter((g) => g.spreadResult === 'push').length;

  const winRate = spreadGames.length > 0 ? (wins / spreadGames.length) * 100 : 50;

  return {
    totalSignals: games.length,
    wins,
    losses,
    pushes,
    winRate,
    profitUnits: calculateProfitUnits(wins, losses),
    roi: calculateROI(wins, losses, spreadGames.length),
  };
}

function calculateProfitUnits(wins: number, losses: number): number {
  // Assuming -110 juice (bet 1.1 to win 1)
  return wins * 1.0 - losses * 1.1;
}

function calculateROI(wins: number, losses: number, total: number): number {
  if (total === 0) return 0;
  const profit = calculateProfitUnits(wins, losses);
  const totalWagered = total * 1.1; // Assuming $110 to win $100
  return (profit / totalWagered) * 100;
}

function calculateConfidenceFromSample(
  sampleSize: number,
  winRate: number
): number {
  // Confidence increases with sample size and distance from 50%
  const sampleFactor = Math.min(1, Math.log10(sampleSize + 1) / 3);
  const edgeFactor = Math.min(1, Math.abs(winRate - 50) / 10);

  return Math.min(0.95, sampleFactor * 0.7 + edgeFactor * 0.3);
}

function calculatePatternConfidence(
  pattern: Pattern,
  matchingGames: number
): number {
  // Combine pattern significance with sample size
  const significanceFactor = Math.max(0, 1 - pattern.significance * 2);
  const sampleFactor = Math.min(1, Math.log10(matchingGames + 1) / 3);

  return Math.min(0.95, significanceFactor * 0.6 + sampleFactor * 0.4);
}

function suggestWinRequirement(
  pattern: Pattern,
  stats: StrategyStats
): WinRequirement | undefined {
  // Suggest win requirement based on pattern type
  switch (pattern.type) {
    case 'halftime':
      if (pattern.id.includes('lead')) {
        return { type: 'leading_team_wins' };
      }
      break;
    case 'quarter':
      if (stats.winRate > 55) {
        return { type: 'leading_team_wins' };
      }
      break;
    case 'momentum':
      // For momentum shifts, the trailing team often covers
      return undefined; // No specific win requirement
    default:
      return undefined;
  }
  return undefined;
}

function deduplicateStrategies(
  strategies: DiscoveredStrategy[]
): DiscoveredStrategy[] {
  const seen = new Set<string>();
  const unique: DiscoveredStrategy[] = [];

  for (const strategy of strategies) {
    // Create a signature based on conditions
    const signature = strategy.conditions
      .map((c) => `${c.field}-${c.operator}-${c.value}`)
      .sort()
      .join('|');

    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(strategy);
    }
  }

  return unique;
}

// ============================================
// STRATEGY SCORING
// ============================================

/**
 * Score a set of conditions based on historical performance
 */
export async function scoreStrategy(
  conditions: Condition[]
): Promise<{
  score: number;
  estimatedWinRate: number;
  sampleSize: number;
  recommendation: string;
}> {
  const { games } = await getHistoricalGames({ limit: 1000 });

  // This would need more sophisticated matching logic
  // For now, return a basic estimate
  return {
    score: 0.5,
    estimatedWinRate: 50,
    sampleSize: games.length,
    recommendation:
      'Unable to score strategy without more specific condition matching. Consider using the discovery endpoint to find proven strategies.',
  };
}

/**
 * Analyze patterns in winning vs losing signals
 * This requires signal outcome data, which may not always be available
 */
export async function analyzeWinningPatterns(): Promise<{
  winningPatterns: Pattern[];
  losingPatterns: Pattern[];
  insights: string[];
}> {
  // This would analyze signal outcomes to find patterns
  // For now, leverage the pattern miner
  const patterns = await discoverPatterns();

  const winningPatterns = patterns.patterns.filter(
    (p) => p.stats.homeCoverRate > 55 || p.stats.overRate > 55
  );

  const losingPatterns = patterns.patterns.filter(
    (p) => p.stats.homeCoverRate < 45 || p.stats.overRate < 45
  );

  const insights: string[] = [];

  if (winningPatterns.length > 0) {
    insights.push(
      `Found ${winningPatterns.length} patterns with >55% edge`
    );
  }

  if (losingPatterns.length > 0) {
    insights.push(
      `Found ${losingPatterns.length} patterns to avoid (<45% win rate)`
    );
  }

  if (patterns.totalGamesAnalyzed < 50) {
    insights.push(
      'Limited historical data. Results may be less reliable. Need at least 50 games for meaningful analysis.'
    );
  }

  return {
    winningPatterns,
    losingPatterns,
    insights,
  };
}
