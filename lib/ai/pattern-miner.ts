/**
 * Pattern Mining Engine
 * Discovers statistically significant patterns from historical game data
 */

import { HistoricalGame } from '@/types';
import { getHistoricalGames } from '@/lib/historical-service';

export interface Pattern {
  id: string;
  name: string;
  description: string;
  type: 'quarter' | 'halftime' | 'spread' | 'total' | 'momentum' | 'player';
  conditions: PatternCondition[];
  stats: PatternStats;
  significance: number; // p-value (lower is better)
  discoveredAt: string;
}

export interface PatternCondition {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | 'between';
  value: number | [number, number];
}

export interface PatternStats {
  totalGames: number;
  matchingGames: number;
  homeWins: number;
  awayWins: number;
  homeCoverRate: number;
  awayCoverRate: number;
  overRate: number;
  underRate: number;
  avgHomeScore: number;
  avgAwayScore: number;
  avgTotal: number;
  avgMargin: number;
}

export interface DiscoveredPatterns {
  patterns: Pattern[];
  totalGamesAnalyzed: number;
  analysisDate: string;
}

/**
 * Calculate basic statistics for a set of games
 */
function calculateStats(games: HistoricalGame[]): PatternStats {
  if (games.length === 0) {
    return {
      totalGames: 0,
      matchingGames: 0,
      homeWins: 0,
      awayWins: 0,
      homeCoverRate: 0,
      awayCoverRate: 0,
      overRate: 0,
      underRate: 0,
      avgHomeScore: 0,
      avgAwayScore: 0,
      avgTotal: 0,
      avgMargin: 0,
    };
  }

  const homeWins = games.filter(g => g.winner === 'home').length;
  const awayWins = games.filter(g => g.winner === 'away').length;
  const homeCovers = games.filter(g => g.spreadResult === 'home_cover').length;
  const awayCovers = games.filter(g => g.spreadResult === 'away_cover').length;
  const overs = games.filter(g => g.totalResult === 'over').length;
  const unders = games.filter(g => g.totalResult === 'under').length;

  const spreadGames = games.filter(g => g.spreadResult && g.spreadResult !== 'push').length;
  const totalGames = games.filter(g => g.totalResult && g.totalResult !== 'push').length;

  const totalHomeScore = games.reduce((sum, g) => sum + g.finalHomeScore, 0);
  const totalAwayScore = games.reduce((sum, g) => sum + g.finalAwayScore, 0);
  const totalPoints = games.reduce((sum, g) => sum + g.totalPoints, 0);
  const totalMargin = games.reduce((sum, g) => sum + Math.abs(g.pointDifferential), 0);

  return {
    totalGames: games.length,
    matchingGames: games.length,
    homeWins,
    awayWins,
    homeCoverRate: spreadGames > 0 ? (homeCovers / spreadGames) * 100 : 50,
    awayCoverRate: spreadGames > 0 ? (awayCovers / spreadGames) * 100 : 50,
    overRate: totalGames > 0 ? (overs / totalGames) * 100 : 50,
    underRate: totalGames > 0 ? (unders / totalGames) * 100 : 50,
    avgHomeScore: totalHomeScore / games.length,
    avgAwayScore: totalAwayScore / games.length,
    avgTotal: totalPoints / games.length,
    avgMargin: totalMargin / games.length,
  };
}

/**
 * Calculate statistical significance (simplified chi-square approximation)
 */
function calculateSignificance(observed: number, expected: number, n: number): number {
  if (n < 10) return 1; // Not enough data
  const chiSquare = Math.pow(observed - expected, 2) / expected;
  // Approximate p-value (simplified)
  if (chiSquare > 10.83) return 0.001;
  if (chiSquare > 6.63) return 0.01;
  if (chiSquare > 3.84) return 0.05;
  if (chiSquare > 2.71) return 0.10;
  return 0.5;
}

/**
 * Mine patterns related to Q1 scoring
 */
