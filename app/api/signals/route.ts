import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Signal, AirtableSignalFields } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

export async function GET() {
  try {
    const records = await base('Signals').select({
      sort: [{ field: 'Entry Time', direction: 'desc' }],
    }).all();

    const signals: Signal[] = records.map((record) => {
      const fields = record.fields as unknown as AirtableSignalFields;
      return {
        id: record.id,
        strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
        strategyName: fields.Name || 'Unknown Strategy',
        gameId: fields['Game ID'] || '',
        homeTeam: 'Home Team', // Would need to be fetched from game data
        awayTeam: 'Away Team',
        entryTime: fields['Entry Time'] || new Date().toISOString(),
        closeTime: fields['Close Time'],
        entryValue: fields['Entry Value'],
        closeValue: fields['Close Value'],
        status: fields.Status || 'active',
        notes: fields.Notes,
        createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
