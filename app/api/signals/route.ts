// MAI Bets V3 - Signals API Endpoint
import { NextResponse } from 'next/server';
import { getActiveSignals, getSignalsByDate } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'active', 'today', or date range
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Get signals by date range
    if (startDate && endDate) {
      const signals = await getSignalsByDate(startDate, endDate);
      return NextResponse.json({
        success: true,
        data: signals,
        count: signals.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Get today's signals
    if (filter === 'today') {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const signals = await getSignalsByDate(startOfDay, endOfDay);
      return NextResponse.json({
        success: true,
        data: signals,
        count: signals.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Default: get active signals
    const signals = await getActiveSignals();

    return NextResponse.json({
      success: true,
      data: signals,
      count: signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Signals API error:', error);
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
