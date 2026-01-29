import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
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
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

async function getAllRecords(tableName: string): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.append('pageSize', '100');
    if (offset) params.append('offset', offset);

    const response = await airtableRequest(tableName, `?${params.toString()}`);
    if (!response.ok) {
      console.error(`Error fetching ${tableName}:`, response.status);
      break;
    }

    const data = await response.json();
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function deleteDuplicates(
  tableName: string,
  keyField: string
): Promise<{ kept: number; deleted: number; errors: string[] }> {
  const records = await getAllRecords(tableName);
  const seen = new Map<string, AirtableRecord>();
  const toDelete: AirtableRecord[] = [];

  for (const record of records) {
    const key = String(record.fields[keyField] || '');
    if (!key) continue;

    if (seen.has(key)) {
      // Keep the older record (first seen), delete this one
      toDelete.push(record);
    } else {
      seen.set(key, record);
    }
  }

  const errors: string[] = [];
  let deleted = 0;

  // Delete in batches of 10
  for (let i = 0; i < toDelete.length; i += 10) {
    const batch = toDelete.slice(i, i + 10);
    const recordIds = batch.map(r => `records[]=${r.id}`).join('&');

    try {
      const response = await airtableRequest(tableName, `?${recordIds}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        deleted += batch.length;
      } else {
        const error = await response.json();
        errors.push(`Batch ${i / 10 + 1}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      errors.push(`Batch ${i / 10 + 1}: ${err}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return {
    kept: seen.size,
    deleted,
    errors,
  };
}

/**
 * GET - Clean up all duplicate records
 */
export async function GET(request: NextRequest) {
  try {
    const results: Record<string, unknown> = {};

    // 1. Clean up Active Games (by Event ID)
    console.log('Cleaning up Active Games...');
    results.activeGames = await deleteDuplicates('Active Games', 'Event ID');

    // 2. Clean up Historical Games (by Name which is Event ID)
    console.log('Cleaning up Historical Games...');
    results.historicalGames = await deleteDuplicates('Historical Games', 'Name');

    // 3. Clean up Players (by Name)
    console.log('Cleaning up Players...');
    results.players = await deleteDuplicates('Players', 'Name');

    // 4. Clean up Signals (keep all - but report duplicates by Game ID + Strategy ID combo)
    console.log('Checking Signals for duplicates...');
    const signals = await getAllRecords('Signals');
    const signalKeys = new Map<string, AirtableRecord[]>();
    for (const signal of signals) {
      const gameId = signal.fields['Game ID'] as string || '';
      const strategyId = Array.isArray(signal.fields.Strategy)
        ? signal.fields.Strategy[0]
        : signal.fields.Strategy;
      const key = `${gameId}-${strategyId}`;
      if (!signalKeys.has(key)) {
        signalKeys.set(key, []);
      }
      signalKeys.get(key)!.push(signal);
    }
    const duplicateSignals = Array.from(signalKeys.entries())
      .filter(([_, records]) => records.length > 1)
      .map(([key, records]) => ({
        key,
        count: records.length,
        ids: records.map(r => r.id),
      }));
    results.signals = {
      total: signals.length,
      unique: signalKeys.size,
      duplicates: duplicateSignals.length,
      duplicateDetails: duplicateSignals.slice(0, 10), // First 10
    };

    return NextResponse.json({
      success: true,
      message: 'Duplicate cleanup completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Delete specific duplicates with more control
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, keyField, dryRun = true } = body;

    if (!table || !keyField) {
      return NextResponse.json(
        { success: false, error: 'table and keyField are required' },
        { status: 400 }
      );
    }

    const records = await getAllRecords(table);
    const seen = new Map<string, AirtableRecord>();
    const duplicates: Array<{ id: string; key: string }> = [];

    for (const record of records) {
      const key = String(record.fields[keyField] || '');
      if (!key) continue;

      if (seen.has(key)) {
        duplicates.push({ id: record.id, key });
      } else {
        seen.set(key, record);
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        table,
        totalRecords: records.length,
        uniqueRecords: seen.size,
        duplicatesToDelete: duplicates.length,
        duplicates: duplicates.slice(0, 50),
      });
    }

    // Actually delete
    let deleted = 0;
    const errors: string[] = [];

    for (const dup of duplicates) {
      try {
        const response = await airtableRequest(table, `/${dup.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          deleted++;
        } else {
          const error = await response.json();
          errors.push(`${dup.id}: ${JSON.stringify(error)}`);
        }
      } catch (err) {
        errors.push(`${dup.id}: ${err}`);
      }
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      table,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in targeted cleanup:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
