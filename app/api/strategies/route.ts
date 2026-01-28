import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Strategy, AirtableStrategyFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// GET all strategies
export async function GET() {
  try {
    const records = await base('Strategies').select().all();

    const strategies: Strategy[] = records.map((record) => {
      const fields = record.fields as unknown as AirtableStrategyFields;
      return {
        id: record.id,
        name: fields.Name || '',
        description: fields.Description || '',
        triggerMode: fields['Trigger Mode'] || 'sequential',
        isActive: fields['Is Active'] || false,
        triggers: [], // Triggers are loaded separately
        createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: strategies });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

// POST create new strategy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, triggerMode, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const record = await base('Strategies').create({
      Name: name,
      Description: description || '',
      'Trigger Mode': triggerMode || 'sequential',
      'Is Active': isActive || false,
    });

    const fields = record.fields as unknown as AirtableStrategyFields;
    const strategy: Strategy = {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      triggerMode: fields['Trigger Mode'] || 'sequential',
      isActive: fields['Is Active'] || false,
      triggers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: strategy }, { status: 201 });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}
