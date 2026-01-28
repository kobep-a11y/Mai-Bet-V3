import Airtable from 'airtable';
import { Signal, ActiveSignal, TriggerEvaluationResult, LiveGame, AirtableSignalFields } from '@/types';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// In-memory store for active signals (to prevent duplicate signals)
class SignalStore {
  private activeSignals: Map<string, ActiveSignal> = new Map();

  // Key format: strategyId-gameId
  private getKey(strategyId: string, gameId: string): string {
    return `${strategyId}-${gameId}`;
  }

  hasActiveSignal(strategyId: string, gameId: string): boolean {
    return this.activeSignals.has(this.getKey(strategyId, gameId));
  }

  addActiveSignal(signal: ActiveSignal): void {
    const key = this.getKey(signal.strategyId, signal.gameId);
    this.activeSignals.set(key, signal);
  }

  getActiveSignal(strategyId: string, gameId: string): ActiveSignal | undefined {
    return this.activeSignals.get(this.getKey(strategyId, gameId));
  }

  markForClose(strategyId: string, gameId: string): void {
    const signal = this.getActiveSignal(strategyId, gameId);
    if (signal) {
      signal.awaitingClose = true;
    }
  }

  removeActiveSignal(strategyId: string, gameId: string): void {
    this.activeSignals.delete(this.getKey(strategyId, gameId));
  }

  getAllActiveSignals(): ActiveSignal[] {
    return Array.from(this.activeSignals.values());
  }

  getActiveSignalsForGame(gameId: string): ActiveSignal[] {
    return this.getAllActiveSignals().filter((s) => s.gameId === gameId);
  }

  clearSignalsForGame(gameId: string): void {
    for (const [key, signal] of this.activeSignals.entries()) {
      if (signal.gameId === gameId) {
        this.activeSignals.delete(key);
      }
    }
  }
}

export const signalStore = new SignalStore();

/**
 * Creates a signal in Airtable when a trigger fires
 */
export async function createSignal(result: TriggerEvaluationResult): Promise<Signal | null> {
  const { strategy, trigger, game } = result;

  // Check if we already have a signal for this strategy/game
  if (signalStore.hasActiveSignal(strategy.id, game.id)) {
    console.log(`Signal already exists for ${strategy.name} on game ${game.id}`);
    return null;
  }

  try {
    const now = new Date().toISOString();

    // Create the signal in Airtable
    const record = await base('Signals').create({
      Name: `${strategy.name} - ${game.awayTeam} @ ${game.homeTeam}`,
      Strategy: [strategy.id],
      'Strategy Name': strategy.name,
      'Trigger ID': trigger.id,
      'Trigger Name': trigger.name,
      'Game ID': game.id,
      'Event ID': game.eventId,
      'Home Team': game.homeTeam,
      'Away Team': game.awayTeam,
      'Home Score': game.homeScore,
      'Away Score': game.awayScore,
      Quarter: game.quarter,
      'Time Remaining': game.timeRemaining,
      'Entry Time': now,
      'Entry Spread': game.spread,
      'Entry Total': game.total,
      Status: 'active',
      Notes: `Trigger: ${trigger.name} fired at Q${game.quarter} ${game.timeRemaining}`,
    } as Partial<AirtableSignalFields>);

    const signal: Signal = {
      id: record.id,
      strategyId: strategy.id,
      strategyName: strategy.name,
      triggerId: trigger.id,
      triggerName: trigger.name,
      gameId: game.id,
      eventId: game.eventId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      quarter: game.quarter,
      timeRemaining: game.timeRemaining,
      entryTime: now,
      entrySpread: game.spread,
      entryTotal: game.total,
      status: 'active',
      createdAt: now,
    };

    // Track as active signal
    signalStore.addActiveSignal({
      signalId: record.id,
      strategyId: strategy.id,
      gameId: game.id,
      triggeredAt: now,
      awaitingClose: false,
    });

    console.log(`✅ Signal created: ${signal.strategyName} for ${signal.awayTeam} @ ${signal.homeTeam}`);
    return signal;
  } catch (error) {
    console.error('Error creating signal in Airtable:', error);
    return null;
  }
}

/**
 * Closes a signal when close trigger fires or game ends
 */
export async function closeSignal(
  strategyId: string,
  gameId: string,
  game: LiveGame,
  result?: 'win' | 'loss' | 'push'
): Promise<boolean> {
  const activeSignal = signalStore.getActiveSignal(strategyId, gameId);
  if (!activeSignal) {
    console.log(`No active signal found for strategy ${strategyId} game ${gameId}`);
    return false;
  }

  try {
    const now = new Date().toISOString();

    // Update the signal in Airtable
    await base('Signals').update(activeSignal.signalId, {
      'Close Time': now,
      'Close Spread': game.spread,
      'Close Total': game.total,
      'Final Home Score': game.homeScore,
      'Final Away Score': game.awayScore,
      Status: result ? (result === 'win' ? 'won' : result === 'loss' ? 'lost' : 'pushed') : 'closed',
      Result: result,
      Notes: `Closed at Q${game.quarter} ${game.timeRemaining}. Final: ${game.awayScore}-${game.homeScore}`,
    } as Partial<AirtableSignalFields>);

    // Remove from active signals
    signalStore.removeActiveSignal(strategyId, gameId);

    console.log(`✅ Signal closed for strategy ${strategyId} game ${gameId}`);
    return true;
  } catch (error) {
    console.error('Error closing signal in Airtable:', error);
    return false;
  }
}

/**
 * Auto-close all signals for a game when it ends
 */
export async function closeAllSignalsForGame(game: LiveGame): Promise<number> {
  const activeSignals = signalStore.getActiveSignalsForGame(game.id);
  let closed = 0;

  for (const signal of activeSignals) {
    const success = await closeSignal(signal.strategyId, game.id, game);
    if (success) closed++;
  }

  return closed;
}

/**
 * Get all signals from Airtable
 */
export async function getAllSignals(): Promise<Signal[]> {
  try {
    const records = await base('Signals')
      .select({
        sort: [{ field: 'Entry Time', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableSignalFields;
      return {
        id: record.id,
        strategyId: Array.isArray(fields.Strategy) ? fields.Strategy[0] : '',
        strategyName: fields['Strategy Name'] || 'Unknown',
        triggerId: fields['Trigger ID'] || '',
        triggerName: fields['Trigger Name'] || 'Unknown',
        gameId: fields['Game ID'] || '',
        eventId: fields['Event ID'] || '',
        homeTeam: fields['Home Team'] || '',
        awayTeam: fields['Away Team'] || '',
        homeScore: fields['Home Score'] || 0,
        awayScore: fields['Away Score'] || 0,
        quarter: fields.Quarter || 0,
        timeRemaining: fields['Time Remaining'] || '',
        entryTime: fields['Entry Time'] || '',
        closeTime: fields['Close Time'],
        entrySpread: fields['Entry Spread'],
        entryTotal: fields['Entry Total'],
        closeSpread: fields['Close Spread'],
        closeTotal: fields['Close Total'],
        finalHomeScore: fields['Final Home Score'],
        finalAwayScore: fields['Final Away Score'],
        status: fields.Status || 'active',
        result: fields.Result,
        profitLoss: fields['Profit Loss'],
        notes: fields.Notes,
        createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || '',
      };
    });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return [];
  }
}
