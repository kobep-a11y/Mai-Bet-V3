import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Strategy, StrategyTrigger, AirtableStrategyFields, AirtableTriggerFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// GET single strategy with triggers
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const record = await base('Strategies').find(id);
    const fields = record.fields as unknown as AirtableStrategyFields;

    // Get triggers for this strategy
    const triggerRecords = await base('Triggers')
      .select({
        filterByFormula: `SEARCH("${id}", ARRAYJOIN({Strategy}))`,
        sort: [{ field: 'Order', direction: 'asc' }],
      })
      .all();

    const triggers: StrategyTrigger[] = triggerRecords.map((tr) => {
      const tf = tr.fields as unknown as AirtableTriggerFields;
      let conditions = [];
      try {
        conditions = tf.Conditions ? JSON.parse(tf.Conditions) : [];
      } catch {
        conditions = [];
      }
      return {
        id: tr.id,
        strategyId: id,
        name: tf.Name || '',
        conditions,
        order: tf.Order || 0,
        entryOrClose: tf['Entry Or Close'] || 'entry',
      };
    });

    const strategy: Strategy = {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      triggerMode: fields['Trigger Mode'] || 'sequential',
      isActive: fields['Is Active'] || false,
      triggers,
      createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Strategy not found' },
      { status: 404 }
    );
  }
}

// PUT update strategy
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, triggerMode, isActive } = body;

    const updateFields: Partial<AirtableStrategyFields> = {};
    if (name !== undefined) updateFields.Name = name;
    if (description !== undefined) updateFields.Description = description;
    if (triggerMode !== undefined) updateFields['Trigger Mode'] = triggerMode;
    if (isActive !== undefined) updateFields['Is Active'] = isActive;

    const record = await base('Strategies').update(id, updateFields);
    const fields = record.fields as unknown as AirtableStrategyFields;

    const strategy: Partial<Strategy> = {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      triggerMode: fields['Trigger Mode'] || 'sequential',
      isActive: fields['Is Active'] || false,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update strategy' },
      { status: 500 }
    );
  }
}

// DELETE strategy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First delete all triggers associated with this strategy
    const triggerRecords = await base('Triggers')
      .select({
        filterByFormula: `SEARCH("${id}", ARRAYJOIN({Strategy}))`,
      })
      .all();

    if (triggerRecords.length > 0) {
      const triggerIds = triggerRecords.map((tr) => tr.id);
      // Delete triggers in batches of 10 (Airtable limit)
      for (let i = 0; i < triggerIds.length; i += 10) {
        const batch = triggerIds.slice(i, i + 10);
        await base('Triggers').destroy(batch);
      }
    }

    // Then delete the strategy
    await base('Strategies').destroy(id);

    return NextResponse.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete strategy' },
      { status: 500 }
    );
  }
}
