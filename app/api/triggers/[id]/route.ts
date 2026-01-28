import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { StrategyTrigger, AirtableTriggerFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const record = await base('Triggers').find(params.id);
    const fields = record.fields as unknown as AirtableTriggerFields;
    let conditions = [];
    try { conditions = fields.Conditions ? JSON.parse(fields.Conditions) : []; } catch { conditions = []; }
    const trigger: StrategyTrigger = { id: record.id, strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '', name: fields.Name || '', conditions, order: fields.Order || 0, entryOrClose: fields['Entry Or Close'] || 'entry' };
    return NextResponse.json({ success: true, data: trigger });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Trigger not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.Name = body.name;
    if (body.conditions !== undefined) updateFields.Conditions = JSON.stringify(body.conditions);
    if (body.order !== undefined) updateFields.Order = body.order;
    if (body.entryOrClose !== undefined) updateFields['Entry Or Close'] = body.entryOrClose;

    const record = await base('Triggers').update(params.id, updateFields);
    const fields = record.fields as unknown as AirtableTriggerFields;
    let conditions = [];
    try { conditions = fields.Conditions ? JSON.parse(fields.Conditions) : []; } catch { conditions = []; }
    return NextResponse.json({ success: true, data: { id: record.id, strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '', name: fields.Name, conditions, order: fields.Order, entryOrClose: fields['Entry Or Close'] } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update trigger' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await base('Triggers').destroy(params.id);
    return NextResponse.json({ success: true, message: 'Trigger deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete trigger' }, { status: 500 });
  }
}
