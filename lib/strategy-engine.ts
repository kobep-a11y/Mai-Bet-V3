// MAI Bets V3 - Strategy Evaluation Engine
import type {
  LiveGame,
  Strategy,
  StrategyTrigger,
  StrategyCondition,
  Signal,
  SignalStatus,
} from '@/types';
import { getStrategies, createSignal, updateSignal, getActiveSignals } from './airtable';
import { sendSignalEntryAlert, sendSignalCloseAlert } from './discord';
import { getGame } from './game-store';

// Track which triggers have fired for each game (in-memory)
const activeTriggerState: Map<string, Map<string, { triggerId: string; signalId: string; status: SignalStatus }>> = new Map();

// ============================================
// Condition Evaluation
// ============================================

function evaluateCondition(condition: StrategyCondition, game: LiveGame, team: 'home' | 'away'): boolean {
  let fieldValue: number;

  // Get the field value based on the condition field and team perspective
  switch (condition.field) {
    case 'current_lead':
      fieldValue = team === 'home' ? game.home_lead : game.away_lead;
      break;
    case 'halftime_lead':
      if (game.halftime_lead === undefined) return false;
      fieldValue = team === 'home' ? game.halftime_lead : -game.halftime_lead;
      break;
    case 'quarter':
      fieldValue = game.quarter;
      break;
    case 'spread_vs_lead':
      const spread = team === 'home' ? game.spread_home : game.spread_away;
      const lead = team === 'home' ? game.home_lead : game.away_lead;
      fieldValue = lead - Math.abs(spread); // How much lead exceeds spread
      break;
    case 'moneyline_home':
      fieldValue = game.moneyline_home;
      break;
    case 'moneyline_away':
      fieldValue = game.moneyline_away;
      break;
    case 'total_score':
      fieldValue = game.home_score + game.away_score;
      break;
    case 'home_score':
      fieldValue = game.home_score;
      break;
    case 'away_score':
      fieldValue = game.away_score;
      break;
    default:
      return false;
  }

  // Evaluate the condition
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'greater_than':
      return fieldValue > condition.value;
    case 'less_than':
      return fieldValue < condition.value;
    case 'greater_than_or_equals':
      return fieldValue >= condition.value;
    case 'less_than_or_equals':
      return fieldValue <= condition.value;
    case 'between':
      return fieldValue >= condition.value && fieldValue <= (condition.value2 ?? condition.value);
    case 'not_between':
      return fieldValue < condition.value || fieldValue > (condition.value2 ?? condition.value);
    default:
      return false;
  }
}

function evaluateAllConditions(conditions: StrategyCondition[], game: LiveGame, team: 'home' | 'away'): boolean {
  if (conditions.length === 0) return false;
  return conditions.every(condition => evaluateCondition(condition, game, team));
}

// ============================================
// Win Requirement Evaluation
// ============================================

function evaluateWinRequirement(
  signal: Signal,
  game: LiveGame
): 'win' | 'loss' | 'push' | null {
  if (game.status !== 'finished') return null;

  const isHome = signal.team === 'home';
  const teamScore = isHome ? game.home_score : game.away_score;
  const opponentScore = isHome ? game.away_score : game.home_score;
  const spread = isHome ? game.spread_home : game.spread_away;

  // Determine which trigger to find for win requirement
  // For now, we'll need to pass the win requirement or look it up
  // This is a simplified version - actual implementation would look up the trigger

  // Default to team_wins if we can't find the trigger
  const finalDiff = teamScore - opponentScore;

  // Simple evaluation: if team won, it's a win
  if (finalDiff > 0) return 'win';
  if (finalDiff < 0) return 'loss';
  return 'push';
}

// ============================================
// Main Evaluation Loop
// ============================================

export async function evaluateStrategiesForGame(game: LiveGame): Promise<void> {
  // Skip non-live games
  if (game.status !== 'live' && game.status !== 'halftime') {
    // If game finished, close any active signals
    if (game.status === 'finished') {
      await closeSignalsForFinishedGame(game);
    }
    return;
  }

  // Get active strategies
  const strategies = await getStrategies();
  if (strategies.length === 0) return;

  // Get game's trigger state
  let gameState = activeTriggerState.get(game.event_id);
  if (!gameState) {
    gameState = new Map();
    activeTriggerState.set(game.event_id, gameState);
  }

  // Evaluate each strategy
  for (const strategy of strategies) {
    if (!strategy.is_active) continue;

    // Evaluate for both home and away teams
    for (const team of ['home', 'away'] as const) {
      await evaluateStrategyForTeam(strategy, game, team, gameState);
    }
  }
}

async function evaluateStrategyForTeam(
  strategy: Strategy,
  game: LiveGame,
  team: 'home' | 'away',
  gameState: Map<string, { triggerId: string; signalId: string; status: SignalStatus }>
): Promise<void> {
  const activeTriggers = strategy.triggers.filter(t => t.is_active);
  if (activeTriggers.length === 0) return;

  if (strategy.trigger_mode === 'sequential') {
    // Sequential: triggers must fire in order
    await evaluateSequentialTriggers(strategy, activeTriggers, game, team, gameState);
  } else {
    // Parallel: any trigger can fire independently
    await evaluateParallelTriggers(strategy, activeTriggers, game, team, gameState);
  }
}

