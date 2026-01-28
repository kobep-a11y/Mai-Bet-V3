import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/game-store';
import { LiveGame } from '@/types';

// Map N8N field names to our internal structure
function mapN8NFields(data: Record<string, unknown>): LiveGame {
  // Core identifiers
  const eventId = String(data['Event ID'] || data['event_id'] || data['eventId'] || '');
  const homeTeam = String(data['Home Team'] || data['home_team'] || '');
  const awayTeam = String(data['Away Team'] || data['away_team'] || '');
  const homeTeamId = String(data['Home Team ID'] || data['Home team ID'] || data['home_team_id'] || '');
  const awayTeamId = String(data['Away Team ID'] || data['away_team_id'] || '');

  // Current scores
  const homeScore = Number(data['Home Score ( API )'] || data['Home Score'] || data['home_score'] || 0);
  const awayScore = Number(data['Away Score ( API )'] || data['Away Score'] || data['away_score'] || 0);

  // Quarter scores
  const q1Home = Number(data['Quarter 1 Home'] || data['q1_home'] || 0);
  const q1Away = Number(data['Quarter 1 Away'] || data['q1_away'] || 0);
  const q2Home = Number(data['Quarter 2 Home'] || data['q2_home'] || 0);
  const q2Away = Number(data['Quarter 2 Away'] || data['q2_away'] || 0);
  const q3Home = Number(data['Quarter 3 Home'] || data['q3_home'] || 0);
  const q3Away = Number(data['Quarter 3 Away'] || data['q3_away'] || 0);
  const q4Home = Number(data['Quarter 4 Home'] || data['q4_home'] || 0);
  const q4Away = Number(data['Quarter 4 Away'] || data['q4_away'] || 0);

  // Halftime scores
  const halftimeHome = Number(data['Halftime Score Home'] || data['halftime_home'] || 0);
  const halftimeAway = Number(data['Halftime Score Away'] || data['halftime_away'] || 0);

  // Final scores
  const finalHome = Number(data['Final Home'] || data['final_home'] || homeScore);
  const finalAway = Number(data['Final Away'] || data['final_away'] || awayScore);

  // Game state
  const quarter = Number(data['Quarter'] || data['quarter'] || 1);
  const timeMinutes = Number(data['Time Minutes ( API )'] || data['Time Minutes'] || data['time_minutes'] || 0);
  const timeSeconds = Number(data['Time Seconds ( API )'] || data['Time Seconds'] || data['time_seconds'] || 0);
  const timeRemaining = `${timeMinutes}:${String(timeSeconds).padStart(2, '0')}`;

  // Determine status based on quarter
  let status: LiveGame['status'] = 'live';
  if (quarter === 0) status = 'scheduled';
  else if (quarter === 2 && timeMinutes === 0 && timeSeconds === 0) status = 'halftime';
  else if (quarter >= 4 && timeMinutes === 0 && timeSeconds === 0) status = 'final';
  else if (quarter === 5) status = 'final'; // OT finished indicator

  // Betting lines (defaults if not provided)
  const spread = Number(data['Spread'] || data['spread'] || -3.5);
  const mlHome = Number(data['ML Home'] || data['ml_home'] || -150);
  const mlAway = Number(data['ML Away'] || data['ml_away'] || 130);
  const total = Number(data['Total'] || data['total'] || 185.5);

  const league = String(data['League'] || data['league'] || 'NBA2K');

  return {
    id: eventId,
    eventId: eventId,
    league,
    homeTeam,
    awayTeam,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    quarter,
    timeRemaining,
    status,
    quarterScores: {
      q1Home,
      q1Away,
      q2Home,
      q2Away,
      q3Home,
      q3Away,
      q4Home,
      q4Away,
    },
    halftimeScores: {
      home: halftimeHome,
      away: halftimeAway,
    },
    finalScores: {
      home: finalHome,
      away: finalAway,
    },
    spread,
    mlHome,
    mlAway,
    total,
    lastUpdate: new Date().toISOString(),
    rawData: data,
  };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const gameData = mapN8NFields(data);

    if (!gameData.id) {
      return NextResponse.json(
        { success: false, error: 'Missing event_id' },
        { status: 400 }
      );
    }

    // Store the game
    gameStore.updateGame(gameData.id, gameData);

    console.log(`Game updated: ${gameData.id} - ${gameData.homeTeam} vs ${gameData.awayTeam} | Q${gameData.quarter} ${gameData.timeRemaining} | ${gameData.homeScore}-${gameData.awayScore}`);

    return NextResponse.json({
      success: true,
      message: 'Game updated',
      gameId: gameData.id,
      game: gameData
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const games = Array.isArray(data) ? data : [data];

    const results = games.map(game => {
      const gameData = mapN8NFields(game);
      if (gameData.id) {
        gameStore.updateGame(gameData.id, gameData);
        return { id: gameData.id, success: true };
      }
      return { success: false, error: 'Missing event_id' };
    });

    return NextResponse.json({
      success: true,
      message: `${results.length} games updated`,
      results
    });
  } catch (error) {
    console.error('Batch webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  const games = gameStore.getAllGames();
  return NextResponse.json({
    success: true,
    count: games.length,
    games
  });
}
