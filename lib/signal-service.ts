import Airtable from 'airtable';
import {
  Signal,
  SignalStatus,
  ActiveSignal,
  TriggerEvaluationResult,
  LiveGame,
  AirtableSignalFields,
  Strategy,
  OddsRequirement,
} from '@/types';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// Expiry time for all strategies: 2:20 left in Q4
const EXPIRY_TIME_SECONDS = 2 * 60 + 20; // 2:20 = 140 seconds

/**
 * Parse time string (e.g., "2:20") to seconds
 */
function parseTimeToSeconds(time: string): number {
  const parts = time.split(':');
  return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
}

/**
 * Check if game has passed the expiry time (2:20 Q4)
 */
function isPastExpiryTime(game: LiveGame): boolean {
  if (game.quarter < 4) return false;
  if (game.quarter > 4) return true; // OT means expired

  const timeRemaining = parseTimeToSeconds(game.timeRemaining);
  return timeRemaining < EXPIRY_TIME_SECONDS;
}

/**
 * Get the leading team's spread from the game
 * If home is leading, we want the home spread
 * If away is leading, we want the away spread (which is -spread)
 */
function getLeadingTeamSpread(game: LiveGame): { team: 'home' | 'away'; spread: number } {
  const homeLeading = game.homeScore > game.awayScore;

  if (homeLeading) {
    return { team: 'home', spread: game.spread };
  } else {
    return { team: 'away', spread: -game.spread };
  }
}

/**
 * Get the actual odds value based on bet side and odds type
 */
function getActualOddsValue(
  game: LiveGame,
  requirement: OddsRequirement,
  leadingTeamAtTrigger: 'home' | 'away'
): number {
  const { type, betSide } = requirement;

  // Determine which team we're betting on
  let bettingOnHome: boolean;
  if (betSide === 'leading_team') {
    bettingOnHome = leadingTeamAtTrigger === 'home';
  } else if (betSide === 'trailing_team') {
    bettingOnHome = leadingTeamAtTrigger !== 'home';
  } else if (betSide === 'home') {
    bettingOnHome = true;
  } else {
    bettingOnHome = false;
  }

  // Get the appropriate odds value
  switch (type) {
    case 'spread':
      // Home spread is game.spread, away spread is -game.spread
      return bettingOnHome ? game.spread : -game.spread;

    case 'moneyline':
      // Home ML is mlHome, away ML is mlAway
      return bettingOnHome ? game.mlHome : game.mlAway;

    case 'total_over':
    case 'total_under':
      // Total is the same regardless of side
      return game.total;

    default:
      return 0;
  }
}

/**
 * Check if odds meet the requirement
 *
 * Logic by type:
 * - spread: actual >= value (e.g., -3.5 >= -4.5 means easier to cover)
 * - moneyline: actual >= value (e.g., -140 >= -150 means better payout)
 * - total_over: actual <= value (e.g., 205 <= 210 means easier to go over)
 * - total_under: actual >= value (e.g., 215 >= 210 means easier to stay under)
 */
function checkOddsRequirement(
  game: LiveGame,
  requirement: OddsRequirement,
  leadingTeamAtTrigger: 'home' | 'away'
): boolean {
  const actualValue = getActualOddsValue(game, requirement, leadingTeamAtTrigger);
  const { type, value } = requirement;

  switch (type) {
    case 'spread':
      // For spread, higher (less negative) is better
      // -3.5 >= -4.5 means easier to cover ✓
      return actualValue >= value;

    case 'moneyline':
      // For ML, higher is better (less negative for favorites, more positive for underdogs)
      // -140 >= -150 means better payout ✓
      // +160 >= +150 means better payout ✓
      return actualValue >= value;

    case 'total_over':
      // For over bets, lower line is better (easier to go over)
      // 205 <= 210 means easier to hit over ✓
      return actualValue <= value;

    case 'total_under':
      // For under bets, higher line is better (easier to stay under)
      // 215 >= 210 means easier to hit under ✓
      return actualValue >= value;

    default:
      console.log(`Unknown odds type: ${type}`);
      return false;
  }
}

// In-memory store for active signals
class SignalStore {
  private activeSignals: Map<string, ActiveSignal> = new Map();

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

