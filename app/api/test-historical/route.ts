import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

/**
 * GET - Test creating a historical game record
 * This helps debug Airtable field name issues
 */
export async function GET() {
  const testData = {
    Name: `TEST-${Date.now()}`,
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
    Winner: 'home',
    Spread: -3.5,
    Total: 190.5,
    'Spread Result': 'home_cover',
    'Total Result': 'over',
    'Game Date': new Date().toISOString(),
    'Raw Data': JSON.stringify({ test: true }),
  };

  try {
    console.log('🧪 Testing Historical Games save...');
    console.log('📝 Test data:', JSON.stringify(testData, null, 2));

    const record = await base('Historical Games').create(testData);

    console.log('✅ Test record created:', record.id);

    return NextResponse.json({
      success: true,
      message: 'Test historical game created successfully!',
      recordId: record.id,
      data: testData,
    });
  } catch (error: unknown) {
    const err = error as Error & {
      statusCode?: number;
      error?: string;
      message?: string;
    };

    console.error('❌ Test failed:', err);

    // Extract detailed error info
    const errorDetails = {
      message: err.message || 'Unknown error',
      statusCode: err.statusCode,
      airtableError: err.error,
    };

    return NextResponse.json({
      success: false,
      error: 'Failed to create test record',
      details: errorDetails,
      hint: 'Check that all field names in Airtable match EXACTLY (case-sensitive)',
      expectedFields: Object.keys(testData),
    }, { status: 500 });
  }
}

/**
 * DELETE - Clean up test records
 */
export async function DELETE() {
  try {
    const records = await base('Historical Games')
      .select({
        filterByFormula: "SEARCH('TEST-', {Name})",
      })
      .all();

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test records found to delete',
      });
    }

    const recordIds = records.map(r => r.id);

    // Delete in batches of 10
    for (let i = 0; i < recordIds.length; i += 10) {
      const batch = recordIds.slice(i, i + 10);
      await base('Historical Games').destroy(batch);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${records.length} test records`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete test records',
    }, { status: 500 });
  }
}
