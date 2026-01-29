import { NextRequest, NextResponse } from 'next/server';
import { StrategyTrigger, Condition, AirtableTriggerFields } from '@/types';
import { clearCache } from '@/lib/strategy-service';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Airtable REST API configuration
// Using REST API instead of SDK to avoid AbortSignal bug on Vercel serverless
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

/**
 * Helper function to make Airtable REST API requests
 */
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
 * GET - Fetch triggers, optionally filtered by strategyId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');

    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Order');
    params.append('sort[0][direction]', 'asc');

    if (strategyId) {
      params.append('filterByFormula', `SEARCH("${strategyId}", ARRAYJOIN({Strategy}))`);
    }

    // Fetch all records with pagination
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const queryParams = new URLSearchParams(params);
      if (offset) queryParams.set('offset', offset);

      const response = await airtableRequest('Triggers', `?${queryParams.toString()}`);
      if (!response.ok) {
        console.error('Error fetching triggers:', response.status);
        return NextResponse.json({ success: false, error: 'Failed to fetch triggers' }, { status: 500 });
      }

      const data = await response.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    const triggers: StrategyTrigger[] = allRecords.map((record) => {
      const fields = record.fields as unknown as AirtableTriggerFields;
      let conditions: Condition[] = [];
      try {
        conditions = fields.Conditions ? JSON.parse(fields.Conditions as string) : [];
      } catch {
        conditions = [];
      }

      return {
        id: record.id,
        strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
        name: fields.Name || '',
        conditions,
        order: fields.Order || 0,
        entryOrClose: fields['Entry Or Close'] || 'entry',
      };
    });

    return NextResponse.json({ success: true, data: triggers });
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch triggers' }, { status: 500 });
  }
}

/**
 * POST - Create a new trigger
 *
 * Expected body:
 * {
 *   "strategyId": "rec...",
 *   "name": "Q3 Lead Check",
 *   "conditions": [
 *     { "field": "quarter", "operator": "equals", "value": 3 },
 *     { "field": "absScoreDifferential", "operator": "greater_than_or_equal", "value": 10 }
 *   ],
 *   "order": 1,
 *   "entryOrClose": "entry"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, name, conditions, order, entryOrClose } = body;

    if (!strategyId || !name) {
      return NextResponse.json(
        { success: false, error: 'strategyId and name are required' },
        { status: 400 }
      );
    }

    // Validate conditions structure
    if (conditions && !Array.isArray(conditions)) {
      return NextResponse.json(
        { success: false, error: 'conditions must be an array' },
        { status: 400 }
      );
    }

    // Validate each condition
    if (conditions) {
      for (const condition of conditions) {
        if (!condition.field || !condition.operator || condition.value === undefined) {
          return NextResponse.json(
            { success: false, error: 'Each condition must have field, operator, and value' },
            { status: 400 }
          );
        }
      }
    }

    const response = await airtableRequest('Triggers', '', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          Name: name,
          Strategy: [strategyId],
          Conditions: JSON.stringify(conditions || []),
          Order: order || 1,
          'Entry Or Close': entryOrClose || 'entry',
        },
      }),
    });

    if (!response.ok) {
      console.error('Error creating trigger:', response.status);
      return NextResponse.json({ success: false, error: 'Failed to create trigger' }, { status: 500 });
    }

    const record = await response.json();
    const fields = record.fields as unknown as AirtableTriggerFields;
    let parsedConditions: Condition[] = [];
    try {
      parsedConditions = fields.Conditions ? JSON.parse(fields.Conditions as string) : [];
    } catch {
      parsedConditions = [];
    }

    // Clear strategy cache so new trigger is included
    clearCache();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: record.id,
          strategyId,
          name: fields.Name,
          conditions: parsedConditions,
          order: fields.Order,
          entryOrClose: fields['Entry Or Close'],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating trigger:', error);
    return NextResponse.json({ success: false, error: 'Failed to create trigger' }, { status: 500 });
  }
}
