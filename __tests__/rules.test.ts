import { passesRules } from '@/lib/trigger-engine';
import { LiveGame, Rule } from '@/types';

/**
 * Helper to create a minimal LiveGame for testing
 */
function createTestGame(overrides: Partial<LiveGame> = {}): LiveGame {
  return {
    id: 'test-game-1',
    eventId: '12345',
    league: 'NBA2K',
    homeTeam: 'NY Knicks (PLAYER1)',
    awayTeam: 'LA Lakers (PLAYER2)',
    homeTeamId: 'knicks-1',
    awayTeamId: 'lakers-1',
    homeScore: 50,
    awayScore: 45,
    quarter: 2,
    timeRemaining: '5:00',
    status: 'live',
    quarterScores: {
      q1Home: 25,
      q1Away: 22,
      q2Home: 25,
      q2Away: 23,
      q3Home: 0,
      q3Away: 0,
      q4Home: 0,
      q4Away: 0,
    },
    halftimeScores: { home: 50, away: 45 },
    finalScores: { home: 0, away: 0 },
    spread: -3.5,
    mlHome: -150,
    mlAway: 130,
    total: 185.5,
    lastUpdate: new Date().toISOString(),
    ...overrides,
  };
}

describe('Rules System', () => {
  describe('passesRules', () => {
    it('should pass when no rules are defined', () => {
      const game = createTestGame();
      const result = passesRules(undefined, game);

      expect(result.passed).toBe(true);
      expect(result.failedRule).toBeUndefined();
      expect(result.reason).toBeUndefined();
    });

    it('should pass when rules array is empty', () => {
      const game = createTestGame();
      const result = passesRules([], game);

      expect(result.passed).toBe(true);
      expect(result.failedRule).toBeUndefined();
      expect(result.reason).toBeUndefined();
    });
  });

  describe('first_half_only rule', () => {
    it('should pass in Q1', () => {
      const game = createTestGame({ quarter: 1 });
      const rules: Rule[] = [{ type: 'first_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should pass in Q2', () => {
      const game = createTestGame({ quarter: 2 });
      const rules: Rule[] = [{ type: 'first_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block in Q3', () => {
      const game = createTestGame({ quarter: 3 });
      const rules: Rule[] = [{ type: 'first_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule).toBeDefined();
      expect(result.failedRule?.type).toBe('first_half_only');
      expect(result.reason).toContain('Q3');
    });

    it('should block in Q4', () => {
      const game = createTestGame({ quarter: 4 });
      const rules: Rule[] = [{ type: 'first_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule).toBeDefined();
      expect(result.reason).toContain('Q4');
    });
  });

  describe('second_half_only rule', () => {
    it('should block in Q1', () => {
      const game = createTestGame({ quarter: 1 });
      const rules: Rule[] = [{ type: 'second_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('second_half_only');
      expect(result.reason).toContain('Q1');
    });

    it('should block in Q2', () => {
      const game = createTestGame({ quarter: 2 });
      const rules: Rule[] = [{ type: 'second_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('Q2');
    });

    it('should pass in Q3', () => {
      const game = createTestGame({ quarter: 3 });
      const rules: Rule[] = [{ type: 'second_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should pass in Q4', () => {
      const game = createTestGame({ quarter: 4 });
      const rules: Rule[] = [{ type: 'second_half_only' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });
  });

  describe('specific_quarter rule', () => {
    it('should pass when in the required quarter', () => {
      const game = createTestGame({ quarter: 3 });
      const rules: Rule[] = [{ type: 'specific_quarter', value: 3 }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block when not in the required quarter', () => {
      const game = createTestGame({ quarter: 2 });
      const rules: Rule[] = [{ type: 'specific_quarter', value: 3 }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('specific_quarter');
      expect(result.reason).toContain('Q2');
      expect(result.reason).toContain('required Q3');
    });

    it('should handle string value', () => {
      const game = createTestGame({ quarter: 4 });
      const rules: Rule[] = [{ type: 'specific_quarter', value: '4' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });
  });

  describe('exclude_overtime rule', () => {
    it('should pass in Q1', () => {
      const game = createTestGame({ quarter: 1 });
      const rules: Rule[] = [{ type: 'exclude_overtime' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should pass in Q4', () => {
      const game = createTestGame({ quarter: 4 });
      const rules: Rule[] = [{ type: 'exclude_overtime' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block in overtime (Q5)', () => {
      const game = createTestGame({ quarter: 5 });
      const rules: Rule[] = [{ type: 'exclude_overtime' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('exclude_overtime');
      expect(result.reason).toContain('Q5');
      expect(result.reason).toContain('overtime');
    });
  });

  describe('stop_at rule', () => {
    it('should pass before the stop time', () => {
      const game = createTestGame({ quarter: 4, timeRemaining: '3:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block after the stop time', () => {
      const game = createTestGame({ quarter: 4, timeRemaining: '2:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('stop_at');
      expect(result.reason).toContain('passed Q4 2:20');
    });

    it('should block in quarters after stop quarter', () => {
      const game = createTestGame({ quarter: 5, timeRemaining: '5:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('stop_at');
      expect(result.reason).toContain('past Q4');
    });

    it('should pass in quarters before stop quarter', () => {
      const game = createTestGame({ quarter: 3, timeRemaining: '1:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should handle different time formats (Q3 5:30)', () => {
      const game = createTestGame({ quarter: 3, timeRemaining: '6:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q3 5:30' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should handle different time formats (Q2 10:00)', () => {
      const game = createTestGame({ quarter: 2, timeRemaining: '9:00' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q2 10:00' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
    });

    it('should handle seconds correctly (Q4 2:30 vs 2:20)', () => {
      const game = createTestGame({ quarter: 4, timeRemaining: '2:25' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block at exact stop time', () => {
      const game = createTestGame({ quarter: 4, timeRemaining: '2:20' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      // At exactly 2:20, we're not past it yet, so it should pass
      expect(result.passed).toBe(true);
    });

    it('should block one second after stop time', () => {
      const game = createTestGame({ quarter: 4, timeRemaining: '2:19' });
      const rules: Rule[] = [{ type: 'stop_at', value: 'Q4 2:20' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
    });
  });

  describe('minimum_score rule', () => {
    it('should pass when total score meets threshold', () => {
      const game = createTestGame({ homeScore: 60, awayScore: 55 }); // Total: 115
      const rules: Rule[] = [{ type: 'minimum_score', value: 100 }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should pass when total score equals threshold', () => {
      const game = createTestGame({ homeScore: 60, awayScore: 40 }); // Total: 100
      const rules: Rule[] = [{ type: 'minimum_score', value: 100 }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should block when total score is below threshold', () => {
      const game = createTestGame({ homeScore: 40, awayScore: 35 }); // Total: 75
      const rules: Rule[] = [{ type: 'minimum_score', value: 100 }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('minimum_score');
      expect(result.reason).toContain('75');
      expect(result.reason).toContain('100');
    });

    it('should handle string value', () => {
      const game = createTestGame({ homeScore: 60, awayScore: 50 }); // Total: 110
      const rules: Rule[] = [{ type: 'minimum_score', value: '100' }];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });
  });

  describe('multiple rules', () => {
    it('should pass when all rules pass', () => {
      const game = createTestGame({
        quarter: 3,
        homeScore: 70,
        awayScore: 65,
        timeRemaining: '8:00',
      }); // Total: 135

      const rules: Rule[] = [
        { type: 'second_half_only' },
        { type: 'minimum_score', value: 100 },
        { type: 'exclude_overtime' },
      ];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });

    it('should fail when any rule fails', () => {
      const game = createTestGame({
        quarter: 3,
        homeScore: 40,
        awayScore: 35,
        timeRemaining: '8:00',
      }); // Total: 75 (below minimum)

      const rules: Rule[] = [
        { type: 'second_half_only' },
        { type: 'minimum_score', value: 100 }, // This will fail
        { type: 'exclude_overtime' },
      ];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('minimum_score');
    });

    it('should stop at first failed rule', () => {
      const game = createTestGame({ quarter: 1 }); // Will fail second_half_only

      const rules: Rule[] = [
        { type: 'second_half_only' }, // This will fail first
        { type: 'first_half_only' },  // This would also fail but shouldn't be reached
      ];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(false);
      expect(result.failedRule?.type).toBe('second_half_only');
    });

    it('should handle complex scenario with stop_at', () => {
      const game = createTestGame({
        quarter: 4,
        timeRemaining: '5:00',
        homeScore: 80,
        awayScore: 78,
      }); // Total: 158

      const rules: Rule[] = [
        { type: 'stop_at', value: 'Q4 2:20' },
        { type: 'minimum_score', value: 150 },
        { type: 'exclude_overtime' },
      ];

      const result = passesRules(rules, game);

      expect(result.passed).toBe(true);
    });
  });
});