function mineQ1Patterns(games: HistoricalGame[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Pattern: High Q1 total (>25 combined)
  const highQ1Games = games.filter(g => (g.q1Home + g.q1Away) > 25);
  if (highQ1Games.length >= 10) {
    const stats = calculateStats(highQ1Games);
    const baselineOver = 50;
    const significance = calculateSignificance(stats.overRate, baselineOver, highQ1Games.length);

    patterns.push({
      id: 'q1-high-total',
      name: 'High Q1 Total',
      description: 'Games with Q1 combined score > 25 points',
      type: 'quarter',
      conditions: [{ field: 'q1Total', operator: '>', value: 25 }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: Low Q1 total (<20 combined)
  const lowQ1Games = games.filter(g => (g.q1Home + g.q1Away) < 20);
  if (lowQ1Games.length >= 10) {
    const stats = calculateStats(lowQ1Games);
    const baselineUnder = 50;
    const significance = calculateSignificance(stats.underRate, baselineUnder, lowQ1Games.length);

    patterns.push({
      id: 'q1-low-total',
      name: 'Low Q1 Total',
      description: 'Games with Q1 combined score < 20 points',
      type: 'quarter',
      conditions: [{ field: 'q1Total', operator: '<', value: 20 }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: Q1 home lead (home winning Q1)
  const q1HomeLeadGames = games.filter(g => g.q1Home > g.q1Away);
  if (q1HomeLeadGames.length >= 10) {
    const stats = calculateStats(q1HomeLeadGames);
    const baselineHomeCover = 50;
    const significance = calculateSignificance(stats.homeCoverRate, baselineHomeCover, q1HomeLeadGames.length);

    patterns.push({
      id: 'q1-home-lead',
      name: 'Q1 Home Lead',
      description: 'Games where home team leads after Q1',
      type: 'quarter',
      conditions: [{ field: 'q1Differential', operator: '>', value: 0 }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  return patterns;
}

/**
 * Mine patterns related to halftime scores
 */
function mineHalftimePatterns(games: HistoricalGame[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Pattern: Large halftime lead (>10 points)
  const largeLeadGames = games.filter(g => Math.abs(g.halftimeHome - g.halftimeAway) > 10);
  if (largeLeadGames.length >= 10) {
    const stats = calculateStats(largeLeadGames);

    // Check if leading team usually wins
    const leaderWins = largeLeadGames.filter(g => {
      const htLeader = g.halftimeHome > g.halftimeAway ? 'home' : 'away';
      return g.winner === htLeader;
    }).length;

    const leaderWinRate = (leaderWins / largeLeadGames.length) * 100;
    const significance = calculateSignificance(leaderWinRate, 50, largeLeadGames.length);

    patterns.push({
      id: 'halftime-large-lead',
      name: 'Large Halftime Lead',
      description: 'Games with >10 point halftime lead',
      type: 'halftime',
      conditions: [{ field: 'halftimeDifferential', operator: '>', value: 10 }],
      stats: { ...stats, homeCoverRate: leaderWinRate },
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: Close at halftime (<5 points)
  const closeGames = games.filter(g => Math.abs(g.halftimeHome - g.halftimeAway) < 5);
  if (closeGames.length >= 10) {
    const stats = calculateStats(closeGames);
    const significance = calculateSignificance(stats.homeCoverRate, 50, closeGames.length);

    patterns.push({
      id: 'halftime-close',
      name: 'Close at Halftime',
      description: 'Games within 5 points at halftime',
      type: 'halftime',
      conditions: [{ field: 'halftimeDifferential', operator: 'between', value: [-5, 5] }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: High scoring first half (>55 combined)
  const highScoringHalf = games.filter(g => (g.halftimeHome + g.halftimeAway) > 55);
  if (highScoringHalf.length >= 10) {
    const stats = calculateStats(highScoringHalf);
    const significance = calculateSignificance(stats.overRate, 50, highScoringHalf.length);

    patterns.push({
      id: 'halftime-high-scoring',
      name: 'High Scoring First Half',
      description: 'Games with >55 combined points at halftime',
      type: 'halftime',
      conditions: [{ field: 'halftimeTotal', operator: '>', value: 55 }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  return patterns;
}

/**
 * Mine patterns related to second half/Q3 scoring
 */
function mineSecondHalfPatterns(games: HistoricalGame[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Pattern: Q3 explosion (high Q3 scoring)
  const highQ3Games = games.filter(g => (g.q3Home + g.q3Away) > 30);
  if (highQ3Games.length >= 10) {
    const stats = calculateStats(highQ3Games);
    const significance = calculateSignificance(stats.overRate, 50, highQ3Games.length);

    patterns.push({
      id: 'q3-high-scoring',
      name: 'Q3 Scoring Explosion',
      description: 'Games with >30 combined Q3 points',
      type: 'quarter',
      conditions: [{ field: 'q3Total', operator: '>', value: 30 }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: Q3 momentum shift (trailing team wins Q3)
  const momentumShifts = games.filter(g => {
    const htLeader = g.halftimeHome > g.halftimeAway ? 'home' : 'away';
    const q3Winner = g.q3Home > g.q3Away ? 'home' : 'away';
    return htLeader !== q3Winner;
  });

  if (momentumShifts.length >= 10) {
    const stats = calculateStats(momentumShifts);
    // Check if momentum shift leads to trailing team covering
    const trailingCovers = momentumShifts.filter(g => {
      const htTrailer = g.halftimeHome < g.halftimeAway ? 'home' : 'away';
      const covered = htTrailer === 'home' ? g.spreadResult === 'home_cover' : g.spreadResult === 'away_cover';
      return covered;
    }).length;

    const trailingCoverRate = (trailingCovers / momentumShifts.length) * 100;
    const significance = calculateSignificance(trailingCoverRate, 50, momentumShifts.length);

    patterns.push({
      id: 'q3-momentum-shift',
      name: 'Q3 Momentum Shift',
      description: 'Halftime trailer wins Q3',
      type: 'momentum',
      conditions: [{ field: 'momentumShift', operator: '==', value: 1 }],
      stats: { ...stats, homeCoverRate: trailingCoverRate },
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  return patterns;
}

/**
 * Mine patterns related to total points
 */
function mineTotalPatterns(games: HistoricalGame[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Calculate average total
  const avgTotal = games.reduce((sum, g) => sum + g.totalPoints, 0) / games.length;

  // Pattern: Consistent high scorers (total > avg + 10)
  const highTotalGames = games.filter(g => g.totalPoints > avgTotal + 10);
  if (highTotalGames.length >= 10) {
    const stats = calculateStats(highTotalGames);
    const significance = calculateSignificance(stats.overRate, 50, highTotalGames.length);

    patterns.push({
      id: 'high-total-games',
      name: 'High Total Games',
      description: `Games with total > ${Math.round(avgTotal + 10)} points`,
      type: 'total',
      conditions: [{ field: 'totalPoints', operator: '>', value: Math.round(avgTotal + 10) }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  // Pattern: Low total games
  const lowTotalGames = games.filter(g => g.totalPoints < avgTotal - 10);
  if (lowTotalGames.length >= 10) {
    const stats = calculateStats(lowTotalGames);
    const significance = calculateSignificance(stats.underRate, 50, lowTotalGames.length);

    patterns.push({
      id: 'low-total-games',
      name: 'Low Total Games',
      description: `Games with total < ${Math.round(avgTotal - 10)} points`,
      type: 'total',
      conditions: [{ field: 'totalPoints', operator: '<', value: Math.round(avgTotal - 10) }],
      stats,
      significance,
      discoveredAt: new Date().toISOString(),
    });
  }

  return patterns;
}

/**
 * Main pattern discovery function
 */
export async function discoverPatterns(): Promise<DiscoveredPatterns> {
  // Fetch all historical games
  const { games } = await getHistoricalGames({ limit: 1000 });

  if (games.length < 20) {
    return {
      patterns: [],
      totalGamesAnalyzed: games.length,
      analysisDate: new Date().toISOString(),
    };
  }

  // Run all pattern miners
  const allPatterns: Pattern[] = [
    ...mineQ1Patterns(games),
    ...mineHalftimePatterns(games),
    ...mineSecondHalfPatterns(games),
    ...mineTotalPatterns(games),
  ];

  // Sort by significance (most significant first)
  allPatterns.sort((a, b) => a.significance - b.significance);

  // Filter to patterns with p < 0.10 (marginally significant or better)
  const significantPatterns = allPatterns.filter(p => p.significance < 0.10);

  return {
    patterns: significantPatterns,
    totalGamesAnalyzed: games.length,
    analysisDate: new Date().toISOString(),
  };
}

/**
 * Get pattern by ID
 */
export async function getPattern(patternId: string): Promise<Pattern | null> {
  const { patterns } = await discoverPatterns();
  return patterns.find(p => p.id === patternId) || null;
}

/**
 * Convert a pattern to strategy trigger conditions
 */
export function patternToTriggerConditions(pattern: Pattern): object[] {
  return pattern.conditions.map(c => ({
    id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    field: c.field,
    operator: c.operator === 'between' ? '>=' : c.operator,
    value: Array.isArray(c.value) ? c.value[0] : c.value,
    conjunction: 'and',
  }));
}
