import { NextRequest, NextResponse } from 'next/server';
import {
  runFullCleanup,
  cleanupStaleSignals,
  cleanupOldActiveGames,
  cleanupDuplicates,
  cleanupExpiredSignals,
  archiveOldHistoricalGames,
} from '@/lib/cleanup-service';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

/**
 * GET - Run scheduled cleanup with default settings
 *
 * This endpoint is designed to be called by a cron job scheduler (e.g., Vercel Cron)
 * Default retention periods:
 * - Stale signals: 24 hours
 * - Active games: 2 hours
 * - No archival of historical games (opt-in only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧹 Starting scheduled cleanup...');

    const summary = await runFullCleanup({
      signalMaxAgeHours: 24,
      gameMaxAgeHours: 2,
      cleanupDuplicates: true,
      archiveHistorical: false, // Don't delete historical data on scheduled runs
    });

    return NextResponse.json({
      success: summary.success,
      message: `Cleanup completed: ${summary.totalDeleted} items processed`,
      timestamp: summary.timestamp,
      summary: {
        totalProcessed: summary.totalDeleted,
        resultsByTable: summary.results.map(r => ({
          table: r.table,
          processed: r.deleted,
          items: r.items.length > 10 ? [...r.items.slice(0, 10), `... and ${r.items.length - 10} more`] : r.items,
          hasErrors: r.errors.length > 0,
        })),
      },
      errors: summary.errors.length > 0 ? summary.errors : undefined,
    });
  } catch (error) {
    console.error('Error in cleanup cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Run cleanup with custom options
 *
 * Accepts a JSON body with configurable options:
 * - signalMaxAgeHours: How old signals should be before cleanup (default: 24)
 * - gameMaxAgeHours: How old active games should be before cleanup (default: 2)
 * - historicalMaxAgeDays: How old historical games should be before archival (default: 90)
 * - cleanupDuplicates: Whether to clean up duplicate records (default: true)
 * - archiveHistorical: Whether to archive old historical games (default: false)
 * - operation: Specific operation to run (optional)
 *   - 'full': Run full cleanup (default)
 *   - 'signals': Only clean up signals
 *   - 'games': Only clean up active games
 *   - 'duplicates': Only clean up duplicates
 *   - 'expire': Only expire stale signals
 *   - 'archive': Only archive old historical games
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      signalMaxAgeHours = 24,
      gameMaxAgeHours = 2,
      historicalMaxAgeDays = 90,
      cleanupDuplicates: shouldCleanupDuplicates = true,
      archiveHistorical = false,
      operation = 'full',
    } = body;

    console.log(`🧹 Starting cleanup operation: ${operation}`);

    let result;

    switch (operation) {
      case 'signals':
        result = await cleanupStaleSignals(signalMaxAgeHours);
        return NextResponse.json({
          success: result.errors.length === 0,
          message: `Cleaned up ${result.deleted} stale signals`,
          operation,
          result,
          timestamp: new Date().toISOString(),
        });

      case 'games':
        result = await cleanupOldActiveGames(gameMaxAgeHours);
        return NextResponse.json({
          success: result.errors.length === 0,
          message: `Cleaned up ${result.deleted} old active games`,
          operation,
          result,
          timestamp: new Date().toISOString(),
        });

      case 'duplicates':
        const dupResults = [];
        dupResults.push(await cleanupDuplicates('Signals', 'Name'));
        dupResults.push(await cleanupDuplicates('Active Games', 'Event ID'));
        dupResults.push(await cleanupDuplicates('Historical Games', 'Name'));
        const totalDups = dupResults.reduce((sum, r) => sum + r.deleted, 0);
        return NextResponse.json({
          success: dupResults.every(r => r.errors.length === 0),
          message: `Cleaned up ${totalDups} duplicate records`,
          operation,
          results: dupResults,
          timestamp: new Date().toISOString(),
        });

      case 'expire':
        result = await cleanupExpiredSignals();
        return NextResponse.json({
          success: result.errors.length === 0,
          message: `Expired ${result.deleted} stale signals`,
          operation,
          result,
          timestamp: new Date().toISOString(),
        });

      case 'archive':
        result = await archiveOldHistoricalGames(historicalMaxAgeDays);
        return NextResponse.json({
          success: result.errors.length === 0,
          message: `Archived ${result.deleted} old historical games (>${historicalMaxAgeDays} days)`,
          operation,
          result,
          timestamp: new Date().toISOString(),
        });

      case 'full':
      default:
        const summary = await runFullCleanup({
          signalMaxAgeHours,
          gameMaxAgeHours,
          historicalMaxAgeDays,
          cleanupDuplicates: shouldCleanupDuplicates,
          archiveHistorical,
        });

        return NextResponse.json({
          success: summary.success,
          message: `Full cleanup completed: ${summary.totalDeleted} items processed`,
          operation: 'full',
          timestamp: summary.timestamp,
          options: {
            signalMaxAgeHours,
            gameMaxAgeHours,
            historicalMaxAgeDays,
            cleanupDuplicates: shouldCleanupDuplicates,
            archiveHistorical,
          },
          summary: {
            totalProcessed: summary.totalDeleted,
            resultsByTable: summary.results.map(r => ({
              table: r.table,
              processed: r.deleted,
              itemCount: r.items.length,
              items: r.items.length > 20 ? [...r.items.slice(0, 20), `... and ${r.items.length - 20} more`] : r.items,
            })),
          },
          errors: summary.errors.length > 0 ? summary.errors : undefined,
        });
    }
  } catch (error) {
    console.error('Error in cleanup POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
