import { NextRequest, NextResponse } from 'next/server';
import { StrategyTrigger, AirtableTriggerFields } from '@/types';
import { clearCache } from '@/lib/strategy-service';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await airtableRequest('Triggers', `/${id}`);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Trigger not found' }, { status: 404 });
    }

    const record = await response.json();
    const fields = record.fields as unknown as AirtableTriggerFields;
    let conditions = [];
    try {
      conditions = fields.Conditions ? JSON.parse(fields.Conditions as string) : [];
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
    return NextResponse.json({ success: false, error: 'Trigger not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateFields: Record<string, unknown> = {};
    if (body.name !== undefined) updateFields.Name = body.name;
    if (body.conditions !== undefined) updateFields.Conditions = JSON.stringify(body.conditions);
    if (body.order !== undefined) updateFields.Order = body.order;
    if (body.entryOrClose !== undefined) updateFields['Entry Or Close'] = body.entryOrClose;

    const response = await airtableRequest('Triggers', `/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: updateFields }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to update trigger' }, { status: 500 });
    }

    const record = await response.json();
    const fields = record.fields as unknown as AirtableTriggerFields;
    let conditions = [];
    try {
      conditions = fields.Conditions ? JSON.parse(fields.Conditions as string) : [];
    } catch {
      conditions = [];
    }

    // Clear cache so changes take effect
    clearCache();

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
        name: fields.Name,
        conditions,
        order: fields.Order,
        entryOrClose: fields['Entry Or Close'],
      },
    });
  } catch (error) {
    console.error('Error updating trigger:', error);
    return NextResponse.json({ success: false, error: 'Failed to update trigger' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await airtableRequest('Triggers', `/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete trigger' }, { status: 500 });
    }

    // Clear cache so changes take effect
    clearCache();

    return NextResponse.json({ success: true, message: 'Trigger deleted' });
  } catch (error) {
    console.error('Error deleting trigger:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete trigger' }, { status: 500 });
  }
}
