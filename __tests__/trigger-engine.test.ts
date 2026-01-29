import { evaluateTrigger } from '@/lib/trigger-engine';
import { Strategy, StrategyTrigger, GameEvaluationContext, Condition } from '@/types';

describe('Trigger Engine', () => {
    describe('evaluateTrigger', () => {
        it('should pass when all conditions are met', () => {
            const trigger: StrategyTrigger = {
                id: 'trigger-1',
                strategyId: 'strategy-1',
                name: 'Test Trigger',
                conditions: [
                    { field: 'quarter', operator: 'equals', value: 3 },
                    { field: 'homeLeading', operator: 'equals', value: true },
                ],
                order: 1,
                entryOrClose: 'entry',
            };

            const context: GameEvaluationContext = {
                quarter: 3,
                timeRemaining: '5:00',
                timeRemainingSeconds: 300,
                homeScore: 75,
                awayScore: 70,
                totalScore: 145,
                scoreDifferential: 5,
                absScoreDifferential: 5,
                homeLeading: true,
                awayLeading: false,
                spread: -3.5,
                total: 200.5,
                status: 'live',
                currentLead: 5,
                halftimeLead: 0,
                q1Home: 20,
                q1Away: 18,
                q1Total: 38,
                q1Differential: 2,
                q2Home: 22,
                q2Away: 24,
                q2Total: 46,
                q2Differential: -2,
                q3Home: 23,
                q3Away: 18,
                q3Total: 41,
                q3Differential: 5,
                q4Home: 0,
                q4Away: 0,
                q4Total: 0,
                q4Differential: 0,
                halftimeHome: 42,
                halftimeAway: 42,
                halftimeTotal: 84,
                halftimeDifferential: 0,
                firstHalfTotal: 84,
                secondHalfTotal: 61,
                // Player stats (null = no player data)
                homePlayerWinPct: null,
                awayPlayerWinPct: null,
                homePlayerPpm: null,
                awayPlayerPpm: null,
                homePlayerGames: null,
                awayPlayerGames: null,
                homePlayerFormWins: null,
                awayPlayerFormWins: null,
                // H2H comparison fields
                winPctDiff: null,
                ppmDiff: null,
                experienceDiff: null,
                // Dynamic leading/losing team fields
                leadingTeamSpread: -3.5,
                losingTeamSpread: 3.5,
                leadingTeamMoneyline: -150,
                losingTeamMoneyline: 130,
                // Direct home/away odds
                homeSpread: -3.5,
                awaySpread: 3.5,
                homeMoneyline: -150,
                awayMoneyline: 130,
            };

            const result = evaluateTrigger(trigger, context);

            expect(result.passed).toBe(true);
            expect(result.matchedConditions).toHaveLength(2);
            expect(result.failedConditions).toHaveLength(0);
        });

        it('should fail when any condition is not met', () => {
            const trigger: StrategyTrigger = {
                id: 'trigger-2',
                strategyId: 'strategy-1',
                name: 'Test Trigger',
                conditions: [
                    { field: 'quarter', operator: 'equals', value: 3 },
                    { field: 'homeLeading', operator: 'equals', value: true },
                    { field: 'currentLead', operator: 'greater_than', value: 10 }, // This will fail
                ],
                order: 1,
                entryOrClose: 'entry',
            };

            const context: GameEvaluationContext = {
                quarter: 3,
                timeRemaining: '5:00',
                timeRemainingSeconds: 300,
                homeScore: 75,
                awayScore: 70,
                totalScore: 145,
                scoreDifferential: 5,
                absScoreDifferential: 5,
                homeLeading: true,
                awayLeading: false,
                spread: -3.5,
                total: 200.5,
                status: 'live',
                currentLead: 5, // Only 5 point lead, not > 10
                halftimeLead: 0,
                q1Home: 20,
                q1Away: 18,
                q1Total: 38,
                q1Differential: 2,
                q2Home: 22,
                q2Away: 24,
                q2Total: 46,
                q2Differential: -2,
                q3Home: 23,
                q3Away: 18,
                q3Total: 41,
                q3Differential: 5,
                q4Home: 0,
                q4Away: 0,
                q4Total: 0,
                q4Differential: 0,
                halftimeHome: 42,
                halftimeAway: 42,
                halftimeTotal: 84,
                halftimeDifferential: 0,
                firstHalfTotal: 84,
                secondHalfTotal: 61,
                // Player stats (null = no player data)
                homePlayerWinPct: null,
                awayPlayerWinPct: null,
                homePlayerPpm: null,
                awayPlayerPpm: null,
                homePlayerGames: null,
                awayPlayerGames: null,
                homePlayerFormWins: null,
                awayPlayerFormWins: null,
                // H2H comparison fields
                winPctDiff: null,
                ppmDiff: null,
                experienceDiff: null,
                // Dynamic leading/losing team fields
                leadingTeamSpread: -3.5,
                losingTeamSpread: 3.5,
                leadingTeamMoneyline: -150,
                losingTeamMoneyline: 130,
                // Direct home/away odds
                homeSpread: -3.5,
                awaySpread: 3.5,
                homeMoneyline: -150,
                awayMoneyline: 130,
            };

            const result = evaluateTrigger(trigger, context);

            expect(result.passed).toBe(false);
            expect(result.matchedConditions).toHaveLength(2);
            expect(result.failedConditions).toHaveLength(1);
            expect(result.failedConditions[0].field).toBe('currentLead');
        });
    });
});
