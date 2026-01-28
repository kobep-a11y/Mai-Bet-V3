import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { LiveGame } from '@/types';

function mapN8NFields(data: Record<string, unknown>): LiveGame {
  const eventId = String(data['Event ID'] || data['event_id'] || '');
  const homeTeam = String(data['Home Team'] || data['home_team'] || '');
  const awayTeam = String(data['Away Team'] || data['away_team'] || '');
  const homeTeamId = String(data['Home Team ID'] || data['Home team ID'] || '');
  const awayTeamId = String(data['Away Team ID'] || '');
  const homeScore = Number(data['Home Score ( API )'] || data['Home Score'] || 0);
  const awayScore = Number(data['Away Score ( API )'] || data['Away Score'] || 0);
  const q1Home = Number(data['Quarter 1 Home'] || 0);
  const q1Away = Number(data['Quarter 1 Away'] || 0);
  const q2Home = Number(data['Quarter 2 Home'] || 0);
  const q2Away = Number(data['Quarter 2 Away'] || 0);
  const q3Home = Number(data['Quarter 3 Home'] || 0);
  const q3Away = Number(data['Quarter 3 Away'] || 0);
  const q4Home = Number(data['Quarter 4 Home'] || 0);
  const q4Away = Number(data['Quarter 4 Away'] || 0);
  const halftimeHome = Number(data['Halftime Score Home'] || 0);
  const halftimeAway = Number(data['Halftime Score Away'] || 0);
  const finalHome = Number(data['Final Home'] || homeScore);
  const finalAway = Number(data['Final Away'] || awayScore);
  const quarter = Number(data['Quarter'] || 1);
  const timeMinutes = Number(data['Time Minutes ( API )'] || data['Time Minutes'] || 0);
  const timeSeconds = Number(data['Time Seconds ( API )'] || data['Time Seconds'] || 0);
  const timeRemaining = `${timeMinutes}:${String(timeSeconds).padStart(2, '0')}`;

  let status: LiveGame['status'] = 'live';
  if (quarter === 0) status = 'scheduled';
  else if (quarter === 2 && timeMinutes === 0 && timeSeconds === 0) status = 'halftime';
  else if (quarter >= 4 && timeMinutes === 0 && timeSeconds === 0) status = 'final';
  else if (quarter === 5) status = 'final';

  return {
    id: eventId, eventId, league: String(data['League'] || 'NBA2K'),
    homeTeam, awayTeam, homeTeamId, awayTeamId, homeScore, awayScore, quarter, timeRemaining, status,
    quarterScores: { q1Home, q1Away, q2Home, q2Away, q3Home, q3Away, q4Home, q4Away },
    halftimeScores: { home: halftimeHome, away: halftimeAway },
    finalScores: { home: finalHome, away: finalAway },
    spread: Number(data['Spread'] || -3.5), mlHome: Number(data['ML Home'] || -150),
    mlAway: Number(data['ML Away'] || 130), total: Number(data['Total'] || 185.5),
    lastUpdate: new Date().toISOString(), rawData: data,
  };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const gameData = mapN8NFields(data);
    if (!gameData.id) return NextResponse.json({ success: false, error: 'Missing event_id' }, { status: 400 });
    gameStore.updateGame(gameData.id, gameData);
    console.log(`Game updated: ${gameData.id} - ${gameData.homeTeam} vs ${gameData.awayTeam}`);
    return NextResponse.json({ success: true, message: 'Game updated', gameId: gameData.id, game: gameData });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const games = Array.isArray(data) ? data : [data];
    const results = games.map(game => {
      const gameData = mapN8NFields(game);
      if (gameData.id) { gameStore.updateGame(gameData.id, gameData); return { id: gameData.id, success: true }; }
      return { success: false, error: 'Missing event_id' };
    });
    return NextResponse.json({ success: true, message: `${results.length} games updated`, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET() {
  const games = gameStore.getAllGames();
  return NextResponse.json({ success: true, count: games.length, games });
}
