import { NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';


// Airtable REST API configuration
// Using REST API instead of SDK to avoid AbortSignal bug on Vercel serverless
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AnalyticsSummary {
  totalSignals: number;
  wonSignals: number;
  lostSignals: number;
  pushedSignals: number;
  expiredSignals: number;
  activeSignals: number;
  winRate: number;
  roi: number;
  totalGamesTracked: number;
  strategyPerformance: Array<{
    strategyId: string;
    strategyName: string;
    signals: number;
    won: number;
    lost: number;
    pushed: number;
    winRate: number;
    roi: number;
  }>;
  recentSignals: Array<{
    id: string;
    strategyName: string;
    matchup: string;
    status: string;
    result: string | null;
    entryTime: string;
  }>;
  signalsByDay: Array<{
    date: string;
    total: number;
    won: number;
    lost: number;
  }>;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Fetch all records from a table with pagination support
 */
async function fetchAllRecords(tableName: string, params: URLSearchParams = new URLSearchParams()): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const queryParams = new URLSearchParams(params);
    if (offset) {
      queryParams.set('offset', offset);
    }

    const response = await airtableRequest(tableName, `?${queryParams.toString()}`);

    if (!response.ok) {
      console.error(`Failed to fetch ${tableName}:`, response.status, response.statusText);
      break;
    }

    const data = await response.json();
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

/**
 * GET - Fetch analytics summary
 */
export async function GET() {
  try {
    // Verify credentials
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { success: false, error: 'Missing Airtable credentials' },
        { status: 500 }
      );
    }

    // Fetch all signals with sorting
    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Entry Time');
    params.append('sort[0][direction]', 'desc');

    const signalRecords = await fetchAllRecords('Signals', params);

    // Count by status
    let wonSignals = 0;
    let lostSignals = 0;
    let pushedSignals = 0;
    let expiredSignals = 0;
    let activeSignals = 0;

    // Strategy performance tracking
    const strategyStats: Map<string, {
      strategyId: string;
      strategyName: string;
      signals: number;
      won: number;
      lost: number;
      pushed: number;
    }> = new Map();

    // Signals by day
    const dayStats: Map<string, { total: number; won: number; lost: number }> = new Map();

    // Recent signals for display
    const recentSignals: AnalyticsSummary['recentSignals'] = [];

    for (const record of signalRecords) {
      const fields = record.fields;
      const status = fields['Status'] as string;
      const strategyId = Array.isArray(fields['Strategy'])
        ? (fields['Strategy'] as string[])[0]
        : (fields['Strategy'] as string) || 'unknown';
      const strategyName = (fields['Strategy Name'] as string) || 'Unknown Strategy';
      const entryTime = (fields['Entry Time'] as string) || '';

      // Count by status
      switch (status) {
        case 'won':
          wonSignals++;
          break;
        case 'lost':
          lostSignals++;
          break;
        case 'pushed':
          pushedSignals++;
          break;
        case 'expired':
          expiredSignals++;
          break;
        case 'monitoring':
        case 'watching':
        case 'bet_taken':
          activeSignals++;
          break;
      }

      // Strategy stats
      if (!strategyStats.has(strategyId)) {
        strategyStats.set(strategyId, {
          strategyId,
          strategyName,
          signals: 0,
          won: 0,
          lost: 0,
          pushed: 0,
        });
      }
      const stratStat = strategyStats.get(strategyId)!;
      stratStat.signals++;
      if (status === 'won') stratStat.won++;
      if (status === 'lost') stratStat.lost++;
      if (status === 'pushed') stratStat.pushed++;

      // Day stats
      if (entryTime) {
        const date = entryTime.split('T')[0];
        if (!dayStats.has(date)) {
          dayStats.set(date, { total: 0, won: 0, lost: 0 });
        }
        const dayStat = dayStats.get(date)!;
        dayStat.total++;
        if (status === 'won') dayStat.won++;
        if (status === 'lost') dayStat.lost++;
      }

      // Recent signals (first 20)
      if (recentSignals.length < 20) {
        recentSignals.push({
          id: record.id,
          strategyName,
          matchup: `${fields['Away Team'] || ''} @ ${fields['Home Team'] || ''}`,
          status,
          result: (fields['Result'] as string) || null,
          entryTime,
        });
      }
    }

    // Calculate overall metrics
    const totalSignals = signalRecords.length;
    const completedBets = wonSignals + lostSignals; // Exclude pushes from W/L calc
    const winRate = completedBets > 0 ? (wonSignals / completedBets) * 100 : 0;

    // ROI calculation: (wins * 0.91 - losses) / total bets * 100 (assumes -110 juice)
    const roi = completedBets > 0
      ? ((wonSignals * 0.91 - lostSignals) / completedBets) * 100
      : 0;

    // Calculate per-strategy performance
    const strategyPerformance = Array.from(strategyStats.values())
      .map(stat => {
        const completed = stat.won + stat.lost;
        return {
          ...stat,
          winRate: completed > 0 ? (stat.won / completed) * 100 : 0,
          roi: completed > 0 ? ((stat.won * 0.91 - stat.lost) / completed) * 100 : 0,
        };
      })
      .sort((a, b) => b.signals - a.signals);

    // Format day stats for chart
    const signalsByDay = Array.from(dayStats.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    // Get historical games count
    let totalGamesTracked = 0;
    try {
      const gameParams = new URLSearchParams();
      gameParams.append('fields[]', 'Name'); // Just need to count records
      const gameRecords = await fetchAllRecords('Historical Games', gameParams);
      totalGamesTracked = gameRecords.length;
    } catch {
      // Table might not exist or be empty
    }

    const summary: AnalyticsSummary = {
      totalSignals,
      wonSignals,
      lostSignals,
      pushedSignals,
      expiredSignals,
      activeSignals,
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      totalGamesTracked,
      strategyPerformance,
      recentSignals,
      signalsByDay,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching analytics data' },
      { status: 500 }
    );
  }
}
