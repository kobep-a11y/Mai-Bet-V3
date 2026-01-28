import { NextRequest, NextResponse } from 'next/server';
import { runBacktest, compareStrategies } from '@/lib/backtest-service';
import { getActiveStrategies, getStrategy } from '@/lib/strategy-service';

/**
 * POST - Run a backtest for a specific strategy
 *
 * Body:
 * {
 *   strategyId: string,    // ID of strategy to test (or "all" for all strategies)
 *   limit?: number,        // Max games to test (default 1000)
 *   fromDate?: string,     // Filter games from this date
 *   toDate?: string,       // Filter games to this date
 *   includeDetails?: boolean  // Include individual trigger details
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      strategyId,
      limit = 1000,
      fromDate,
      toDate,
      includeDetails = false,
    } = body;

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'strategyId is required' },
        { status: 400 }
      );
    }

    // Get strategies to test
    let strategies;
    if (strategyId === 'all') {
      strategies = await getActiveStrategies();
    } else {
      const strategy = await getStrategy(strategyId);
      if (!strategy) {
        return NextResponse.json(
          { success: false, error: 'Strategy not found' },
          { status: 404 }
        );
      }
      strategies = [strategy];
    }

    if (strategies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No strategies found' },
        { status: 404 }
      );
    }

    console.log(`🧪 Running backtest for ${strategies.length} strategy(ies)...`);

    // Run backtest
    if (strategies.length === 1) {
      const result = await runBacktest(strategies[0], { limit, fromDate, toDate });

      // Remove detailed triggers if not requested
      if (!includeDetails) {
        result.triggers = result.triggers.slice(0, 10); // Only return first 10
      }

      return NextResponse.json({
        success: true,
        message: 'Backtest completed',
        result: {
          ...result,
          triggersShown: result.triggers.length,
          triggersTotal: result.triggersFound,
        },
      });
    }

    // Compare multiple strategies
    const { results, summary } = await compareStrategies(strategies, { limit, fromDate, toDate });

    // Clean up results if details not requested
    const cleanResults = results.map((r) => ({
      ...r,
      triggers: includeDetails ? r.triggers : r.triggers.slice(0, 5),
      triggersShown: includeDetails ? r.triggers.length : Math.min(5, r.triggers.length),
      triggersTotal: r.triggersFound,
    }));

    return NextResponse.json({
      success: true,
      message: `Backtest completed for ${strategies.length} strategies`,
      summary,
      results: cleanResults,
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    return NextResponse.json(
      { success: false, error: 'Error running backtest' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get backtest summary for all strategies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500');

    const strategies = await getActiveStrategies();

    if (strategies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active strategies found',
        results: [],
      });
    }

    console.log(`🧪 Running quick backtest for ${strategies.length} strategies...`);

    const { results, summary } = await compareStrategies(strategies, { limit });

    // Return summary only (no individual triggers)
    const summaryResults = results.map((r) => ({
      strategyId: r.strategyId,
      strategyName: r.strategyName,
      gamesAnalyzed: r.gamesAnalyzed,
      triggersFound: r.triggersFound,
      potentialBets: r.potentialBets,
      wins: r.wins,
      losses: r.losses,
      pushes: r.pushes,
      winRate: r.winRate,
      roi: r.roi,
    }));

    return NextResponse.json({
      success: true,
      message: `Quick backtest completed for ${strategies.length} strategies`,
      summary,
      results: summaryResults,
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    return NextResponse.json(
      { success: false, error: 'Error running backtest' },
      { status: 500 }
    );
  }
}
