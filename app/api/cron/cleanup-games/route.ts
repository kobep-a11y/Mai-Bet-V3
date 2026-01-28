import { NextRequest, NextResponse } from 'next/server';
import { deleteGame, cleanupOldGames } from '@/lib/game-service';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

/**
 * GET - Cleanup old games from Active Games table
 *
 * This endpoint:
 * 1. Deletes all games with status 'final'
 * 2. Deletes games not updated in the last 30 minutes
 * 3. Returns cleanup statistics
 */
export async function GET(request: NextRequest) {
  try {
    const deletedGames: string[] = [];
    const errors: string[] = [];

    // 1. Find and delete all 'final' games
    const finalParams = new URLSearchParams();
    finalParams.append('filterByFormula', `{Status} = 'final'`);

    const finalResponse = await airtableRequest('Active Games', `?${finalParams.toString()}`);
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const finalRecords: AirtableRecord[] = finalData.records || [];

      for (const record of finalRecords) {
        const eventId = record.fields['Event ID'] as string;
        try {
          const deleteResponse = await airtableRequest('Active Games', `/${record.id}`, {
            method: 'DELETE',
          });
          if (deleteResponse.ok) {
            deletedGames.push(`${eventId} (final)`);
          }
        } catch (err) {
          errors.push(`Failed to delete ${eventId}: ${err}`);
        }
      }
    }

    // 2. Find and delete stale games (not updated in 30+ minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const staleParams = new URLSearchParams();
    staleParams.append('filterByFormula', `IS_BEFORE({Last Update}, '${thirtyMinutesAgo}')`);

    const staleResponse = await airtableRequest('Active Games', `?${staleParams.toString()}`);
    if (staleResponse.ok) {
      const staleData = await staleResponse.json();
      const staleRecords: AirtableRecord[] = staleData.records || [];

      for (const record of staleRecords) {
        const eventId = record.fields['Event ID'] as string;
        const lastUpdate = record.fields['Last Update'] as string;
        try {
          const deleteResponse = await airtableRequest('Active Games', `/${record.id}`, {
            method: 'DELETE',
          });
          if (deleteResponse.ok) {
            deletedGames.push(`${eventId} (stale: ${lastUpdate})`);
          }
        } catch (err) {
          errors.push(`Failed to delete ${eventId}: ${err}`);
        }
      }
    }

    // 3. Call cleanupOldGames for good measure
    const libCleanupCount = await cleanupOldGames();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed`,
      stats: {
        deletedCount: deletedGames.length,
        deletedGames,
        libCleanupCount,
        errorsCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cleanup cron:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Force cleanup with options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxAgeMinutes = 30, deleteFinal = true } = body;

    const deletedGames: string[] = [];

    // Get all games
    const response = await airtableRequest('Active Games', '');
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch games' }, { status: 500 });
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const record of records) {
      const eventId = record.fields['Event ID'] as string;
      const status = record.fields['Status'] as string;
      const lastUpdate = record.fields['Last Update'] as string;
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const age = now - lastUpdateTime;

      const shouldDelete =
        (deleteFinal && status === 'final') ||
        (age > maxAgeMs);

      if (shouldDelete) {
        try {
          const deleteResponse = await airtableRequest('Active Games', `/${record.id}`, {
            method: 'DELETE',
          });
          if (deleteResponse.ok) {
            deletedGames.push(`${eventId} (${status}, age: ${Math.round(age / 60000)}min)`);
          }
        } catch (err) {
          console.error(`Failed to delete ${eventId}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Force cleanup completed`,
      deletedCount: deletedGames.length,
      deletedGames,
      totalGamesChecked: records.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in force cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Force cleanup failed' },
      { status: 500 }
    );
  }
}
