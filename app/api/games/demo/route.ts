import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const demoGame = gameStore.addDemoGame();
    return NextResponse.json({ success: true, message: 'Demo game added', game: demoGame });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add demo game' }, { status: 500 });
  }
}
