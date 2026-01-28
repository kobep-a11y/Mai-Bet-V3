import { NextRequest, NextResponse } from 'next/server';
import { fetchStrategies, createStrategy, clearCache } from '@/lib/strategy-service';

/**
 * GET - Fetch all strategies with their triggers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      clearCache();
    }

    const strategies = await fetchStrategies(forceRefresh);

    return NextResponse.json({
      success: true,
      count: strategies.length,
      data: strategies,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new strategy
 *
 * Expected body:
 * {
 *   "name": "My Strategy",
 *   "description": "Strategy description",
 *   "triggerMode": "sequential" | "parallel",
 *   "isActive": true,
 *   "discordWebhooks": [
 *     { "url": "https://discord.com/api/webhooks/...", "name": "Main Channel", "isActive": true }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, triggerMode, isActive, discordWebhooks } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate Discord webhooks if provided
    if (discordWebhooks) {
      if (!Array.isArray(discordWebhooks)) {
        return NextResponse.json(
          { success: false, error: 'discordWebhooks must be an array' },
          { status: 400 }
        );
      }

      for (const webhook of discordWebhooks) {
        if (!webhook.url || !webhook.name) {
          return NextResponse.json(
            { success: false, error: 'Each webhook must have url and name' },
            { status: 400 }
          );
        }
      }
    }

    const strategy = await createStrategy({
      name,
      description,
      triggerMode,
      isActive,
      discordWebhooks,
    });

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: 'Failed to create strategy' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: strategy },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}