async function evaluateSequentialTriggers(
  strategy: Strategy,
  triggers: StrategyTrigger[],
  game: LiveGame,
  team: 'home' | 'away',
  gameState: Map<string, { triggerId: string; signalId: string; status: SignalStatus }>
): Promise<void> {
  const stateKey = `${strategy.id}_${team}`;
  const currentState = gameState.get(stateKey);

  // Find the next trigger to evaluate
  let nextTriggerIndex = 0;
  if (currentState) {
    const currentTriggerIndex = triggers.findIndex(t => t.id === currentState.triggerId);
    if (currentTriggerIndex >= 0 && currentState.status === 'active') {
      // Check close conditions for current trigger
      const currentTrigger = triggers[currentTriggerIndex];
      if (evaluateAllConditions(currentTrigger.close_conditions, game, team)) {
        // Close the current signal
        await closeSignal(currentState.signalId, game, strategy);
        gameState.delete(stateKey);

        // Move to next trigger
        nextTriggerIndex = currentTriggerIndex + 1;
      } else {
        // Still in this trigger, don't evaluate further
        return;
      }
    } else if (currentState.status === 'pending') {
      // Previous trigger closed, check if we should move to next
      nextTriggerIndex = triggers.findIndex(t => t.id === currentState.triggerId) + 1;
    }
  }

  // Evaluate entry conditions for next trigger
  if (nextTriggerIndex < triggers.length) {
    const trigger = triggers[nextTriggerIndex];
    if (evaluateAllConditions(trigger.entry_conditions, game, team)) {
      // Entry conditions met - create signal
      const signal = await createEntrySignal(game, strategy, trigger, team);
      if (signal) {
        gameState.set(stateKey, {
          triggerId: trigger.id,
          signalId: signal.id,
          status: 'active',
        });
      }
    }
  }
}

async function evaluateParallelTriggers(
  strategy: Strategy,
  triggers: StrategyTrigger[],
  game: LiveGame,
  team: 'home' | 'away',
  gameState: Map<string, { triggerId: string; signalId: string; status: SignalStatus }>
): Promise<void> {
  for (const trigger of triggers) {
    const stateKey = `${strategy.id}_${team}_${trigger.id}`;
    const currentState = gameState.get(stateKey);

    if (currentState && currentState.status === 'active') {
      // Check close conditions
      if (evaluateAllConditions(trigger.close_conditions, game, team)) {
        await closeSignal(currentState.signalId, game, strategy);
        gameState.delete(stateKey);
      }
    } else if (!currentState) {
      // Check entry conditions
      if (evaluateAllConditions(trigger.entry_conditions, game, team)) {
        const signal = await createEntrySignal(game, strategy, trigger, team);
        if (signal) {
          gameState.set(stateKey, {
            triggerId: trigger.id,
            signalId: signal.id,
            status: 'active',
          });
        }
      }
    }
  }
}

// ============================================
// Signal Management
// ============================================

async function createEntrySignal(
  game: LiveGame,
  strategy: Strategy,
  trigger: StrategyTrigger,
  team: 'home' | 'away'
): Promise<Signal | null> {
  const spread = team === 'home' ? game.spread_home : game.spread_away;
  const moneyline = team === 'home' ? game.moneyline_home : game.moneyline_away;
  const lead = team === 'home' ? game.home_lead : game.away_lead;

  const signal = await createSignal({
    game_id: game.event_id,
    strategy_id: strategy.id,
    trigger_id: trigger.id,
    team,
    entry_quarter: game.quarter,
    entry_lead: lead,
    entry_spread: spread,
    entry_moneyline: moneyline,
    entry_time: new Date().toISOString(),
    status: 'active',
    discord_sent: false,
    sms_sent: false,
  });

  if (signal) {
    // Send Discord alert
    const sent = await sendSignalEntryAlert(signal, game, strategy, trigger);
    if (sent) {
      await updateSignal(signal.id, { discord_sent: true });
    }
  }

  return signal;
}

async function closeSignal(
  signalId: string,
  game: LiveGame,
  strategy: Strategy
): Promise<void> {
  const lead = game.home_lead; // Need to determine team from signal
  const result = game.status === 'finished' ? evaluateWinRequirement({ id: signalId, team: 'home' } as Signal, game) : null;

  await updateSignal(signalId, {
    status: 'closed',
    close_quarter: game.quarter,
    close_lead: lead,
    close_time: new Date().toISOString(),
    result: result ?? undefined,
  });

  // Send Discord close alert
  const activeSignals = await getActiveSignals();
  const signal = activeSignals.find(s => s.id === signalId);
  if (signal) {
    await sendSignalCloseAlert({ ...signal, result: result ?? undefined }, game, strategy);
  }
}

async function closeSignalsForFinishedGame(game: LiveGame): Promise<void> {
  const signals = await getActiveSignals();
  const gameSignals = signals.filter(s => s.game_id === game.event_id);

  for (const signal of gameSignals) {
    const result = evaluateWinRequirement(signal, game);
    await updateSignal(signal.id, {
      status: result ? (result === 'win' ? 'won' : result === 'loss' ? 'lost' : 'closed') : 'closed',
      close_quarter: game.quarter,
      close_lead: signal.team === 'home' ? game.home_lead : game.away_lead,
      close_time: new Date().toISOString(),
      result: result ?? undefined,
    });
  }

  // Clear game state
  activeTriggerState.delete(game.event_id);
}

// ============================================
// Debug / Utility
// ============================================

export function getActiveTriggerStates(): Map<string, Map<string, any>> {
  return new Map(activeTriggerState);
}

export function clearTriggerState(eventId: string): void {
  activeTriggerState.delete(eventId);
}

export function clearAllTriggerStates(): void {
  activeTriggerState.clear();
}
