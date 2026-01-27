// MAI Bets V3 - Test Discord Webhook
import { NextResponse } from 'next/server';
import { testDiscordWebhook, sendSystemAlert } from '@/lib/discord';

export async function POST() {
  try {
    const success = await testDiscordWebhook();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Discord test message sent successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send Discord message. Check webhook URL.',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Discord test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST to this endpoint to test Discord webhook',
    timestamp: new Date().toISOString(),
  });
}
