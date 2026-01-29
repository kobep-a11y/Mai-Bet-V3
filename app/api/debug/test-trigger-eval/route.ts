import { NextRequest, NextResponse } from 'next/server';
import { getActiveStrategies } from '@/lib/strategy-service';
import { getActiveGames } from '@/lib/game-service';
import { createEvaluationContext, evaluateStrategy, formatTriggerResult } from '@/lib/trigger-engine';
import { signalStore } from '@/lib/signal-service';

/**
 * Debug endpoint to test trigger evaluation
 * GET - Test all active strategies against all live games
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Load strategies
    console.log('🔍 Loading strategies...');
    const strategies = await getActiveStrategies();
    console.log(`Loaded ${strategies.length} active strategies`);

    // 2. Load games from Airtable
    console.log('🔍 Loading games from Airtable...');
    const games = await getActiveGames();
    console.log(`Loaded ${games.length} active games`);

    // 3. Get current in-memory signals
    const activeSignals = signalStore.getAllActiveSignals();
    console.log(`In-memory active signals: ${activeSignals.length}`);

    // 4. Evaluate each strategy against each game
    const evaluationResults: Array<{
      strategy: {
        id: string;
        name: string;
        isActive: boolean;
        triggers: Array<{
          id: string;
          name: string;
          entryOrClose: string;
          conditions: unknown;
        }>;
        oddsRequirement: unknown;
      };
      games: Array<{
        gameId: string;
        homeTeam: string;
        awayTeam: string;
        status: string;
        quarter: number;
        timeRemaining: string;
        score: string;
        spread: number;
        context: Record<string, unknown>;
        triggersEvaluated: Array<{
          triggerId: string;
          triggerName: string;
          passed: boolean;
          matchedConditions: unknown[];
          failedConditions: unknown[];
        }>;
        wouldCreateSignal: boolean;
      }>;
    }> = [];

    for (const strategy of strategies) {
      const strategyResult = {
        strategy: {
          id: strategy.id,
          name: strategy.name,
          isActive: strategy.isActive,
          triggers: strategy.triggers.map(t => ({
            id: t.id,
            name: t.name,
            entryOrClose: t.entryOrClose,
            conditions: t.conditions,
          })),
          oddsRequirement: strategy.oddsRequirement,
        },
        games: [] as typeof evaluationResults[0]['games'],
      };

      for (const game of games) {
        if (game.status !== 'live' && game.status !== 'halftime') continue;

        const context = createEvaluationContext(game);
        const results = evaluateStrategy(strategy, game, activeSignals);

        const gameResult = {
          gameId: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          status: game.status,
          quarter: game.quarter,
          timeRemaining: game.timeRemaining,
          score: `${game.homeScore}-${game.awayScore}`,
          spread: game.spread,
          context: {
            quarter: context.quarter,
            timeRemainingSeconds: context.timeRemainingSeconds,
            scoreDifferential: context.scoreDifferential,
            absScoreDifferential: context.absScoreDifferential,
            currentLead: context.currentLead,
            halftimeLead: context.halftimeLead,
            totalScore: context.totalScore,
            q3Total: context.q3Total,
            q3Differential: context.q3Differential,
          },
          triggersEvaluated: [] as typeof strategyResult.games[0]['triggersEvaluated'],
          wouldCreateSignal: false,
        };

        // Evaluate each trigger
        for (const trigger of strategy.triggers) {
          // Check if trigger would fire
          let passed = false;
          let matchedConditions: unknown[] = [];
          let failedConditions: unknown[] = [];

          for (const condition of trigger.conditions) {
            const fieldValue = context[condition.field as keyof typeof context];
            let conditionPassed = false;

            switch (condition.operator) {
              case 'equals':
                conditionPassed = fieldValue === condition.value;
                break;
              case 'not_equals':
                conditionPassed = fieldValue !== condition.value;
                break;
              case 'greater_than':
                conditionPassed = typeof fieldValue === 'number' && fieldValue > (condition.value as number);
                break;
              case 'less_than':
                conditionPassed = typeof fieldValue === 'number' && fieldValue < (condition.value as number);
                break;
              case 'greater_than_or_equal':
                conditionPassed = typeof fieldValue === 'number' && fieldValue >= (condition.value as number);
                break;
              case 'less_than_or_equal':
                conditionPassed = typeof fieldValue === 'number' && fieldValue <= (condition.value as number);
                break;
              case 'between':
                conditionPassed = typeof fieldValue === 'number' &&
                  fieldValue >= (condition.value as number) &&
                  fieldValue <= (condition.value2 as number);
                break;
            }

            if (conditionPassed) {
              matchedConditions.push({
                field: condition.field,
                operator: condition.operator,
                value: condition.value,
                value2: condition.value2,
                actualValue: fieldValue,
              });
            } else {
              failedConditions.push({
                field: condition.field,
                operator: condition.operator,
                value: condition.value,
                value2: condition.value2,
                actualValue: fieldValue,
                reason: `${fieldValue} ${condition.operator} ${condition.value}${condition.value2 ? ` and ${condition.value2}` : ''} = false`,
              });
            }
          }

          passed = failedConditions.length === 0 && matchedConditions.length > 0;

          gameResult.triggersEvaluated.push({
            triggerId: trigger.id,
            triggerName: trigger.name,
            passed,
            matchedConditions,
            failedConditions,
          });

          if (passed && trigger.entryOrClose === 'entry') {
            gameResult.wouldCreateSignal = true;
          }
        }

        strategyResult.games.push(gameResult);
      }

      evaluationResults.push(strategyResult);
    }

    // Summary
    const totalFiredTriggers = evaluationResults.flatMap(s =>
      s.games.flatMap(g => g.triggersEvaluated.filter(t => t.passed))
    ).length;

    const signalCandidates = evaluationResults.flatMap(s =>
      s.games.filter(g => g.wouldCreateSignal)
    ).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        activeStrategies: strategies.length,
        activeGames: games.length,
        inMemorySignals: activeSignals.length,
        totalFiredTriggers,
        signalCandidates,
      },
      evaluationResults,
    });
  } catch (error) {
    console.error('Error in trigger evaluation test:', error);
    return NextResponse.json(
      { success: false, error: String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
