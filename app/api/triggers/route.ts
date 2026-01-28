import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { StrategyTrigger, Condition, AirtableTriggerFields } from '@/types';
import { clearCache } from '@/lib/strategy-service';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

/**
 * GET - Fetch triggers, optionally filtered by strategyId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');

    const selectOptions: Airtable.SelectOptions<AirtableTriggerFields> = {
      sort: [{ field: 'Order', direction: 'asc' }],
    };

    if (strategyId) {
      selectOptions.filterByFormula = `SEARCH("${strategyId}", ARRAYJOIN({Strategy}))`;
    }

    const records = await base('Triggers').select(selectOptions).all();

    const triggers: StrategyTrigger[] = records.map((record) => {
      const fields = record.fields as unknown as AirtableTriggerFields;
      let conditions: Condition[] = [];
      try {
        conditions = fields.Conditions ? JSON.parse(fields.Conditions) : [];
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

    const record = await base('Triggers').create({
      Name: name,
      Strategy: [strategyId],
      Conditions: JSON.stringify(conditions || []),
      Order: order || 1,
      'Entry Or Close': entryOrClose || 'entry',
    } as Partial<AirtableTriggerFields>);

    const fields = record.fields as unknown as AirtableTriggerFields;
    let parsedConditions: Condition[] = [];
    try {
      parsedConditions = fields.Conditions ? JSON.parse(fields.Conditions) : [];
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
