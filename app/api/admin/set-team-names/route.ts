/**
 * Admin API: Set Team Names for Active Games
 *
 * Use this endpoint to manually populate team names for games when N8N
 * doesn't provide them. This updates both Airtable and the team cache.
 *
 * POST /api/admin/set-team-names
 * {
 *   "eventId": "11344879",
 *   "homeTeam": "LA Lakers (SPARKZ)",
 *   "awayTeam": "NY Knicks (JACKAL)"
 * }
 *
 * Or bulk update:
 * POST /api/admin/set-team-names
 * {
 *   "games": [
 *     { "eventId": "11344879", "homeTeam": "...", "awayTeam": "..." },
 *     { "eventId": "11344880", "homeTeam": "...", "awayTeam": "..." }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheTeamNames } from '@/lib/team-cache';

export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface TeamUpdate {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

/**
 * Update team names in Airtable Active Games table
 */
async function updateTeamNamesInAirtable(update: TeamUpdate): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return false;
  }

  try {
    // Find the record by Event ID
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Event ID} = '${update.eventId}'`);
    params.append('maxRecords', '1');

    const findResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Active%20Games?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!findResponse.ok) {
      console.error('Error finding game:', findResponse.status);
      return false;
    }

    const findData = await findResponse.json();
    const records = findData.records || [];

    if (records.length === 0) {
      console.error(`No game found with Event ID: ${update.eventId}`);
      return false;
    }

    const recordId = records[0].id;

    // Update the record with team names
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Active%20Games/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Home Team': update.homeTeam,
            'Away Team ': update.awayTeam, // Note: trailing space
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('Error updating team names:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating team names in Airtable:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Support both single update and bulk updates
    const updates: TeamUpdate[] = data.games
      ? data.games
      : [{
          eventId: data.eventId,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
        }];

    const results: { eventId: string; success: boolean; error?: string }[] = [];

    for (const update of updates) {
      if (!update.eventId) {
        results.push({ eventId: '', success: false, error: 'Missing eventId' });
        continue;
      }

      if (!update.homeTeam && !update.awayTeam) {
        results.push({ eventId: update.eventId, success: false, error: 'Must provide at least one team name' });
        continue;
      }

      // 1. Update team cache (in-memory)
      cacheTeamNames(
        update.eventId,
        update.homeTeam || '',
        update.awayTeam || '',
        update.homeTeamId,
        update.awayTeamId
      );

      // 2. Update Airtable Active Games table
      const airtableSuccess = await updateTeamNamesInAirtable(update);

      results.push({
        eventId: update.eventId,
        success: airtableSuccess,
        error: airtableSuccess ? undefined : 'Failed to update Airtable',
      });

      console.log(`✅ Team names set for ${update.eventId}: ${update.homeTeam} vs ${update.awayTeam}`);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `Updated ${successCount} games, ${failCount} failed`,
      results,
    });
  } catch (error) {
    console.error('Error in set-team-names:', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

/**
 * GET - Show all active games that are missing team names
 */
export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ success: false, error: 'Missing Airtable credentials' }, { status: 500 });
  }

  try {
    // Fetch all active games
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Status} != 'final'`);

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Active%20Games?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch games' }, { status: 500 });
    }

    const data = await response.json();
    const records = data.records || [];

    // Find games missing team names
    const missingTeamNames = records
      .filter((r: { fields: Record<string, unknown> }) => {
        const homeTeam = r.fields['Home Team'];
        const awayTeam = r.fields['Away Team '] || r.fields['Away Team'];
        return !homeTeam || !awayTeam;
      })
      .map((r: { fields: Record<string, unknown> }) => ({
        eventId: r.fields['Event ID'],
        homeTeam: r.fields['Home Team'] || null,
        awayTeam: r.fields['Away Team '] || r.fields['Away Team'] || null,
        homeScore: r.fields['Home Score'],
        awayScore: r.fields['Away Score'],
        quarter: r.fields['Quarter'],
        status: r.fields['Status'],
      }));

    return NextResponse.json({
      success: true,
      totalGames: records.length,
      gamesMissingTeamNames: missingTeamNames.length,
      games: missingTeamNames,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ success: false, error: 'Error fetching games' }, { status: 500 });
  }
}
