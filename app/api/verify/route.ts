import { NextResponse } from 'next/server';

/**
 * Comprehensive system verification endpoint
 * Tests all major components of MAI Bets V3
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

async function verifyAirtableTable(tableName: string): Promise<VerificationResult> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        component: `Airtable: ${tableName}`,
        status: 'pass',
        message: `Table exists with ${data.records?.length || 0} records sampled`,
        details: { recordCount: data.records?.length || 0 },
      };
    } else {
      const error = await response.json();
      return {
        component: `Airtable: ${tableName}`,
        status: 'fail',
        message: error.error?.message || 'Table not found or inaccessible',
        details: error,
      };
    }
  } catch (error) {
    return {
      component: `Airtable: ${tableName}`,
      status: 'fail',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function verifyDiscord(): Promise<VerificationResult> {
  if (!DISCORD_WEBHOOK_URL) {
    return {
      component: 'Discord Webhook',
      status: 'warning',
      message: 'DISCORD_WEBHOOK_URL not configured',
    };
  }

  try {
    // Just verify the webhook URL is valid (don't actually send)
    const url = new URL(DISCORD_WEBHOOK_URL);
    if (url.hostname === 'discord.com' || url.hostname === 'discordapp.com') {
      return {
        component: 'Discord Webhook',
        status: 'pass',
        message: 'Webhook URL configured and appears valid',
      };
    }
    return {
      component: 'Discord Webhook',
      status: 'warning',
      message: 'Webhook URL may be invalid',
    };
  } catch {
    return {
      component: 'Discord Webhook',
      status: 'fail',
      message: 'Invalid webhook URL format',
    };
  }
}

async function verifyEnvironment(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check required env vars
  results.push({
    component: 'ENV: AIRTABLE_API_KEY',
    status: AIRTABLE_API_KEY ? 'pass' : 'fail',
    message: AIRTABLE_API_KEY ? 'Configured' : 'Missing',
  });

  results.push({
    component: 'ENV: AIRTABLE_BASE_ID',
    status: AIRTABLE_BASE_ID ? 'pass' : 'fail',
    message: AIRTABLE_BASE_ID ? 'Configured' : 'Missing',
  });

  results.push({
    component: 'ENV: DISCORD_WEBHOOK_URL',
    status: DISCORD_WEBHOOK_URL ? 'pass' : 'warning',
    message: DISCORD_WEBHOOK_URL ? 'Configured' : 'Optional - not configured',
  });

  return results;
}

export async function GET() {
  const startTime = Date.now();
  const results: VerificationResult[] = [];

  // Phase 1: Environment Verification
  const envResults = await verifyEnvironment();
  results.push(...envResults);

  // Phase 2: Airtable Tables Verification
  const tables = [
    'Active Games',
    'Historical Games',
    'Signals',
    'Strategies',
    'Triggers',
    'Players',
  ];

  for (const table of tables) {
    const result = await verifyAirtableTable(table);
    results.push(result);
  }

  // Phase 3: Discord Verification
  const discordResult = await verifyDiscord();
  results.push(discordResult);

  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  const overallStatus = failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

  return NextResponse.json({
    success: failed === 0,
    status: overallStatus,
    summary: {
      passed,
      failed,
      warnings,
      total: results.length,
    },
    verificationTime: `${Date.now() - startTime}ms`,
    results,
    missingTables: results
      .filter(r => r.status === 'fail' && r.component.startsWith('Airtable:'))
      .map(r => r.component.replace('Airtable: ', '')),
  });
}
