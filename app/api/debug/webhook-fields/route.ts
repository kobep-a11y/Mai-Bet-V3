import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Store recent webhook payloads for debugging
const recentPayloads: { timestamp: string; fields: string[]; sample: Record<string, unknown> }[] = [];
const MAX_STORED = 10;

/**
 * POST - Store a webhook payload for debugging
 * Call this from your N8N workflow to see what fields are being sent
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Store for debugging
    recentPayloads.unshift({
      timestamp: new Date().toISOString(),
      fields: Object.keys(data),
      sample: data,
    });

    // Keep only last N
    while (recentPayloads.length > MAX_STORED) {
      recentPayloads.pop();
    }

    // Log to console
    console.log('📥 DEBUG Webhook received. Fields:', Object.keys(data).join(', '));

    // Check for odds fields
    const oddsFields = Object.entries(data).filter(([k]) =>
      k.toLowerCase().includes('spread') ||
      k.toLowerCase().includes('ml') ||
      k.toLowerCase().includes('total') ||
      k.toLowerCase().includes('line') ||
      k.toLowerCase().includes('moneyline') ||
      k.toLowerCase().includes('odds')
    );

    // Check for time fields
    const timeFields = Object.entries(data).filter(([k]) =>
      k.toLowerCase().includes('time') ||
      k.toLowerCase().includes('minute') ||
      k.toLowerCase().includes('second') ||
      k.toLowerCase().includes('clock')
    );

    console.log('💰 Odds fields:', oddsFields.map(([k, v]) => `${k}=${v}`).join(', ') || 'NONE FOUND');
    console.log('⏱️ Time fields:', timeFields.map(([k, v]) => `${k}=${v}`).join(', ') || 'NONE FOUND');

    return NextResponse.json({
      success: true,
      message: 'Debug payload stored',
      fieldsReceived: Object.keys(data).length,
      oddsFields: Object.fromEntries(oddsFields),
      timeFields: Object.fromEntries(timeFields),
    });
  } catch (error) {
    console.error('Error in debug webhook:', error);
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

/**
 * GET - View recent webhook payloads
 */
export async function GET() {
  // Analyze fields across all payloads
  const allFields = new Map<string, { count: number; sampleValue: unknown }>();

  for (const payload of recentPayloads) {
    for (const [key, value] of Object.entries(payload.sample)) {
      if (!allFields.has(key)) {
        allFields.set(key, { count: 0, sampleValue: value });
      }
      allFields.get(key)!.count++;
    }
  }

  // Group fields by category
  const categorizedFields = {
    odds: [] as string[],
    time: [] as string[],
    score: [] as string[],
    team: [] as string[],
    other: [] as string[],
  };

  for (const field of allFields.keys()) {
    const lower = field.toLowerCase();
    if (lower.includes('spread') || lower.includes('ml') || lower.includes('total') ||
        lower.includes('line') || lower.includes('moneyline') || lower.includes('odds')) {
      categorizedFields.odds.push(field);
    } else if (lower.includes('time') || lower.includes('minute') || lower.includes('second') ||
               lower.includes('clock') || lower.includes('quarter') || lower.includes('period')) {
      categorizedFields.time.push(field);
    } else if (lower.includes('score') || lower.includes('point')) {
      categorizedFields.score.push(field);
    } else if (lower.includes('team') || lower.includes('home') || lower.includes('away')) {
      categorizedFields.team.push(field);
    } else {
      categorizedFields.other.push(field);
    }
  }

  return NextResponse.json({
    success: true,
    payloadsStored: recentPayloads.length,
    categorizedFields,
    allFields: Object.fromEntries(
      Array.from(allFields.entries()).map(([k, v]) => [k, v.sampleValue])
    ),
    recentPayloads: recentPayloads.slice(0, 3), // Show last 3 full payloads
    hint: 'POST to this endpoint from your N8N workflow to capture field names',
  });
}
