// MAI Bets V3 - Airtable Integration Layer
import Airtable from 'airtable';
import type {
  Strategy,
  StrategyTrigger,
  Signal,
  HistoricalGame,
  AirtableStrategyFields,
  AirtableTriggerFields,
  AirtableSignalFields,
  AirtableHistoricalGameFields,
} from '@/types';

const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID || '');

const TABLES = {
  STRATEGIES: 'Strategies',
  TRIGGERS: 'Triggers',
  SIGNALS: 'Signals',
  HISTORICAL_GAMES: 'Historical Games',
};

export async function getStrategies(): Promise<Strategy[]> {
  try {
    const records = await base(TABLES.STRATEGIES)
      .select({ filterByFormula: '{Is Active} = TRUE()' })
      .all();

    const strategies: Strategy[] = [];

    for (const record of records) {
      const fields = record.fields as unknown as AirtableStrategyFields;
      const triggers = await getTriggersByStrategy(record.id);

      strategies.push({
        id: record.id,
        name: fields.Name || '',
        description: fields.Description || '',
        trigger_mode: fields['Trigger Mode'] || 'sequential',
        is_active: fields['Is Active'] ?? true,
        triggers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return strategies;
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return [];
  }
}

export async function getStrategyById(id: string): Promise<Strategy | null> {
  try {
    const record = await base(TABLES.STRATEGIES).find(id);
    const fields = record.fields as unknown as AirtableStrategyFields;
    const triggers = await getTriggersByStrategy(id);

    return {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      trigger_mode: fields['Trigger Mode'] || 'sequential',
      is_active: fields['Is Active'] ?? true,
      triggers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return null;
  }
}

export async function getTriggersByStrategy(strategyId: string): Promise<StrategyTrigger[]> {
  try {
    const records = await base(TABLES.TRIGGERS)
      .select({
        filterByFormula: `FIND("${strategyId}", ARRAYJOIN({Strategy ID}))`,
        sort: [{ field: 'Order Index', direction: 'asc' }],
      })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableTriggerFields;
      return {
        id: record.id,
        strategy_id: strategyId,
        name: fields.Name || '',
        order_index: fields['Order Index'] || 0,
        entry_conditions: parseConditions(fields['Entry Conditions']),
        close_conditions: parseConditions(fields['Close Conditions']),
        win_requirement: fields['Win Requirement'] || 'team_wins',
        is_active: fields['Is Active'] ?? true,
      };
    });
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return [];
  }
}

function parseConditions(jsonString: string | undefined): any[] {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
}

export async function createSignal(signal: Omit<Signal, 'id' | 'created_at' | 'updated_at'>): Promise<Signal | null> {
  try {
    const record = await base(TABLES.SIGNALS).create({
      'Game ID': signal.game_id,
      'Strategy ID': [signal.strategy_id],
      'Trigger ID': [signal.trigger_id],
      Team: signal.team,
      'Entry Quarter': signal.entry_quarter,
      'Entry Lead': signal.entry_lead,
      'Entry Spread': signal.entry_spread,
      'Entry Moneyline': signal.entry_moneyline,
      'Entry Time': signal.entry_time,
      Status: signal.status,
      'Discord Sent': signal.discord_sent,
      'SMS Sent': signal.sms_sent,
    });

    return {
      id: record.id,
      ...signal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating signal:', error);
    return null;
  }
}

export async function updateSignal(id: string, updates: Partial<Signal>): Promise<boolean> {
  try {
    const fields: Record<string, any> = {};
    if (updates.status) fields['Status'] = updates.status;
    if (updates.result) fields['Result'] = updates.result;
    if (updates.close_quarter) fields['Close Quarter'] = updates.close_quarter;
    if (updates.close_lead) fields['Close Lead'] = updates.close_lead;
    if (updates.close_time) fields['Close Time'] = updates.close_time;
    if (updates.discord_sent !== undefined) fields['Discord Sent'] = updates.discord_sent;
    if (updates.sms_sent !== undefined) fields['SMS Sent'] = updates.sms_sent;
    if (updates.notes) fields['Notes'] = updates.notes;

    await base(TABLES.SIGNALS).update(id, fields);
    return true;
  } catch (error) {
    console.error('Error updating signal:', error);
    return false;
  }
}

export async function getActiveSignals(): Promise<Signal[]> {
  try {
    const records = await base(TABLES.SIGNALS)
      .select({ filterByFormula: `OR({Status} = "pending", {Status} = "active")` })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableSignalFields;
      return {
        id: record.id,
        game_id: fields['Game ID'] || '',
        strategy_id: fields['Strategy ID']?.[0] || '',
        trigger_id: fields['Trigger ID']?.[0] || '',
        team: fields.Team || 'home',
        entry_quarter: fields['Entry Quarter'] || 0,
        entry_lead: fields['Entry Lead'] || 0,
        entry_spread: fields['Entry Spread'] || 0,
        entry_moneyline: fields['Entry Moneyline'] || 0,
        entry_time: fields['Entry Time'] || '',
        close_quarter: fields['Close Quarter'],
        close_lead: fields['Close Lead'],
        close_time: fields['Close Time'],
        status: fields.Status || 'pending',
        result: fields.Result,
        notes: fields.Notes,
        discord_sent: fields['Discord Sent'] || false,
        sms_sent: fields['SMS Sent'] || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching active signals:', error);
    return [];
  }
}

export async function getSignalsByDate(startDate: string, endDate: string): Promise<Signal[]> {
  try {
    const records = await base(TABLES.SIGNALS)
      .select({
        filterByFormula: `AND(IS_AFTER({Entry Time}, "${startDate}"), IS_BEFORE({Entry Time}, "${endDate}"))`,
        sort: [{ field: 'Entry Time', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableSignalFields;
      return {
        id: record.id,
        game_id: fields['Game ID'] || '',
        strategy_id: fields['Strategy ID']?.[0] || '',
        trigger_id: fields['Trigger ID']?.[0] || '',
        team: fields.Team || 'home',
        entry_quarter: fields['Entry Quarter'] || 0,
        entry_lead: fields['Entry Lead'] || 0,
        entry_spread: fields['Entry Spread'] || 0,
        entry_moneyline: fields['Entry Moneyline'] || 0,
        entry_time: fields['Entry Time'] || '',
        close_quarter: fields['Close Quarter'],
        close_lead: fields['Close Lead'],
        close_time: fields['Close Time'],
        status: fields.Status || 'pending',
        result: fields.Result,
        notes: fields.Notes,
        discord_sent: fields['Discord Sent'] || false,
        sms_sent: fields['SMS Sent'] || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching signals by date:', error);
    return [];
  }
}

export async function saveHistoricalGame(game: Omit<HistoricalGame, 'id' | 'created_at'>): Promise<boolean> {
  try {
    await base(TABLES.HISTORICAL_GAMES).create({
      'Event ID': game.event_id,
      League: game.league,
      'Home Team': game.home_team,
      'Away Team': game.away_team,
      'Final Home Score': game.final_home_score,
      'Final Away Score': game.final_away_score,
      'Halftime Home Score': game.halftime_home_score,
      'Halftime Away Score': game.halftime_away_score,
      'Opening Spread Home': game.opening_spread_home,
      'Opening ML Home': game.opening_moneyline_home,
      'Opening ML Away': game.opening_moneyline_away,
      'Opening Total': game.opening_total,
      'Game Date': game.game_date,
    });
    return true;
  } catch (error) {
    console.error('Error saving historical game:', error);
    return false;
  }
}

export async function getHistoricalGames(limit: number = 100): Promise<HistoricalGame[]> {
  try {
    const records = await base(TABLES.HISTORICAL_GAMES)
      .select({ maxRecords: limit, sort: [{ field: 'Game Date', direction: 'desc' }] })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableHistoricalGameFields;
      return {
        id: record.id,
        event_id: fields['Event ID'] || '',
        league: fields.League || '',
        home_team: fields['Home Team'] || '',
        away_team: fields['Away Team'] || '',
        final_home_score: fields['Final Home Score'] || 0,
        final_away_score: fields['Final Away Score'] || 0,
        halftime_home_score: fields['Halftime Home Score'] || 0,
        halftime_away_score: fields['Halftime Away Score'] || 0,
        opening_spread_home: fields['Opening Spread Home'] || 0,
        opening_moneyline_home: fields['Opening ML Home'] || 0,
        opening_moneyline_away: fields['Opening ML Away'] || 0,
        opening_total: fields['Opening Total'] || 0,
        game_date: fields['Game Date'] || '',
        created_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching historical games:', error);
    return [];
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await base(TABLES.STRATEGIES).select({ maxRecords: 1 }).firstPage();
    return true;
  } catch (error) {
    console.error('Airtable connection test failed:', error);
    return false;
  }
}
