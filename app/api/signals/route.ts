import { NextResponse } from 'next/server';
import { getAllSignals } from '@/lib/signal-service';

export async function GET() {
  try {
    const signals = await getAllSignals();
    return NextResponse.json({ success: true, data: signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
