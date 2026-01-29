import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const count = gameStore.clearFinishedGames();
    return NextResponse.json({ success: true, message: `${count} finished games cleared`, cleared: count });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to clear games' }, { status: 500 });
  }
}
