/**
 * Admin endpoint to initialize team cache from Historical Games
 *
 * This is useful when:
 * 1. Server cold starts and in-memory cache is empty
 * 2. N8N webhook doesn't include team names (only odds data)
 * 3. Need to populate Active Games with team names from historical data
 *
 * Call: GET /api/admin/init-team-cache
 */

import { NextResponse } from 'next/server';
import { initializeTeamCache, getCacheStats } from '@/lib/team-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔄 Initializing team cache from Airtable...');

    const cachedCount = await initializeTeamCache();
    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      message: `Team cache initialized with ${cachedCount} entries`,
      stats: {
        eventsCached: stats.eventCount,
        teamIdsCached: stats.teamIdCount,
      },
    });
  } catch (error) {
    console.error('Error initializing team cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize team cache' },
      { status: 500 }
    );
  }
}
