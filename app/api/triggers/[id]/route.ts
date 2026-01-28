import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { StrategyTrigger, AirtableTriggerFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// GET single trigger
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const record = await base('Triggers').find(id);
    const fields = record.fields as unknown as AirtableTriggerFields;

    let conditions = [];
    try {
      conditions = fields.Conditions ? JSON.parse(fields.Conditions) : [];
    } catch {
      conditions = [];
    }

    const trigger: StrategyTrigger = {
      id: record.id,
      strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
      name: fields.Name || '',
      conditions,
      order: fields.Order || 0,
      entryOrClose: fields['Entry Or Close'] || 'entry',
    };

    return NextResponse.json({ success: true, data: trigger });
  } catch (error) {
    console.error('Error fetching trigger:', error);
    return NextResponse.json(
      { success: false, error: 'Trigger not found' },
      { status: 404 }
    );
  }
}

// PUT update trigger
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, conditions, order, entryOrClose } = body;

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.Name = name;
    if (conditions !== undefined) updateFields.Conditions = JSON.stringify(conditions);
    if (order !== undefined) updateFields.Order = order;
    if (entryOrClose !== undefined) updateFields['Entry Or Close'] = entryOrClose;

    const record = await base('Triggers').update(id, updateFields);
    const fields = record.fields as unknown as AirtableTriggerFields;

    let parsedConditions = [];
    try {
      parsedConditions = fields.Conditions ? JSON.parse(fields.Conditions) : [];
    } catch {
      parsedConditions = [];
    }

    const trigger: StrategyTrigger = {
      id: record.id,
      strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
      name: fields.Name || '',
      conditions: parsedConditions,
      order: fields.Order || 0,
      entryOrClose: fields['Entry Or Close'] || 'entry',
    };

    return NextResponse.json({ success: true, data: trigger });
  } catch (error) {
    console.error('Error updating trigger:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trigger' },
      { status: 500 }
    );
  }
}

// DELETE trigger
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await base('Triggers').destroy(id);
    return NextResponse.json({ success: true, message: 'Trigger deleted' });
  } catch (error) {
    console.error('Error deleting trigger:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trigger' },
      { status: 500 }
    );
  }
}
