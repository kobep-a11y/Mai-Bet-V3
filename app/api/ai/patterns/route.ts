import { NextResponse } from 'next/server';
import { discoverPatterns, getPattern, patternToTriggerConditions } from '@/lib/ai/pattern-miner';

/**
 * GET /api/ai/patterns
 * Discover patterns from historical data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patternId = searchParams.get('id');
  const convertToTrigger = searchParams.get('convert') === 'true';

  try {
    // Get specific pattern
    if (patternId) {
      const pattern = await getPattern(patternId);
      if (!pattern) {
        return NextResponse.json(
          { error: 'Pattern not found' },
          { status: 404 }
        );
      }

      if (convertToTrigger) {
        const triggerConditions = patternToTriggerConditions(pattern);
        return NextResponse.json({
          pattern,
          triggerConditions,
        });
      }

      return NextResponse.json({ pattern });
    }

    // Discover all patterns
    const result = await discoverPatterns();

    return NextResponse.json({
      success: true,
      totalGamesAnalyzed: result.totalGamesAnalyzed,
      patternsFound: result.patterns.length,
      analysisDate: result.analysisDate,
      patterns: result.patterns,
      summary: {
        byType: {
          quarter: result.patterns.filter(p => p.type === 'quarter').length,
          halftime: result.patterns.filter(p => p.type === 'halftime').length,
          momentum: result.patterns.filter(p => p.type === 'momentum').length,
          total: result.patterns.filter(p => p.type === 'total').length,
        },
        significantPatterns: result.patterns.filter(p => p.significance < 0.05).length,
        marginalPatterns: result.patterns.filter(p => p.significance >= 0.05 && p.significance < 0.10).length,
      },
      recommendations: result.patterns.length > 0 ? [
        `Found ${result.patterns.length} significant patterns`,
        `Top pattern: "${result.patterns[0]?.name}" (p=${result.patterns[0]?.significance.toFixed(3)})`,
        'Consider creating strategies based on high-confidence patterns',
      ] : [
        `Analyzed ${result.totalGamesAnalyzed} games - need more data for patterns`,
        'Minimum 20 games required for pattern detection',
        'Continue collecting historical games',
      ],
    });
  } catch (error) {
    console.error('Pattern discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to discover patterns' },
      { status: 500 }
    );
  }
}
