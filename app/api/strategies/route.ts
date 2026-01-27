// MAI Bets V3 - Strategies API Endpoint
import { NextResponse } from 'next/server';
import { getStrategies, getStrategyById, testConnection } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // Test Airtable connection
    if (action === 'test') {
      const connected = await testConnection();
      return NextResponse.json({
        success: true,
        data: { connected },
        message: connected ? 'Airtable connected' : 'Airtable connection failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Get specific strategy
    if (id) {
      const strategy = await getStrategyById(id);
      if (!strategy) {
        return NextResponse.json(
          { success: false, error: 'Strategy not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: strategy,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all strategies
    const strategies = await getStrategies();

    return NextResponse.json({
      success: true,
      data: strategies,
      count: strategies.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Strategies API error:', error);
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
