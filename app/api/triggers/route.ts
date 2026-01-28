import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { StrategyTrigger, AirtableTriggerFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// GET all triggers (optionally filter by strategy)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');

    let selectOptions: Airtable.SelectOptions = {
      sort: [{ field: 'Order', direction: 'asc' }],
    };

    if (strategyId) {
      selectOptions.filterByFormula = `SEARCH("${strategyId}", ARRAYJOIN({Strategy}))`;
    }

    const records = await base('Triggers').select(selectOptions).all();

    const triggers: StrategyTrigger[] = records.map((record) => {
      const fields = record.fields as unknown as AirtableTriggerFields;
      let conditions = [];
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch triggers' },
      { status: 500 }
    );
  }
}

// POST create new trigger
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

    const record = await base('Triggers').create({
      Name: name,
      Strategy: [strategyId],
      Conditions: JSON.stringify(conditions || []),
      Order: order || 1,
      'Entry Or Close': entryOrClose || 'entry',
    });

    const fields = record.fields as unknown as AirtableTriggerFields;
    let parsedConditions = [];
    try {
      parsedConditions = fields.Conditions ? JSON.parse(fields.Conditions) : [];
    } catch {
      parsedConditions = [];
    }

    const trigger: StrategyTrigger = {
      id: record.id,
      strategyId,
      name: fields.Name || '',
      conditions: parsedConditions,
      order: fields.Order || 0,
      entryOrClose: fields['Entry Or Close'] || 'entry',
    };

    return NextResponse.json({ success: true, data: trigger }, { status: 201 });
  } catch (error) {
    console.error('Error creating trigger:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trigger' },
      { status: 500 }
    );
  }
}
