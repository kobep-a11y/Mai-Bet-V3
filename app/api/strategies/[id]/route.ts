import { NextRequest, NextResponse } from 'next/server';
import { Strategy, StrategyTrigger, DiscordWebhook, AirtableStrategyFields, AirtableTriggerFields } from '@/types';
import { clearCache } from '@/lib/strategy-service';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

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

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch strategy
    const strategyResponse = await airtableRequest('Strategies', `/${id}`);
    if (!strategyResponse.ok) {
      return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
    }

    const record = await strategyResponse.json();
    const fields = record.fields as unknown as AirtableStrategyFields;

    // Fetch triggers for this strategy
    // Note: We fetch all triggers and filter in code because ARRAYJOIN returns
    // record names, not IDs, making SEARCH unreliable for linked record filtering
    const triggerParams = new URLSearchParams();
    triggerParams.append('sort[0][field]', 'Order');
    triggerParams.append('sort[0][direction]', 'asc');

    const triggerResponse = await airtableRequest('Triggers', `?${triggerParams.toString()}`);
    let triggerRecords: AirtableRecord[] = [];
    if (triggerResponse.ok) {
      const triggerData = await triggerResponse.json();
      const allTriggers = triggerData.records || [];
      // Filter triggers that belong to this strategy (Strategy field contains array of linked record IDs)
      triggerRecords = allTriggers.filter((tr: AirtableRecord) => {
        const strategyIds = (tr.fields as unknown as AirtableTriggerFields).Strategy || [];
        return strategyIds.includes(id);
      });
    }

    const triggers: StrategyTrigger[] = triggerRecords.map((tr) => {
      const tf = tr.fields as unknown as AirtableTriggerFields;
      let conditions = [];
      try {
        conditions = tf.Conditions ? JSON.parse(tf.Conditions as string) : [];
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
        discordWebhooks = JSON.parse(fields['Discord Webhooks'] as string);
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
      createdAt: record.createdTime || new Date().toISOString(),
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

    const response = await airtableRequest('Strategies', `/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: updateFields }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to update strategy' }, { status: 500 });
    }

    const record = await response.json();
    const fields = record.fields as unknown as AirtableStrategyFields;

    // Parse Discord webhooks for response
    let discordWebhooks: DiscordWebhook[] = [];
    if (fields['Discord Webhooks']) {
      try {
        discordWebhooks = JSON.parse(fields['Discord Webhooks'] as string);
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
    const triggerParams = new URLSearchParams();
    triggerParams.append('filterByFormula', `SEARCH("${id}", ARRAYJOIN({Strategy}))`);

    const triggerResponse = await airtableRequest('Triggers', `?${triggerParams.toString()}`);
    if (triggerResponse.ok) {
      const triggerData = await triggerResponse.json();
      const triggerRecords: AirtableRecord[] = triggerData.records || [];

      if (triggerRecords.length > 0) {
        const triggerIds = triggerRecords.map((tr) => tr.id);
        // Delete in batches of 10 (Airtable limit)
        for (let i = 0; i < triggerIds.length; i += 10) {
          const batchIds = triggerIds.slice(i, i + 10);
          const deleteParams = batchIds.map(id => `records[]=${id}`).join('&');
          await airtableRequest('Triggers', `?${deleteParams}`, { method: 'DELETE' });
        }
      }
    }

    // Delete the strategy
    const deleteResponse = await airtableRequest('Strategies', `/${id}`, { method: 'DELETE' });
    if (!deleteResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete strategy' }, { status: 500 });
    }

    // Clear cache
    clearCache();

    return NextResponse.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete strategy' }, { status: 500 });
  }
}
