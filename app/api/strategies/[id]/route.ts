import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Strategy, StrategyTrigger, AirtableStrategyFields, AirtableTriggerFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const record = await base('Strategies').find(id);
    const fields = record.fields as unknown as AirtableStrategyFields;

    const triggerRecords = await base('Triggers').select({ filterByFormula: `SEARCH("${id}", ARRAYJOIN({Strategy}))`, sort: [{ field: 'Order', direction: 'asc' }] }).all();
    const triggers: StrategyTrigger[] = triggerRecords.map((tr) => {
      const tf = tr.fields as unknown as AirtableTriggerFields;
      let conditions = [];
      try { conditions = tf.Conditions ? JSON.parse(tf.Conditions) : []; } catch { conditions = []; }
      return { id: tr.id, strategyId: id, name: tf.Name || '', conditions, order: tf.Order || 0, entryOrClose: tf['Entry Or Close'] || 'entry' };
    });

    const strategy: Strategy = {
      id: record.id, name: fields.Name || '', description: fields.Description || '',
      triggerMode: fields['Trigger Mode'] || 'sequential', isActive: fields['Is Active'] || false,
      triggers, createdAt: (record as any)._rawJson?.createdTime || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.Name = body.name;
    if (body.description !== undefined) updateFields.Description = body.description;
    if (body.triggerMode !== undefined) updateFields['Trigger Mode'] = body.triggerMode;
    if (body.isActive !== undefined) updateFields['Is Active'] = body.isActive;

    const record = await base('Strategies').update(id, updateFields);
    const fields = record.fields as unknown as AirtableStrategyFields;
    return NextResponse.json({ success: true, data: { id: record.id, name: fields.Name, description: fields.Description, triggerMode: fields['Trigger Mode'], isActive: fields['Is Active'] } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update strategy' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const triggerRecords = await base('Triggers').select({ filterByFormula: `SEARCH("${id}", ARRAYJOIN({Strategy}))` }).all();
    if (triggerRecords.length > 0) {
      const triggerIds = triggerRecords.map((tr) => tr.id);
      for (let i = 0; i < triggerIds.length; i += 10) {
        await base('Triggers').destroy(triggerIds.slice(i, i + 10));
      }
    }
    await base('Strategies').destroy(id);
    return NextResponse.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete strategy' }, { status: 500 });
  }
}
