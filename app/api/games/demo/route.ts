import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';

export async function POST() {
  try {
    const demoGame = gameStore.addDemoGame();
    return NextResponse.json({
      success: true,
      message: 'Demo game added',
      game: demoGame,
    });
  } catch (error) {
    console.error('Error adding demo game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add demo game' },
      { status: 500 }
    );
  }
}
