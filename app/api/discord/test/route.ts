import { NextResponse } from 'next/server';

export async function POST() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { success: false, error: 'Discord webhook URL not configured' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🧪 MAI Bets V3 - Test Message',
          description: 'If you see this, your Discord webhook is working correctly!',
          color: 0x8b5cf6, // Purple
          timestamp: new Date().toISOString(),
          footer: {
            text: 'MAI Bets V3'
          }
        }]
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'Test message sent' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Discord returned an error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Discord test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test message' },
      { status: 500 }
    );
  }
}
