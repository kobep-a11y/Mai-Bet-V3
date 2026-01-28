import { NextResponse } from 'next/server';

/**
 * Test endpoint for Players table
 * Creates a test player record, updates stats, then cleans up
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Players';

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({
      success: false,
      error: 'Missing Airtable credentials',
    }, { status: 500 });
  }

  const testPlayerName = `TEST_PLAYER_${Date.now()}`;
  let testRecordId: string | null = null;

  const results: Array<{ step: string; status: 'pass' | 'fail'; details?: unknown }> = [];

  try {
    // Step 1: Create test player
    const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Name: testPlayerName,
          'Team Name': 'Test Team',
          'Full Team Name': `Test Team (${testPlayerName})`,
          'Games Played': 0,
          Wins: 0,
          Losses: 0,
          'Win Rate': 0,
          'Total Points For': 0,
          'Total Points Against': 0,
          'Avg Points For': 0,
          'Avg Points Against': 0,
          'Avg Margin': 0,
          'Spread Wins': 0,
          'Spread Losses': 0,
          'Spread Pushes': 0,
          'Total Overs': 0,
          'Total Unders': 0,
          'Total Pushes': 0,
          'ATS Win Rate': 0,
          'Over Rate': 0,
          'Recent Form': '[]',
          'Is Active': true,
        },
      }),
    });

    const createResult = await createResponse.json();

    if (createResponse.ok && createResult.id) {
      testRecordId = createResult.id;
      results.push({
        step: 'Create player',
        status: 'pass',
        details: { recordId: createResult.id },
      });
    } else {
      results.push({
        step: 'Create player',
        status: 'fail',
        details: createResult,
      });
      return NextResponse.json({
        success: false,
        message: 'Failed to create test player - check table schema',
        results,
        schemaHelp: {
          message: 'The Players table must have specific fields. See below for required schema.',
          requiredFields: [
            'Name (single line text)',
            'Team Name (single line text)',
            'Full Team Name (single line text)',
            'Games Played (number)',
            'Wins (number)',
            'Losses (number)',
            'Win Rate (number)',
            'Total Points For (number)',
            'Total Points Against (number)',
            'Avg Points For (number)',
            'Avg Points Against (number)',
            'Avg Margin (number)',
            'Spread Wins (number)',
            'Spread Losses (number)',
            'Spread Pushes (number)',
            'Total Overs (number)',
            'Total Unders (number)',
            'Total Pushes (number)',
            'ATS Win Rate (number)',
            'Over Rate (number)',
            'Recent Form (long text)',
            'Streak Type (single select: W, L)',
            'Streak Count (number)',
            'Last Game Date (date)',
            'Is Active (checkbox)',
          ],
        },
      });
    }

    // Step 2: Update player stats
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${testRecordId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Games Played': 1,
          Wins: 1,
          Losses: 0,
          'Win Rate': 100,
          'Total Points For': 105,
          'Total Points Against': 98,
          'Recent Form': '["W"]',
          'Streak Type': 'W',
          'Streak Count': 1,
        },
      }),
    });

    const updateResult = await updateResponse.json();

    if (updateResponse.ok) {
      results.push({
        step: 'Update player stats',
        status: 'pass',
        details: { updatedFields: Object.keys(updateResult.fields || {}) },
      });
    } else {
      results.push({
        step: 'Update player stats',
        status: 'fail',
        details: updateResult,
      });
    }

    // Step 3: Read player back
    const readUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${testRecordId}`;
    const readResponse = await fetch(readUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    const readResult = await readResponse.json();

    if (readResponse.ok && readResult.fields?.['Games Played'] === 1) {
      results.push({
        step: 'Read player back',
        status: 'pass',
        details: { gamesPlayed: readResult.fields['Games Played'], wins: readResult.fields.Wins },
      });
    } else {
      results.push({
        step: 'Read player back',
        status: 'fail',
        details: readResult,
      });
    }

    // Step 4: Clean up - delete test record
    const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${testRecordId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (deleteResponse.ok) {
      results.push({
        step: 'Cleanup test record',
        status: 'pass',
      });
    } else {
      results.push({
        step: 'Cleanup test record',
        status: 'fail',
        details: await deleteResponse.json(),
      });
    }

    const allPassed = results.every(r => r.status === 'pass');

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? '✅ Players table is properly configured!' : '⚠️ Some tests failed',
      results,
    });

  } catch (error) {
    // Attempt cleanup if record was created
    if (testRecordId) {
      try {
        const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${testRecordId}`;
        await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}
