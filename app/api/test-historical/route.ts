import { NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Historical Games';

/**
 * GET - Test creating a historical game record using REST API directly
 * This avoids the Airtable SDK AbortSignal bug
 */
export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({
      success: false,
      error: 'Missing Airtable credentials',
      hasApiKey: !!AIRTABLE_API_KEY,
      hasBaseId: !!AIRTABLE_BASE_ID,
    }, { status: 500 });
  }

  const testData = {
    fields: {
      'Name': `TEST-${Date.now()}`,
      'Home Team': 'Test Home (TESTHOME)',
      'Away Team': 'Test Away (TESTAWAY)',
      'Home Team ID': 'test-home-id',
      'Away Team ID': 'test-away-id',
      'Home Score': 100,
      'Away Score': 95,
      'Q1 Home': 25,
      'Q1 Away': 23,
      'Q2 Home': 27,
      'Q2 Away': 25,
      'Halftime Home': 52,
      'Halftime Away': 48,
      'Q3 Home': 24,
      'Q3 Away': 26,
      'Q4 Home': 24,
      'Q4 Away': 21,
      'Total Points': 195,
      'Point Differential': 5,
      'Winner': 'home',
      'Spread': -3.5,
      'Total': 190.5,
      'Spread Result': 'home_cover',
      'Total Result': 'over',
      'Game Date': new Date().toISOString().split('T')[0],
      'Raw Data': JSON.stringify({ test: true }),
    }
  };

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

  try {
    console.log('🧪 Testing Historical Games save via REST API...');
    console.log('📝 URL:', url);
    console.log('📝 Fields:', Object.keys(testData.fields));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Airtable error:', result);
      return NextResponse.json({
        success: false,
        error: 'Airtable API error',
        status: response.status,
        details: result,
        hint: 'Check field names match exactly in Airtable',
        sentFields: Object.keys(testData.fields),
      }, { status: response.status });
    }

    console.log('✅ Test record created:', result.id);

    return NextResponse.json({
      success: true,
      message: 'Test historical game created successfully!',
      recordId: result.id,
      record: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Fetch error:', err);

    return NextResponse.json({
      success: false,
      error: 'Network error',
      message: err.message,
    }, { status: 500 });
  }
}

/**
 * DELETE - Clean up test records
 */
export async function DELETE() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({
      success: false,
      error: 'Missing Airtable credentials',
    }, { status: 500 });
  }

  const listUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=SEARCH('TEST-',{Name})`;

  try {
    // First, list test records
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    const listResult = await listResponse.json();

    if (!listResult.records || listResult.records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test records found to delete',
      });
    }

    // Delete each record
    const recordIds = listResult.records.map((r: { id: string }) => r.id);

    for (const id of recordIds) {
      const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${recordIds.length} test records`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete test records',
    }, { status: 500 });
  }
}
