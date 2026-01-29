import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


/**
 * GET - View raw webhook data from current games
 * This shows exactly what fields are being sent by the webhook
 */
export async function GET() {
  const games = gameStore.getAllGames();

  if (games.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No games currently in store. Wait for webhook data to come in.',
      games: [],
    });
  }

  // Analyze the raw data from the first game
  const firstGame = games[0];
  const rawData = (firstGame as unknown as { rawData?: Record<string, unknown> }).rawData || {};

  // Categorize all fields
  const analysis = {
    totalFields: Object.keys(rawData).length,
    allFieldNames: Object.keys(rawData),

    // Find odds-related fields
    oddsFields: Object.entries(rawData).filter(([k]) => {
      const lower = k.toLowerCase();
      return lower.includes('spread') || lower.includes('line') ||
             lower.includes('ml') || lower.includes('money') ||
             lower.includes('total') || lower.includes('odds') ||
             lower.includes('over') || lower.includes('under') ||
             lower.includes('juice') || lower.includes('vig');
    }),

    // Find time-related fields
    timeFields: Object.entries(rawData).filter(([k]) => {
      const lower = k.toLowerCase();
      return lower.includes('time') || lower.includes('minute') ||
             lower.includes('second') || lower.includes('clock') ||
             lower.includes('quarter') || lower.includes('period');
    }),

    // Find score-related fields
    scoreFields: Object.entries(rawData).filter(([k]) => {
      const lower = k.toLowerCase();
      return lower.includes('score') || lower.includes('point') ||
             lower.includes('q1') || lower.includes('q2') ||
             lower.includes('q3') || lower.includes('q4') ||
             lower.includes('quarter');
    }),

    // Fields that might be nested objects or arrays
    complexFields: Object.entries(rawData).filter(([, v]) =>
      typeof v === 'object' && v !== null
    ),
  };

  // Check what the current mapped values are vs raw
  const currentMappedValues = {
    spread: firstGame.spread,
    mlHome: firstGame.mlHome,
    mlAway: firstGame.mlAway,
    total: firstGame.total,
    timeRemaining: firstGame.timeRemaining,
    quarter: firstGame.quarter,
  };

  return NextResponse.json({
    success: true,
    message: 'Raw webhook data analysis',
    gamesInStore: games.length,
    analysis,
    currentMappedValues,
    recommendation: analysis.oddsFields.length === 0
      ? '⚠️ NO ODDS FIELDS DETECTED! The webhook may not be sending odds data, or it uses unexpected field names.'
      : `Found ${analysis.oddsFields.length} potential odds field(s): ${analysis.oddsFields.map(([k]) => k).join(', ')}`,
    fullRawData: rawData,
  });
}
