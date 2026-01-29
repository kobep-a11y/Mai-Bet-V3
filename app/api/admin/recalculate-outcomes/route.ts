import { NextRequest, NextResponse } from 'next/server';
import {
  recalculateByIds,
  recalculateByDateRange,
  recalculateByStrategy,
  recalculateAll,
} from '@/lib/recalculate-service';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

/**
 * GET - Get information about the recalculate endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Recalculate Outcomes API',
    description: 'Use POST to recalculate signal outcomes when win requirement logic changes',
    usage: {
      byIds: {
        description: 'Recalculate specific signals by ID',
        body: { signalIds: ['rec123', 'rec456'] },
      },
      byDateRange: {
        description: 'Recalculate signals within a date range',
        body: { startDate: '2026-01-01', endDate: '2026-01-31' },
      },
      byStrategy: {
        description: 'Recalculate all signals for a specific strategy',
        body: { strategyId: 'recXXXXXXXXXXXXXX' },
      },
      all: {
        description: 'Recalculate all eligible signals (use with caution)',
        body: { recalculateAll: true },
      },
    },
    eligibleStatuses: ['bet_taken', 'won', 'lost', 'pushed'],
    note: 'Only signals with eligible statuses will be recalculated. Monitoring/watching/expired signals are skipped.',
  });
}

/**
 * POST - Recalculate signal outcomes
 *
 * Accepts different operation modes:
 * - signalIds: Array of specific signal IDs to recalculate
 * - startDate + endDate: Recalculate signals in a date range
 * - strategyId: Recalculate all signals for a strategy
 * - recalculateAll: true to recalculate all eligible signals
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signalIds, startDate, endDate, strategyId, recalculateAll: shouldRecalculateAll } = body;

    // Validate input - must have exactly one operation type
    const operations = [
      signalIds && signalIds.length > 0,
      startDate && endDate,
      strategyId,
      shouldRecalculateAll,
    ].filter(Boolean).length;

    if (operations === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing operation parameters',
          hint: 'Provide one of: signalIds, startDate+endDate, strategyId, or recalculateAll',
        },
        { status: 400 }
      );
    }

    if (operations > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Multiple operations specified',
          hint: 'Provide only one of: signalIds, startDate+endDate, strategyId, or recalculateAll',
        },
        { status: 400 }
      );
    }

    let summary;

    // Execute the appropriate operation
    if (signalIds && signalIds.length > 0) {
      console.log(`📊 Recalculating ${signalIds.length} signals by ID...`);
      summary = await recalculateByIds(signalIds);

      return NextResponse.json({
        success: summary.success,
        message: `Recalculated ${summary.totalProcessed} signals by ID`,
        operation: 'byIds',
        summary: {
          totalProcessed: summary.totalProcessed,
          changed: summary.changed,
          unchanged: summary.unchanged,
          errors: summary.errors,
        },
        results: summary.results,
        timestamp: summary.timestamp,
      });
    }

    if (startDate && endDate) {
      // Validate date format
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format',
            hint: 'Use ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss',
          },
          { status: 400 }
        );
      }

      if (start > end) {
        return NextResponse.json(
          {
            success: false,
            error: 'startDate must be before endDate',
          },
          { status: 400 }
        );
      }

      console.log(`📊 Recalculating signals from ${startDate} to ${endDate}...`);
      summary = await recalculateByDateRange(startDate, endDate);

      return NextResponse.json({
        success: summary.success,
        message: `Recalculated ${summary.totalProcessed} signals in date range`,
        operation: 'byDateRange',
        dateRange: { startDate, endDate },
        summary: {
          totalProcessed: summary.totalProcessed,
          changed: summary.changed,
          unchanged: summary.unchanged,
          errors: summary.errors,
        },
        results: summary.results.length > 50
          ? {
              preview: summary.results.slice(0, 50),
              note: `Showing first 50 of ${summary.results.length} results`,
            }
          : summary.results,
        timestamp: summary.timestamp,
      });
    }

    if (strategyId) {
      console.log(`📊 Recalculating signals for strategy ${strategyId}...`);
      summary = await recalculateByStrategy(strategyId);

      return NextResponse.json({
        success: summary.success,
        message: `Recalculated ${summary.totalProcessed} signals for strategy`,
        operation: 'byStrategy',
        strategyId,
        summary: {
          totalProcessed: summary.totalProcessed,
          changed: summary.changed,
          unchanged: summary.unchanged,
          errors: summary.errors,
        },
        results: summary.results.length > 50
          ? {
              preview: summary.results.slice(0, 50),
              note: `Showing first 50 of ${summary.results.length} results`,
            }
          : summary.results,
        timestamp: summary.timestamp,
      });
    }

    if (shouldRecalculateAll) {
      // Safety check - require confirmation
      if (body.confirm !== true) {
        return NextResponse.json(
          {
            success: false,
            error: 'Confirmation required for full recalculation',
            hint: 'Add "confirm": true to the request body to proceed',
            warning: 'This will recalculate ALL eligible signals. Use with caution.',
          },
          { status: 400 }
        );
      }

      console.log('📊 Recalculating ALL signals...');
      summary = await recalculateAll();

      return NextResponse.json({
        success: summary.success,
        message: `Recalculated all ${summary.totalProcessed} eligible signals`,
        operation: 'all',
        summary: {
          totalProcessed: summary.totalProcessed,
          changed: summary.changed,
          unchanged: summary.unchanged,
          errors: summary.errors,
        },
        results: summary.results.length > 100
          ? {
              preview: summary.results.slice(0, 100),
              note: `Showing first 100 of ${summary.results.length} results`,
            }
          : summary.results,
        timestamp: summary.timestamp,
      });
    }

    // Should never reach here
    return NextResponse.json(
      { success: false, error: 'Unknown operation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in recalculate-outcomes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Recalculation failed',
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
