/**
 * Admin endpoint to backfill team names from Historical Games to Active Games
 *
 * This endpoint:
 * 1. Gets all Active Games without team names
 * 2. Looks up team names from Historical Games (same event or similar teams)
 * 3. Updates Active Games with found team names
 *
 * Call: GET /api/admin/backfill-team-names
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { success: false, error: 'Missing Airtable credentials' },
      { status: 500 }
    );
  }

  try {
    // Step 1: Get all Active Games
    const activeResponse = await airtableRequest('Active Games', '?maxRecords=100');
    if (!activeResponse.ok) {
      const error = await activeResponse.json();
      return NextResponse.json(
        { success: false, error: 'Failed to fetch active games', details: error },
        { status: 500 }
      );
    }

    const activeData = await activeResponse.json();
    const activeGames: AirtableRecord[] = activeData.records || [];

    // Filter games without team names
    const gamesWithoutTeams = activeGames.filter((game) => {
      const homeTeam = game.fields['Home Team'];
      const awayTeam = game.fields['Away Team '] || game.fields['Away Team'];
      return !homeTeam && !awayTeam;
    });

    console.log(`Found ${gamesWithoutTeams.length} active games without team names`);

    if (gamesWithoutTeams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All active games already have team names',
        updated: 0,
        totalActive: activeGames.length,
      });
    }

    // Step 2: Get Historical Games for team name lookup
    const historyResponse = await airtableRequest(
      'Historical Games',
      '?maxRecords=500&sort[0][field]=Game Date&sort[0][direction]=desc'
    );
    if (!historyResponse.ok) {
      const error = await historyResponse.json();
      return NextResponse.json(
        { success: false, error: 'Failed to fetch historical games', details: error },
        { status: 500 }
      );
    }

    const historyData = await historyResponse.json();
    const historyGames: AirtableRecord[] = historyData.records || [];

    // Build lookup maps from historical data
    const eventIdToTeams = new Map<string, { homeTeam: string; awayTeam: string }>();
    const teamIdToName = new Map<string, string>();

    for (const game of historyGames) {
      const eventId = game.fields['Name'] as string;
      const homeTeam = game.fields['Home Team'] as string;
      const awayTeam = game.fields['Away Team'] as string;
      const homeTeamId = game.fields['Home Team ID'] as string;
      const awayTeamId = game.fields['Away Team ID'] as string;

      if (eventId && (homeTeam || awayTeam)) {
        eventIdToTeams.set(eventId, { homeTeam: homeTeam || '', awayTeam: awayTeam || '' });
      }
      if (homeTeamId && homeTeam) {
        teamIdToName.set(homeTeamId, homeTeam);
      }
      if (awayTeamId && awayTeam) {
        teamIdToName.set(awayTeamId, awayTeam);
      }
    }

    console.log(`Built lookup with ${eventIdToTeams.size} events and ${teamIdToName.size} team IDs`);

    // Step 3: Update Active Games
    let updated = 0;
    const updates: { id: string; eventId: string; homeTeam: string; awayTeam: string }[] = [];

    for (const game of gamesWithoutTeams) {
      const eventId = game.fields['Event ID'] as string;

      // Try direct event ID lookup
      let teamInfo = eventIdToTeams.get(eventId);

      if (!teamInfo || (!teamInfo.homeTeam && !teamInfo.awayTeam)) {
        // Try team ID lookup as fallback
        const homeTeamId = game.fields['Home Team ID'] as string;
        const awayTeamId = game.fields['Away Team ID'] as string;

        const homeTeam = homeTeamId ? teamIdToName.get(homeTeamId) : undefined;
        const awayTeam = awayTeamId ? teamIdToName.get(awayTeamId) : undefined;

        if (homeTeam || awayTeam) {
          teamInfo = { homeTeam: homeTeam || '', awayTeam: awayTeam || '' };
        }
      }

      if (teamInfo && (teamInfo.homeTeam || teamInfo.awayTeam)) {
        // Update the Active Game record
        const updateData: Record<string, unknown> = {};
        if (teamInfo.homeTeam) updateData['Home Team'] = teamInfo.homeTeam;
        if (teamInfo.awayTeam) updateData['Away Team '] = teamInfo.awayTeam;

        try {
          const updateResponse = await airtableRequest(`Active Games/${game.id}`, '', {
            method: 'PATCH',
            body: JSON.stringify({ fields: updateData }),
          });

          if (updateResponse.ok) {
            updated++;
            updates.push({
              id: game.id,
              eventId,
              homeTeam: teamInfo.homeTeam,
              awayTeam: teamInfo.awayTeam,
            });
            console.log(`✅ Updated ${eventId}: ${teamInfo.homeTeam} vs ${teamInfo.awayTeam}`);
          } else {
            console.error(`Failed to update ${eventId}:`, await updateResponse.json());
          }
        } catch (err) {
          console.error(`Error updating ${eventId}:`, err);
        }
      } else {
        console.log(`⚠️ No team info found for event ${eventId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} of ${gamesWithoutTeams.length} games`,
      updated,
      gamesWithoutTeams: gamesWithoutTeams.length,
      totalActive: activeGames.length,
      historicalGamesLookup: eventIdToTeams.size,
      teamIdLookup: teamIdToName.size,
      updates,
    });
  } catch (error) {
    console.error('Error backfilling team names:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
