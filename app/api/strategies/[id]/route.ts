import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Strategy, StrategyTrigger, DiscordWebhook, AirtableStrategyFields, AirtableTriggerFields } from '@/types';
import { clearCache } from '@/lib/strategy-service';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await base('Strategies').find(id);
    const fields = record.fields as unknown as AirtableStrategyFields;

    // Fetch triggers for this strategy
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

    // Parse Discord webhooks
    let discordWebhooks: DiscordWebhook[] = [];
    if (fields['Discord Webhooks']) {
      try {
        discordWebhooks = JSON.parse(fields['Discord Webhooks']);
      } catch {
        discordWebhooks = [];
      }
    }

    const strategy: Strategy = {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      triggerMode: fields['Trigger Mode'] || 'sequential',
      isActive: fields['Is Active'] || false,
      triggers,
      discordWebhooks,
      createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateFields: Partial<AirtableStrategyFields> = {};
    if (body.name !== undefined) updateFields.Name = body.name;
    if (body.description !== undefined) updateFields.Description = body.description;
    if (body.triggerMode !== undefined) updateFields['Trigger Mode'] = body.triggerMode;
    if (body.isActive !== undefined) updateFields['Is Active'] = body.isActive;
    if (body.discordWebhooks !== undefined) {
      updateFields['Discord Webhooks'] = JSON.stringify(body.discordWebhooks);
    }

    const record = await base('Strategies').update(id, updateFields);
    const fields = record.fields as unknown as AirtableStrategyFields;

    // Parse Discord webhooks for response
    let discordWebhooks: DiscordWebhook[] = [];
    if (fields['Discord Webhooks']) {
      try {
        discordWebhooks = JSON.parse(fields['Discord Webhooks']);
      } catch {
        discordWebhooks = [];
      }
    }

    // Clear cache so changes take effect
    clearCache();

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        name: fields.Name,
        description: fields.Description,
        triggerMode: fields['Trigger Mode'],
        isActive: fields['Is Active'],
        discordWebhooks,
      },
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return NextResponse.json({ success: false, error: 'Failed to update strategy' }, { status: 500 });
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

    // Delete associated triggers first
    const triggerRecords = await base('Triggers')
      .select({ filterByFormula: `SEARCH("${id}", ARRAYJOIN({Strategy}))` })
      .all();

    if (triggerRecords.length > 0) {
      const triggerIds = triggerRecords.map((tr) => tr.id);
      // Delete in batches of 10 (Airtable limit)
      for (let i = 0; i < triggerIds.length; i += 10) {
        await base('Triggers').destroy(triggerIds.slice(i, i + 10));
      }
    }

    // Delete the strategy
    await base('Strategies').destroy(id);

    // Clear cache
    clearCache();

    return NextResponse.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete strategy' }, { status: 500 });
  }
}
