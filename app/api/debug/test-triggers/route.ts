import { NextResponse } from 'next/server';
import { fetchStrategies, getActiveStrategies } from '@/lib/strategy-service';
import { createEvaluationContext, evaluateTrigger, evaluateAllStrategies } from '@/lib/trigger-engine';
import { signalStore } from '@/lib/signal-service';
import { LiveGame } from '@/types';

/**
 * Debug endpoint to test trigger evaluation
 * GET /api/debug/test-triggers
 *
 * Tests:
 * 1. Strategy loading from Airtable (REST API)
 * 2. Trigger parsing and conditions
 * 3. Manual trigger evaluation with mock game data
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testMode = searchParams.get('mode') || 'info';

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    mode: testMode,
  };

  try {
    // 1. Test strategy loading
    console.log('🔍 Testing strategy loading...');
    const allStrategies = await fetchStrategies(true); // Force refresh
    const activeStrategies = await getActiveStrategies();

    results.strategyLoading = {
      status: 'success',
      totalStrategies: allStrategies.length,
      activeStrategies: activeStrategies.length,
      strategies: allStrategies.map(s => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        triggerCount: s.triggers.length,
        triggers: s.triggers.map(t => ({
          id: t.id,
          name: t.name,
          entryOrClose: t.entryOrClose,
          conditionCount: t.conditions.length,
          conditions: t.conditions,
        })),
        oddsRequirement: s.oddsRequirement,
        isTwoStage: s.isTwoStage,
      })),
    };

    // 2. Check for any strategies without triggers
    const noTriggers = allStrategies.filter(s => s.triggers.length === 0);
    if (noTriggers.length > 0) {
      results.warnings = results.warnings || [];
      (results.warnings as string[]).push(
        `${noTriggers.length} strategies have no triggers: ${noTriggers.map(s => s.name).join(', ')}`
      );
    }

    // 3. If test mode is 'evaluate', test with mock game data
    if (testMode === 'evaluate') {
      // Create a mock game in Q3 with a decent lead
      const mockGame: LiveGame = {
        id: 'test-game-123',
        eventId: 'test-game-123',
        league: 'NBA2K',
        homeTeam: 'Test Home Team',
        awayTeam: 'Test Away Team',
        homeTeamId: 'test-home',
        awayTeamId: 'test-away',
        homeScore: 65,
        awayScore: 55,
        quarter: 3,
        timeRemaining: '5:00',
        status: 'live',
        quarterScores: {
          q1Home: 25, q1Away: 22,
          q2Home: 20, q2Away: 18,
          q3Home: 20, q3Away: 15,
          q4Home: 0, q4Away: 0,
        },
        halftimeScores: { home: 45, away: 40 },
        finalScores: { home: 65, away: 55 },
        spread: -5.5,
        mlHome: -180,
        mlAway: 160,
        total: 185.5,
        lastUpdate: new Date().toISOString(),
      };

      // Create evaluation context
      const context = createEvaluationContext(mockGame);
      results.mockGame = mockGame;
      results.evaluationContext = context;

      // Evaluate triggers for active strategies
      const activeSignals = signalStore.getAllActiveSignals();
      const triggerResults = evaluateAllStrategies(activeStrategies, mockGame, activeSignals);

      results.triggerEvaluation = {
        activeStrategiesEvaluated: activeStrategies.length,
        triggersFireCount: triggerResults.length,
        firedTriggers: triggerResults.map(r => ({
          strategyName: r.strategy.name,
          triggerName: r.trigger.name,
          entryOrClose: r.trigger.entryOrClose,
          matchedConditions: r.matchedConditions,
        })),
      };

      // Also test individual trigger evaluation for each active strategy
      results.individualTriggerTests = [];
      for (const strategy of activeStrategies) {
        for (const trigger of strategy.triggers) {
          const evaluation = evaluateTrigger(trigger, context);
          (results.individualTriggerTests as unknown[]).push({
            strategyName: strategy.name,
            triggerName: trigger.name,
            passed: evaluation.passed,
            matchedCount: evaluation.matchedConditions.length,
            failedCount: evaluation.failedConditions.length,
            matchedConditions: evaluation.matchedConditions,
            failedConditions: evaluation.failedConditions,
          });
        }
      }
    }

    // 4. Check current active signals in memory
    results.activeSignals = {
      count: signalStore.getAllActiveSignals().length,
      signals: signalStore.getAllActiveSignals(),
    };

    results.success = true;
    results.message = activeStrategies.length > 0
      ? `✅ System working: ${activeStrategies.length} active strategies with triggers ready`
      : allStrategies.length > 0
      ? `⚠️ No active strategies (${allStrategies.length} total exist - need to activate at least one)`
      : '❌ No strategies found in Airtable';

  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.stack = error instanceof Error ? error.stack : undefined;
  }

  return NextResponse.json(results, {
    status: results.success ? 200 : 500,
  });
}