  updateActiveSignal(strategyId: string, gameId: string, updates: Partial<ActiveSignal>): void {
    const signal = this.getActiveSignal(strategyId, gameId);
    if (signal) {
      Object.assign(signal, updates);
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

  getWatchingSignals(): ActiveSignal[] {
    return this.getAllActiveSignals().filter((s) => s.stage === 'watching');
  }

  clearSignalsForGame(gameId: string): void {
    for (const [key, signal] of Array.from(this.activeSignals.entries())) {
      if (signal.gameId === gameId) {
        this.activeSignals.delete(key);
      }
    }
  }
}

export const signalStore = new SignalStore();

/**
 * Creates a signal when entry trigger fires (Stage 1 for two-stage, or only stage for one-stage)
 */
export async function createSignal(
  result: TriggerEvaluationResult,
  strategy: Strategy
): Promise<Signal | null> {
  const { trigger, game } = result;

  // Check if we already have a signal for this strategy/game
  if (signalStore.hasActiveSignal(strategy.id, game.id)) {
    console.log(`Signal already exists for ${strategy.name} on game ${game.id}`);
    return null;
  }

  try {
    const now = new Date().toISOString();
    const leadingTeam = getLeadingTeamSpread(game);
    const isTwoStage = strategy.isTwoStage ?? (strategy.triggers.some(t => t.entryOrClose === 'close'));

    // Determine initial status
    const initialStatus: SignalStatus = isTwoStage ? 'monitoring' : 'watching';

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
      'Entry Trigger Time': now,
      'Entry Spread': game.spread,
      'Entry Total': game.total,
      'Required Spread': strategy.oddsRequirement?.value,
      'Leading Team At Trigger': leadingTeam.team,
      Status: initialStatus,
      Notes: `Entry trigger: ${trigger.name} fired at Q${game.quarter} ${game.timeRemaining}. ${isTwoStage ? 'Waiting for close trigger.' : 'Waiting for odds.'}`,
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
      entryTriggerTime: now,
      entrySpread: game.spread,
      entryTotal: game.total,
      requiredSpread: strategy.oddsRequirement?.value,
      leadingTeamAtTrigger: leadingTeam.team,
      status: initialStatus,
      createdAt: now,
    };

    // Track as active signal
    signalStore.addActiveSignal({
      signalId: record.id,
      strategyId: strategy.id,
      gameId: game.id,
      triggeredAt: now,
      awaitingClose: isTwoStage,
      stage: initialStatus,
      entryTriggerFired: true,
      closeTriggerFired: !isTwoStage, // For one-stage, close is same as entry
      leadingTeamAtTrigger: leadingTeam.team,
      requiredSpread: strategy.oddsRequirement?.value,
      oddsCheckStartTime: isTwoStage ? undefined : now,
    });

    const statusEmoji = initialStatus === 'monitoring' ? '🔵' : '🟡';
    console.log(`${statusEmoji} Signal created: ${signal.strategyName} for ${signal.awayTeam} @ ${signal.homeTeam} - Status: ${initialStatus}`);
    return signal;
  } catch (error) {
    console.error('Error creating signal in Airtable:', error);
    return null;
  }
}

/**
 * Updates signal when close trigger fires (Stage 2 for two-stage strategies)
 * This moves the signal from 'monitoring' to 'watching'
 */
export async function onCloseTriggerFired(
  strategyId: string,
  gameId: string,
  game: LiveGame
): Promise<boolean> {
  const activeSignal = signalStore.getActiveSignal(strategyId, gameId);
  if (!activeSignal) {
    console.log(`No active signal found for close trigger`);
    return false;
  }

  if (activeSignal.stage !== 'monitoring') {
    console.log(`Signal not in monitoring stage, current: ${activeSignal.stage}`);
    return false;
  }

  try {
    const now = new Date().toISOString();

    // Update Airtable
    await base('Signals').update(activeSignal.signalId, {
      Status: 'watching' as SignalStatus,
      'Close Trigger Time': now,
      Notes: `Close trigger fired at Q${game.quarter} ${game.timeRemaining}. Now watching for odds to align.`,
    } as Partial<AirtableSignalFields>);

    // Update local tracking
    signalStore.updateActiveSignal(strategyId, gameId, {
      stage: 'watching',
      closeTriggerFired: true,
      awaitingClose: false,
      oddsCheckStartTime: now,
    });

    console.log(`🟡 Signal moved to watching: Strategy ${strategyId} game ${gameId}`);
    return true;
  } catch (error) {
    console.error('Error updating signal on close trigger:', error);
    return false;
  }
}

/**
 * Check all watching signals for odds alignment
 * Called periodically when game data updates
 */
export async function checkWatchingSignalsForOdds(
  game: LiveGame,
  strategies: Strategy[]
): Promise<Signal[]> {
  const watchingSignals = signalStore.getActiveSignalsForGame(game.id).filter(
    (s) => s.stage === 'watching'
  );

  const betsAvailable: Signal[] = [];

  for (const activeSignal of watchingSignals) {
    // Check if past expiry time
    if (isPastExpiryTime(game)) {
      await expireSignal(activeSignal.strategyId, game.id, game);
      continue;
    }

    // Find the strategy
    const strategy = strategies.find((s) => s.id === activeSignal.strategyId);
    if (!strategy || !strategy.oddsRequirement) {
      continue;
    }

    // Check if odds meet requirement
    const oddsAligned = checkOddsRequirement(
      game,
      strategy.oddsRequirement,
      activeSignal.leadingTeamAtTrigger!
    );

    if (oddsAligned) {
      const signal = await markBetTaken(activeSignal.strategyId, game.id, game, strategy);
      if (signal) {
        betsAvailable.push(signal);
      }
    }
  }

  return betsAvailable;
}

/**
 * Mark signal as bet_taken when odds align
 */
export async function markBetTaken(
  strategyId: string,
  gameId: string,
  game: LiveGame,
  strategy: Strategy
): Promise<Signal | null> {
  const activeSignal = signalStore.getActiveSignal(strategyId, gameId);
  if (!activeSignal) {
    return null;
  }

  try {
    const now = new Date().toISOString();
    const leadingSpread = getLeadingTeamSpread(game);

    // Update Airtable
    await base('Signals').update(activeSignal.signalId, {
      Status: 'bet_taken' as SignalStatus,
      'Odds Aligned Time': now,
      'Actual Spread At Entry': leadingSpread.spread,
      'Leading Team Spread': leadingSpread.spread,
      Notes: `✅ BET AVAILABLE at Q${game.quarter} ${game.timeRemaining}. Spread: ${leadingSpread.spread} (required: ${strategy.oddsRequirement?.value})`,
    } as Partial<AirtableSignalFields>);

    // Remove from active tracking (bet is taken)
    signalStore.removeActiveSignal(strategyId, gameId);

    console.log(`🟢 BET TAKEN: ${strategy.name} - Spread ${leadingSpread.spread} for ${game.awayTeam} @ ${game.homeTeam}`);

    return {
      id: activeSignal.signalId,
      strategyId,
      strategyName: strategy.name,
      gameId,
      status: 'bet_taken',
      actualSpreadAtEntry: leadingSpread.spread,
    } as Signal;
  } catch (error) {
    console.error('Error marking bet taken:', error);
    return null;
  }
}

/**
 * Expire signal when odds never aligned before 2:20 Q4
 */
export async function expireSignal(
  strategyId: string,
  gameId: string,
  game: LiveGame
): Promise<boolean> {
  const activeSignal = signalStore.getActiveSignal(strategyId, gameId);
  if (!activeSignal) {
    return false;
  }

  try {
    const now = new Date().toISOString();

    // Update Airtable
    await base('Signals').update(activeSignal.signalId, {
      Status: 'expired' as SignalStatus,
      'Expiry Time': now,
      Notes: `🔴 EXPIRED at Q${game.quarter} ${game.timeRemaining}. Odds never aligned. Required spread: ${activeSignal.requiredSpread}`,
    } as Partial<AirtableSignalFields>);

    // Remove from active tracking
    signalStore.removeActiveSignal(strategyId, gameId);

    console.log(`🔴 Signal EXPIRED: Strategy ${strategyId} game ${gameId} - odds never aligned`);
    return true;
  } catch (error) {
    console.error('Error expiring signal:', error);
    return false;
  }
}

/**
 * Closes a signal when game ends (updates result)
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
    // If signal is still watching or monitoring, it expired (never got to bet)
    if (signal.stage === 'watching' || signal.stage === 'monitoring') {
      await expireSignal(signal.strategyId, game.id, game);
    } else {
      const success = await closeSignal(signal.strategyId, game.id, game);
      if (success) closed++;
    }
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
        entryTriggerTime: fields['Entry Trigger Time'],
        closeTriggerTime: fields['Close Trigger Time'],
        oddsAlignedTime: fields['Odds Aligned Time'],
        expiryTime: fields['Expiry Time'],
        closeTime: fields['Close Time'],
        entrySpread: fields['Entry Spread'],
        entryTotal: fields['Entry Total'],
        closeSpread: fields['Close Spread'],
        closeTotal: fields['Close Total'],
        requiredSpread: fields['Required Spread'],
        actualSpreadAtEntry: fields['Actual Spread At Entry'],
        leadingTeamAtTrigger: fields['Leading Team At Trigger'],
        leadingTeamSpreadAtEntry: fields['Leading Team Spread'],
        finalHomeScore: fields['Final Home Score'],
        finalAwayScore: fields['Final Away Score'],
        status: fields.Status || 'monitoring',
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
