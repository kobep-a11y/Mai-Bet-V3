import { NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

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

async function checkActiveStrategies(): Promise<CheckResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Strategies')}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      return {
        name: 'Active Strategies Check',
        phase: 'Phase 2',
        status: 'fail',
        message: 'Could not access Strategies table',
      };
    }

    const data = await response.json();
    const records = data.records || [];
    const activeStrategies = records.filter((r: { fields: { 'Is Active'?: boolean } }) => r.fields['Is Active']);

    if (activeStrategies.length === 0) {
      return {
        name: 'Active Strategies Check',
        phase: 'Phase 2',
        status: 'warning',
        message: `No active strategies found (${records.length} total strategies)`,
        details: {
          totalStrategies: records.length,
          activeCount: 0,
          note: 'At least one strategy must be active for signals to fire',
        },
      };
    }

    return {
      name: 'Active Strategies Check',
      phase: 'Phase 2',
      status: 'pass',
      message: `${activeStrategies.length} active strategies found`,
      details: {
        totalStrategies: records.length,
        activeCount: activeStrategies.length,
        activeNames: activeStrategies.map((s: { fields: { Name?: string } }) => s.fields.Name),
      },
    };
  } catch (error) {
    return {
      name: 'Active Strategies Check',
      phase: 'Phase 2',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkTriggersConfig(): Promise<CheckResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Triggers')}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      return {
        name: 'Triggers Configuration',
        phase: 'Phase 2',
        status: 'fail',
        message: 'Could not access Triggers table',
      };
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return {
        name: 'Triggers Configuration',
        phase: 'Phase 2',
        status: 'warning',
        message: 'No triggers configured',
      };
    }

    // Check for valid JSON in Conditions field
    let validCount = 0;
    let invalidCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      const conditions = record.fields.Conditions;
      if (conditions) {
        try {
          JSON.parse(conditions);
          validCount++;
        } catch {
          invalidCount++;
          errors.push(`Trigger "${record.fields.Name}": Invalid JSON in Conditions`);
        }
      }
    }

    if (invalidCount > 0) {
      return {
        name: 'Triggers Configuration',
        phase: 'Phase 2',
        status: 'warning',
        message: `${invalidCount} triggers have invalid JSON conditions`,
        details: { validCount, invalidCount, errors: errors.slice(0, 5) },
      };
    }

    return {
      name: 'Triggers Configuration',
      phase: 'Phase 2',
      status: 'pass',
      message: `${records.length} triggers configured, all valid`,
      details: { totalTriggers: records.length },
    };
  } catch (error) {
    return {
      name: 'Triggers Configuration',
      phase: 'Phase 2',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkLiveGames(): Promise<CheckResult> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const params = new URLSearchParams();
    params.append('filterByFormula', `IS_AFTER({Last Update}, '${fiveMinutesAgo}')`);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Active Games')}?${params.toString()}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      return {
        name: 'Live Games (Recent Activity)',
        phase: 'Phase 1',
        status: 'fail',
        message: 'Could not access Active Games table',
      };
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return {
        name: 'Live Games (Recent Activity)',
        phase: 'Phase 1',
        status: 'warning',
        message: 'No games updated in last 5 minutes (webhooks may not be firing)',
        details: {
          note: 'This is normal if no games are currently live',
        },
      };
    }

    // Check for missing team names
    const missingTeams = records.filter((r: { fields: Record<string, unknown> }) =>
      !r.fields['Home Team'] && !r.fields['Away Team ']
    );

    if (missingTeams.length > 0) {
      return {
        name: 'Live Games (Recent Activity)',
        phase: 'Phase 1',
        status: 'warning',
        message: `${records.length} active games, but ${missingTeams.length} missing team names`,
        details: {
          activeGames: records.length,
          missingTeamNames: missingTeams.length,
          note: 'Team names may not be in webhook data - check team-cache lookup',
        },
      };
    }

    return {
      name: 'Live Games (Recent Activity)',
      phase: 'Phase 1',
      status: 'pass',
      message: `${records.length} games updated in last 5 minutes`,
    };
  } catch (error) {
    return {
      name: 'Live Games (Recent Activity)',
      phase: 'Phase 1',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkRecentSignals(): Promise<CheckResult> {
  try {
    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Entry Time');
    params.append('sort[0][direction]', 'desc');
    params.append('maxRecords', '10');

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Signals')}?${params.toString()}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      return {
        name: 'Recent Signals',
        phase: 'Phase 2',
        status: 'fail',
        message: 'Could not access Signals table',
      };
    }

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) {
      return {
        name: 'Recent Signals',
        phase: 'Phase 2',
        status: 'warning',
        message: 'No signals have been created yet',
        details: {
          note: 'Signals are created when trigger conditions are met',
        },
      };
    }

    // Check if any signals are from today
    const today = new Date().toISOString().split('T')[0];
    const todaySignals = records.filter((r: { fields: { 'Entry Time'?: string } }) =>
      r.fields['Entry Time']?.startsWith(today)
    );

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      const status = (r as { fields: { Status?: string } }).fields.Status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return {
      name: 'Recent Signals',
      phase: 'Phase 2',
      status: todaySignals.length > 0 ? 'pass' : 'warning',
      message: `${records.length} recent signals (${todaySignals.length} from today)`,
      details: {
        totalRecent: records.length,
        todayCount: todaySignals.length,
        statusBreakdown: statusCounts,
      },
    };
  } catch (error) {
    return {
      name: 'Recent Signals',
      phase: 'Phase 2',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

async function checkDuplicates(): Promise<CheckResult> {
  try {
    // Check Active Games for duplicates
    const gamesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Active Games')}`;
    const gamesResponse = await fetch(gamesUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!gamesResponse.ok) {
      return {
        name: 'Duplicate Records Check',
        phase: 'Maintenance',
        status: 'fail',
        message: 'Could not access tables for duplicate check',
      };
    }

    const gamesData = await gamesResponse.json();
    const gameRecords = gamesData.records || [];
    const gameEventIds = gameRecords.map((r: { fields: { 'Event ID'?: string } }) => r.fields['Event ID']);
    const uniqueGameIds = new Set(gameEventIds);
    const gameDuplicates = gameEventIds.length - uniqueGameIds.size;

    // Check Historical Games for duplicates
    const histUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Historical Games')}`;
    const histResponse = await fetch(histUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    let histDuplicates = 0;
    if (histResponse.ok) {
      const histData = await histResponse.json();
      const histRecords = histData.records || [];
      const histNames = histRecords.map((r: { fields: { Name?: string } }) => r.fields.Name);
      const uniqueHistNames = new Set(histNames);
      histDuplicates = histNames.length - uniqueHistNames.size;
    }

    // Check Players for duplicates
    const playersUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Players')}`;
    const playersResponse = await fetch(playersUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });

    let playerDuplicates = 0;
    if (playersResponse.ok) {
      const playersData = await playersResponse.json();
      const playerRecords = playersData.records || [];
      const playerNames = playerRecords.map((r: { fields: { Name?: string } }) => r.fields.Name);
      const uniquePlayerNames = new Set(playerNames);
      playerDuplicates = playerNames.length - uniquePlayerNames.size;
    }

    const totalDuplicates = gameDuplicates + histDuplicates + playerDuplicates;

    if (totalDuplicates > 0) {
      return {
        name: 'Duplicate Records Check',
        phase: 'Maintenance',
        status: 'warning',
        message: `Found ${totalDuplicates} duplicate records across tables`,
        details: {
          activeGamesDuplicates: gameDuplicates,
          historicalGamesDuplicates: histDuplicates,
          playersDuplicates: playerDuplicates,
          action: 'Run GET /api/debug/cleanup-duplicates to fix',
        },
      };
    }

    return {
      name: 'Duplicate Records Check',
      phase: 'Maintenance',
      status: 'pass',
      message: 'No duplicate records found',
    };
  } catch (error) {
    return {
      name: 'Duplicate Records Check',
      phase: 'Maintenance',
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

  // Phase 2: Strategy and Signal checks
  const strategiesCheck = await checkActiveStrategies();
  results.push(strategiesCheck);

  const triggersCheck = await checkTriggersConfig();
  results.push(triggersCheck);

  const signalsCheck = await checkRecentSignals();
  results.push(signalsCheck);

  // Phase 1: Live Games check
  const liveGamesCheck = await checkLiveGames();
  results.push(liveGamesCheck);

  // Phase 3: Q4 Data Check
  const q4Check = await checkHistoricalGamesQ4();
  results.push(q4Check);

  // Phase 4A: Bankroll functionality
  const bankrollCheck = await checkBankroll();
  results.push(bankrollCheck);

  // Maintenance: Duplicate check
  const duplicatesCheck = await checkDuplicates();
  results.push(duplicatesCheck);

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
