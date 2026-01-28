import { NextResponse } from 'next/server';

/**
 * Comprehensive system debug endpoint
 * Checks all phases and reports status
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface CheckResult {
  name: string;
  phase: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

async function checkAirtableTable(tableName: string): Promise<CheckResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        name: `Airtable: ${tableName}`,
        phase: 'Phase 1',
        status: 'pass',
        message: `Table accessible (${data.records?.length || 0} sample records)`,
      };
    } else {
      const error = await response.json();
      return {
        name: `Airtable: ${tableName}`,
        phase: 'Phase 1',
        status: 'fail',
        message: error.error?.message || 'Table not found',
        details: error,
      };
    }
  } catch (error) {
    return {
      name: `Airtable: ${tableName}`,
      phase: 'Phase 1',
      status: 'fail',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkHistoricalGamesQ4(): Promise<CheckResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Historical Games')}?maxRecords=5`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      return {
        name: 'Historical Games Q4 Data',
        phase: 'Phase 3',
        status: 'fail',
        message: 'Could not access Historical Games table',
      };
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return {
        name: 'Historical Games Q4 Data',
        phase: 'Phase 3',
        status: 'warning',
        message: 'No historical games to verify Q4 data',
      };
    }

    // Check if any records have Q4 data
    const withQ4 = records.filter((r: { fields: { 'Q4 Home'?: number; 'Q4 Away'?: number } }) =>
      (r.fields['Q4 Home'] || 0) > 0 || (r.fields['Q4 Away'] || 0) > 0
    );

    if (withQ4.length === 0) {
      return {
        name: 'Historical Games Q4 Data',
        phase: 'Phase 3',
        status: 'warning',
        message: `${records.length} records found, but none have Q4 scores yet (fix deployed, needs new games)`,
        details: {
          totalRecords: records.length,
          recordsWithQ4: withQ4.length,
          note: 'Q4 calculation fix was just deployed - new games will have Q4 data',
        },
      };
    }

    return {
      name: 'Historical Games Q4 Data',
      phase: 'Phase 3',
      status: 'pass',
      message: `${withQ4.length}/${records.length} records have Q4 data`,
    };
  } catch (error) {
    return {
      name: 'Historical Games Q4 Data',
      phase: 'Phase 3',
      status: 'fail',
      message: `Error checking Q4: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkBankroll(): Promise<CheckResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Bankroll')}?maxRecords=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (response.ok) {
      return {
        name: 'Bankroll Table',
        phase: 'Phase 4A',
        status: 'pass',
        message: 'Bankroll table accessible',
      };
    } else {
      return {
        name: 'Bankroll Table',
        phase: 'Phase 4A',
        status: 'fail',
        message: 'Bankroll table not found',
      };
    }
  } catch (error) {
    return {
      name: 'Bankroll Table',
      phase: 'Phase 4A',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

export async function GET() {
  const startTime = Date.now();
  const results: CheckResult[] = [];

  // Phase 1: Core Infrastructure
  results.push({
    name: 'Environment: AIRTABLE_API_KEY',
    phase: 'Phase 1',
    status: AIRTABLE_API_KEY ? 'pass' : 'fail',
    message: AIRTABLE_API_KEY ? 'Configured' : 'Missing',
  });

  results.push({
    name: 'Environment: AIRTABLE_BASE_ID',
    phase: 'Phase 1',
    status: AIRTABLE_BASE_ID ? 'pass' : 'fail',
    message: AIRTABLE_BASE_ID ? 'Configured' : 'Missing',
  });

  results.push({
    name: 'Environment: DISCORD_WEBHOOK_URL',
    phase: 'Phase 2',
    status: DISCORD_WEBHOOK_URL ? 'pass' : 'warning',
    message: DISCORD_WEBHOOK_URL ? 'Configured' : 'Optional - not configured',
  });

  // Airtable Tables
  const tables = [
    { name: 'Active Games', phase: 'Phase 1' },
    { name: 'Historical Games', phase: 'Phase 3' },
    { name: 'Signals', phase: 'Phase 2' },
    { name: 'Strategies', phase: 'Phase 2' },
    { name: 'Triggers', phase: 'Phase 2' },
    { name: 'Players', phase: 'Phase 3' },
    { name: 'Bankroll', phase: 'Phase 4A' },
  ];

  for (const table of tables) {
    const result = await checkAirtableTable(table.name);
    result.phase = table.phase;
    results.push(result);
  }

  // Phase 3: Q4 Data Check
  const q4Check = await checkHistoricalGamesQ4();
  results.push(q4Check);

  // Phase 4A: Bankroll functionality
  const bankrollCheck = await checkBankroll();
  results.push(bankrollCheck);

  // Summary by phase
  const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4A'];
  const phaseStatus: Record<string, { pass: number; fail: number; warning: number }> = {};

  for (const phase of phases) {
    const phaseResults = results.filter(r => r.phase === phase);
    phaseStatus[phase] = {
      pass: phaseResults.filter(r => r.status === 'pass').length,
      fail: phaseResults.filter(r => r.status === 'fail').length,
      warning: phaseResults.filter(r => r.status === 'warning').length,
    };
  }

  const totalPassed = results.filter(r => r.status === 'pass').length;
  const totalFailed = results.filter(r => r.status === 'fail').length;
  const totalWarnings = results.filter(r => r.status === 'warning').length;

  return NextResponse.json({
    success: totalFailed === 0,
    timestamp: new Date().toISOString(),
    executionTime: `${Date.now() - startTime}ms`,
    summary: {
      total: results.length,
      passed: totalPassed,
      failed: totalFailed,
      warnings: totalWarnings,
    },
    phaseStatus,
    results,
    recommendations: totalFailed > 0 ? [
      'Fix all failed checks before proceeding',
      'Run /api/test-players to verify Players table schema',
      'Run /api/test-historical to verify Historical Games',
    ] : [
      'All systems operational',
      'Ready for Phase 5 implementation',
    ],
  });
}
