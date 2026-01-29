/**
 * AI Strategy Builder
 * Converts natural language descriptions into structured strategy configurations
 */

import {
  Strategy,
  StrategyTrigger,
  Condition,
  ConditionField,
  ConditionOperator,
  Rule,
  RuleType,
  WinRequirement,
  WinRequirementType,
  OddsRequirement,
  OddsType,
  BetSide,
} from '@/types';

// ============================================
// TYPES
// ============================================

export interface StrategyBuilderRequest {
  description: string;
  sport?: string; // 'nba' | 'nba2k' - defaults to 'nba2k'
}

export interface StrategyBuilderResponse {
  success: boolean;
  strategy?: Partial<Strategy>;
  suggestedTriggers?: Partial<StrategyTrigger>[];
  suggestedRules?: Rule[];
  suggestedWinRequirements?: WinRequirement[];
  suggestedOddsRequirement?: OddsRequirement;
  explanation: string;
  confidence: number; // 0-1 confidence score
  warnings?: string[];
}

export interface ParsedIntent {
  triggerConditions: ParsedCondition[];
  timing: TimingIntent | null;
  betTarget: BetTargetIntent | null;
  winCondition: WinConditionIntent | null;
  oddsRequirement: OddsIntent | null;
}

interface ParsedCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: number | string;
  value2?: number;
  confidence: number;
  source: string; // Original phrase that was parsed
}

interface TimingIntent {
  quarter?: number;
  quarterRange?: { from: number; to: number };
  timeContext?: 'early' | 'late' | 'any';
  halfRestriction?: 'first_half' | 'second_half';
}

interface BetTargetIntent {
  target: 'leading' | 'trailing' | 'home' | 'away';
  betType: 'spread' | 'moneyline' | 'total';
}

interface WinConditionIntent {
  type: WinRequirementType;
  value?: number;
}

interface OddsIntent {
  type: OddsType;
  value?: number;
  comparison?: 'at_least' | 'at_most' | 'exactly';
}

// ============================================
// KEYWORD MAPPINGS
// ============================================

// Map natural language to condition fields
const FIELD_KEYWORDS: Record<string, ConditionField> = {
  // Score keywords
  'lead': 'currentLead',
  'leading': 'currentLead',
  'ahead': 'currentLead',
  'margin': 'currentLead',
  'point lead': 'currentLead',
  'points ahead': 'currentLead',
  'up by': 'currentLead',
  'down by': 'currentLead',
  'trailing': 'currentLead',
  'behind': 'currentLead',

  // Score differential
  'home leading': 'homeLeading',
  'away leading': 'awayLeading',
  'home team leads': 'homeLeading',
  'away team leads': 'awayLeading',

  // Specific scores
  'home score': 'homeScore',
  'away score': 'awayScore',
  'total score': 'totalScore',
  'combined score': 'totalScore',
  'total points': 'totalScore',

  // Quarter keywords
  'quarter': 'quarter',
  'q1': 'quarter',
  'q2': 'quarter',
  'q3': 'quarter',
  'q4': 'quarter',
  'first quarter': 'quarter',
  'second quarter': 'quarter',
  'third quarter': 'quarter',
  'fourth quarter': 'quarter',

  // Time keywords
  'time remaining': 'timeRemainingSeconds',
  'time left': 'timeRemainingSeconds',
  'minutes left': 'timeRemainingSeconds',
  'seconds left': 'timeRemainingSeconds',

  // Halftime keywords
  'halftime lead': 'halftimeLead',
  'halftime margin': 'halftimeLead',
  'halftime score': 'halftimeTotal',
  'first half score': 'firstHalfTotal',
  'second half score': 'secondHalfTotal',

  // Spread keywords
  'spread': 'leadingTeamSpread',
  'point spread': 'leadingTeamSpread',
  'home spread': 'homeSpread',
  'away spread': 'awaySpread',
  'leading team spread': 'leadingTeamSpread',
  'trailing team spread': 'losingTeamSpread',

  // Moneyline keywords
  'moneyline': 'leadingTeamMoneyline',
  'ml': 'leadingTeamMoneyline',
  'home ml': 'homeMoneyline',
  'away ml': 'awayMoneyline',

  // Player stats keywords
  'win percentage': 'winPctDiff',
  'win rate': 'winPctDiff',
  'experience': 'experienceDiff',
  'games played': 'experienceDiff',
  'points per match': 'ppmDiff',
  'ppm': 'ppmDiff',
  'home player win': 'homePlayerWinPct',
  'away player win': 'awayPlayerWinPct',
};

// Map natural language to operators
const OPERATOR_KEYWORDS: Record<string, ConditionOperator> = {
  'greater than': 'greater_than',
  'more than': 'greater_than',
  'over': 'greater_than',
  'above': 'greater_than',
  'exceeds': 'greater_than',
  'at least': 'greater_than_or_equal',
  'minimum': 'greater_than_or_equal',
  'min': 'greater_than_or_equal',
  '>=': 'greater_than_or_equal',
  'less than': 'less_than',
  'under': 'less_than',
  'below': 'less_than',
  'fewer than': 'less_than',
  'at most': 'less_than_or_equal',
  'maximum': 'less_than_or_equal',
  'max': 'less_than_or_equal',
  '<=': 'less_than_or_equal',
  'equals': 'equals',
  'equal to': 'equals',
  'is': 'equals',
  'exactly': 'equals',
  '=': 'equals',
  'between': 'between',
  'from': 'between',
  'range': 'between',
};

// Quarter mapping
const QUARTER_MAP: Record<string, number> = {
  'first': 1, '1st': 1, 'q1': 1, 'one': 1, '1': 1,
  'second': 2, '2nd': 2, 'q2': 2, 'two': 2, '2': 2,
  'third': 3, '3rd': 3, 'q3': 3, 'three': 3, '3': 3,
  'fourth': 4, '4th': 4, 'q4': 4, 'four': 4, '4': 4,
  'overtime': 5, 'ot': 5,
};

// ============================================
// MAIN BUILDER FUNCTION
// ============================================

/**
 * Build a strategy from a natural language description
 */
export async function buildStrategyFromDescription(
  request: StrategyBuilderRequest
): Promise<StrategyBuilderResponse> {
  const { description } = request;
  const warnings: string[] = [];

  if (!description || description.trim().length < 10) {
    return {
      success: false,
      explanation: 'Description is too short. Please provide more detail about your strategy.',
      confidence: 0,
    };
  }

  const normalizedDesc = description.toLowerCase().trim();

  // Parse the intent from the description
  const intent = parseIntent(normalizedDesc);

  // Build conditions from parsed intent
  const conditions = buildConditions(intent.triggerConditions);

  // Build rules from timing intent
  const rules = buildRules(intent.timing);

  // Build win requirements
  const winRequirements = buildWinRequirements(intent.winCondition);

  // Build odds requirement
  const oddsRequirement = buildOddsRequirement(intent.oddsRequirement, intent.betTarget);

  // Calculate confidence
  const confidence = calculateConfidence(intent);

  // Generate explanation
  const explanation = generateExplanation(intent, conditions, rules);

  // Build the trigger
  const trigger: Partial<StrategyTrigger> = {
    name: generateTriggerName(intent),
    conditions,
    order: 1,
    entryOrClose: 'entry',
  };

  // Build the strategy
  const strategy: Partial<Strategy> = {
    name: generateStrategyName(description),
    description: description,
    triggerMode: 'sequential',
    isActive: false, // Default to inactive for review
    triggers: [],
    discordWebhooks: [],
    rules: rules.length > 0 ? rules : undefined,
    winRequirements: winRequirements.length > 0 ? winRequirements : undefined,
    oddsRequirement: oddsRequirement || undefined,
    expiryTimeQ4: '2:20',
    isTwoStage: false,
  };

  // Add warnings for low confidence parsing
  if (confidence < 0.5) {
    warnings.push('Low confidence in parsing. Please review the generated conditions carefully.');
  }

  if (conditions.length === 0) {
    warnings.push('No conditions could be extracted. Please be more specific about when the signal should trigger.');
  }

  return {
    success: conditions.length > 0,
    strategy,
    suggestedTriggers: [trigger],
    suggestedRules: rules,
    suggestedWinRequirements: winRequirements,
    suggestedOddsRequirement: oddsRequirement || undefined,
    explanation,
    confidence,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================
// INTENT PARSING
// ============================================

function parseIntent(description: string): ParsedIntent {
  return {
    triggerConditions: parseTriggerConditions(description),
    timing: parseTimingIntent(description),
    betTarget: parseBetTarget(description),
    winCondition: parseWinCondition(description),
    oddsRequirement: parseOddsIntent(description),
  };
}

function parseTriggerConditions(description: string): ParsedCondition[] {
  const conditions: ParsedCondition[] = [];

  // Pattern: "X point lead" or "lead of X"
  const leadPatterns = [
    /(\d+)\s*(?:point|pt)?\s*lead/gi,
    /lead(?:ing)?\s*(?:by|of)\s*(\d+)/gi,
    /up\s*(?:by)?\s*(\d+)/gi,
    /ahead\s*(?:by)?\s*(\d+)/gi,
  ];

  for (const pattern of leadPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const value = parseInt(match[1]);
      if (!isNaN(value)) {
        conditions.push({
          field: 'currentLead',
          operator: 'greater_than_or_equal',
          value,
          confidence: 0.9,
          source: match[0],
        });
      }
    }
  }

  // Pattern: "in Q1/Q2/Q3/Q4" or "during the Xth quarter"
  const quarterPattern = /(?:in|during)\s*(?:the\s*)?(?:q|quarter\s*)?(\d|first|second|third|fourth)/gi;
  const quarterMatches = description.matchAll(quarterPattern);
  for (const match of quarterMatches) {
    const quarterValue = QUARTER_MAP[match[1].toLowerCase()] || parseInt(match[1]);
    if (!isNaN(quarterValue)) {
      conditions.push({
        field: 'quarter',
        operator: 'equals',
        value: quarterValue,
        confidence: 0.95,
        source: match[0],
      });
    }
  }

  // Pattern: "before X:XX" or "with X minutes left"
  const timePatterns = [
    /(?:with|before)\s*(\d+):?(\d{0,2})?\s*(?:left|remaining|minutes)/gi,
    /(\d+)\s*minutes?\s*(?:left|remaining)/gi,
  ];

  for (const pattern of timePatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const minutes = parseInt(match[1]);
      const seconds = match[2] ? parseInt(match[2]) : 0;
      const totalSeconds = minutes * 60 + seconds;
      if (!isNaN(totalSeconds)) {
        conditions.push({
          field: 'timeRemainingSeconds',
          operator: 'less_than_or_equal',
          value: totalSeconds,
          confidence: 0.85,
          source: match[0],
        });
      }
    }
  }

  // Pattern: "total score over/under X"
  const totalScorePattern = /total\s*(?:score|points)?\s*(over|under|above|below)\s*(\d+)/gi;
  const totalMatches = description.matchAll(totalScorePattern);
  for (const match of totalMatches) {
    const operator = match[1].toLowerCase() === 'over' || match[1].toLowerCase() === 'above'
      ? 'greater_than'
      : 'less_than';
    const value = parseInt(match[2]);
    if (!isNaN(value)) {
      conditions.push({
        field: 'totalScore',
        operator,
        value,
        confidence: 0.9,
        source: match[0],
      });
    }
  }

  // Pattern: "spread of at least X" or "getting X points"
  const spreadPatterns = [
    /spread\s*(?:of|at)?\s*(?:least|minimum)?\s*\+?(\d+(?:\.\d+)?)/gi,
    /getting\s*(\d+(?:\.\d+)?)\s*points/gi,
  ];

  for (const pattern of spreadPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        conditions.push({
          field: 'leadingTeamSpread',
          operator: 'greater_than_or_equal',
          value,
          confidence: 0.85,
          source: match[0],
        });
      }
    }
  }

  // Pattern: "home team leading" or "away team leading"
  if (description.includes('home') && (description.includes('lead') || description.includes('ahead') || description.includes('winning'))) {
    conditions.push({
      field: 'homeLeading',
      operator: 'equals',
      value: 1,
      confidence: 0.9,
      source: 'home team leading',
    });
  }

  if (description.includes('away') && (description.includes('lead') || description.includes('ahead') || description.includes('winning'))) {
    conditions.push({
      field: 'awayLeading',
      operator: 'equals',
      value: 1,
      confidence: 0.9,
      source: 'away team leading',
    });
  }

  // Pattern: "blowout" typically means large lead (15+)
  if (description.includes('blowout') || description.includes('blow out') || description.includes('blow-out')) {
    conditions.push({
      field: 'currentLead',
      operator: 'greater_than_or_equal',
      value: 15,
      confidence: 0.7,
      source: 'blowout',
    });
  }

  // Pattern: "close game" typically means lead < 5
  if (description.includes('close game') || description.includes('tight game') || description.includes('competitive')) {
    conditions.push({
      field: 'currentLead',
      operator: 'less_than_or_equal',
      value: 5,
      confidence: 0.7,
      source: 'close game',
    });
  }

  return conditions;
}

function parseTimingIntent(description: string): TimingIntent | null {
  const intent: TimingIntent = {};

  // First half only
  if (description.includes('first half') || description.includes('1st half')) {
    intent.halfRestriction = 'first_half';
    intent.quarterRange = { from: 1, to: 2 };
  }

  // Second half only
  if (description.includes('second half') || description.includes('2nd half')) {
    intent.halfRestriction = 'second_half';
    intent.quarterRange = { from: 3, to: 4 };
  }

  // Early game
  if (description.includes('early') || description.includes('start of')) {
    intent.timeContext = 'early';
  }

  // Late game
  if (description.includes('late') || description.includes('end of') || description.includes('closing')) {
    intent.timeContext = 'late';
  }

  // Specific quarter
  for (const [key, value] of Object.entries(QUARTER_MAP)) {
    if (description.includes(key) && !description.includes('half')) {
      intent.quarter = value;
      break;
    }
  }

  return Object.keys(intent).length > 0 ? intent : null;
}

function parseBetTarget(description: string): BetTargetIntent | null {
  let target: 'leading' | 'trailing' | 'home' | 'away' | null = null;
  let betType: 'spread' | 'moneyline' | 'total' = 'spread';

  // Target detection
  if (description.includes('leading team') || description.includes('leader')) {
    target = 'leading';
  } else if (description.includes('trailing team') || description.includes('underdog') || description.includes('trailing')) {
    target = 'trailing';
  } else if (description.includes('home team') || description.includes('home')) {
    target = 'home';
  } else if (description.includes('away team') || description.includes('visitor') || description.includes('away')) {
    target = 'away';
  }

  // Bet type detection
  if (description.includes('moneyline') || description.includes('ml') || description.includes('outright')) {
    betType = 'moneyline';
  } else if (description.includes('total') || description.includes('over') || description.includes('under')) {
    betType = 'total';
  } else if (description.includes('spread') || description.includes('cover') || description.includes('ats')) {
    betType = 'spread';
  }

  return target ? { target, betType } : null;
}

function parseWinCondition(description: string): WinConditionIntent | null {
  // Leading team must win
  if (description.includes('leader wins') || description.includes('leading team wins') ||
      description.includes('hold the lead') || description.includes('maintain lead')) {
    return { type: 'leading_team_wins' };
  }

  // Home must win
  if (description.includes('home wins') || description.includes('home team wins')) {
    return { type: 'home_wins' };
  }

  // Away must win
  if (description.includes('away wins') || description.includes('away team wins')) {
    return { type: 'away_wins' };
  }

  // Final margin requirements
  const finalMarginPattern = /(?:win|final\s*(?:margin|lead))\s*(?:by|of)?\s*(?:at\s*least\s*)?(\d+)/gi;
  const matches = description.matchAll(finalMarginPattern);
  for (const match of matches) {
    const value = parseInt(match[1]);
    if (!isNaN(value)) {
      return { type: 'final_lead_gte', value };
    }
  }

  return null;
}

function parseOddsIntent(description: string): OddsIntent | null {
  // Spread requirement
  const spreadPattern = /spread\s*(?:of|at)?\s*(?:least|minimum)?\s*\+?(\d+(?:\.\d+)?)/gi;
  const spreadMatch = spreadPattern.exec(description);
  if (spreadMatch) {
    return {
      type: 'spread',
      value: parseFloat(spreadMatch[1]),
      comparison: 'at_least',
    };
  }

  // Moneyline requirement
  const mlPattern = /(?:moneyline|ml)\s*(?:of|at)?\s*(?:least)?\s*([+-]?\d+)/gi;
  const mlMatch = mlPattern.exec(description);
  if (mlMatch) {
    return {
      type: 'moneyline',
      value: parseInt(mlMatch[1]),
      comparison: 'at_least',
    };
  }

  return null;
}

// ============================================
// BUILDING FUNCTIONS
// ============================================

function buildConditions(parsedConditions: ParsedCondition[]): Condition[] {
  // Deduplicate by field (keep highest confidence)
  const fieldMap = new Map<string, ParsedCondition>();

  for (const cond of parsedConditions) {
    const existing = fieldMap.get(cond.field);
    if (!existing || cond.confidence > existing.confidence) {
      fieldMap.set(cond.field, cond);
    }
  }

  return Array.from(fieldMap.values()).map((pc) => ({
    field: pc.field,
    operator: pc.operator,
    value: pc.value,
    value2: pc.value2,
  }));
}

function buildRules(timing: TimingIntent | null): Rule[] {
  const rules: Rule[] = [];

  if (!timing) return rules;

  if (timing.halfRestriction === 'first_half') {
    rules.push({ type: 'first_half_only' as RuleType });
  }

  if (timing.halfRestriction === 'second_half') {
    rules.push({ type: 'second_half_only' as RuleType });
  }

  if (timing.quarter && timing.quarter > 0 && timing.quarter <= 4) {
    rules.push({ type: 'specific_quarter' as RuleType, value: timing.quarter });
  }

  // Always exclude overtime by default
  rules.push({ type: 'exclude_overtime' as RuleType });

  return rules;
}

function buildWinRequirements(winCondition: WinConditionIntent | null): WinRequirement[] {
  if (!winCondition) return [];

  const req: WinRequirement = { type: winCondition.type };
  if (winCondition.value !== undefined) {
    req.value = winCondition.value;
  }

  return [req];
}

function buildOddsRequirement(
  oddsIntent: OddsIntent | null,
  betTarget: BetTargetIntent | null
): OddsRequirement | null {
  if (!oddsIntent) return null;

  // Map internal target names to BetSide type
  let betSide: BetSide = 'leading_team';
  if (betTarget?.target) {
    const targetMap: Record<string, BetSide> = {
      'leading': 'leading_team',
      'trailing': 'trailing_team',
      'home': 'home',
      'away': 'away',
    };
    betSide = targetMap[betTarget.target] || 'leading_team';
  }

  return {
    type: oddsIntent.type,
    value: oddsIntent.value || 0,
    betSide,
  };
}

// ============================================
// HELPERS
// ============================================

function calculateConfidence(intent: ParsedIntent): number {
  const weights = {
    conditions: 0.4,
    timing: 0.2,
    betTarget: 0.2,
    winCondition: 0.1,
    oddsRequirement: 0.1,
  };

  let confidence = 0;

  // Condition confidence
  if (intent.triggerConditions.length > 0) {
    const avgConditionConfidence =
      intent.triggerConditions.reduce((sum, c) => sum + c.confidence, 0) /
      intent.triggerConditions.length;
    confidence += avgConditionConfidence * weights.conditions;
  }

  // Timing confidence
  if (intent.timing) {
    confidence += 0.8 * weights.timing;
  }

  // Bet target confidence
  if (intent.betTarget) {
    confidence += 0.8 * weights.betTarget;
  }

  // Win condition confidence
  if (intent.winCondition) {
    confidence += 0.9 * weights.winCondition;
  }

  // Odds requirement confidence
  if (intent.oddsRequirement) {
    confidence += 0.85 * weights.oddsRequirement;
  }

  return Math.min(1, Math.max(0, confidence));
}

function generateExplanation(
  intent: ParsedIntent,
  conditions: Condition[],
  rules: Rule[]
): string {
  const parts: string[] = [];

  if (conditions.length === 0) {
    return 'Could not extract any trigger conditions from the description. Please provide more specific details about when the signal should trigger (e.g., "10 point lead in Q3").';
  }

  parts.push(`Parsed ${conditions.length} condition(s):`);

  for (const cond of conditions) {
    const operatorText = {
      'equals': 'equals',
      'not_equals': 'does not equal',
      'greater_than': 'is greater than',
      'less_than': 'is less than',
      'greater_than_or_equal': 'is at least',
      'less_than_or_equal': 'is at most',
      'between': 'is between',
      'contains': 'contains',
    }[cond.operator] || cond.operator;

    parts.push(`  - ${cond.field} ${operatorText} ${cond.value}`);
  }

  if (rules.length > 0) {
    parts.push(`\nApplied ${rules.length} rule(s):`);
    for (const rule of rules) {
      parts.push(`  - ${rule.type}${rule.value ? `: ${rule.value}` : ''}`);
    }
  }

  if (intent.betTarget) {
    parts.push(`\nBet target: ${intent.betTarget.target} team (${intent.betTarget.betType})`);
  }

  if (intent.winCondition) {
    parts.push(`\nWin condition: ${intent.winCondition.type}`);
  }

  return parts.join('\n');
}

function generateStrategyName(description: string): string {
  // Extract key words for strategy name
  const words = description.toLowerCase().split(/\s+/);
  const keyWords: string[] = [];

  // Look for meaningful keywords
  const meaningfulPatterns = [
    /blowout/i, /comeback/i, /lead/i, /close/i,
    /q[1-4]/i, /first/i, /second/i, /third/i, /fourth/i,
    /half/i, /spread/i, /ml/i, /moneyline/i,
  ];

  for (const word of words) {
    for (const pattern of meaningfulPatterns) {
      if (pattern.test(word)) {
        keyWords.push(word.charAt(0).toUpperCase() + word.slice(1));
        break;
      }
    }
    if (keyWords.length >= 3) break;
  }

  if (keyWords.length === 0) {
    return `AI Strategy ${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  return keyWords.join(' ') + ' Strategy';
}

function generateTriggerName(intent: ParsedIntent): string {
  const parts: string[] = [];

  // Add lead condition
  const leadCondition = intent.triggerConditions.find(c => c.field === 'currentLead');
  if (leadCondition) {
    parts.push(`${leadCondition.value}pt Lead`);
  }

  // Add quarter
  if (intent.timing?.quarter) {
    parts.push(`Q${intent.timing.quarter}`);
  } else if (intent.timing?.halfRestriction) {
    parts.push(intent.timing.halfRestriction === 'first_half' ? '1H' : '2H');
  }

  if (parts.length === 0) {
    return 'Entry Trigger';
  }

  return parts.join(' ');
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a set of conditions against available fields
 */
export function validateConditions(conditions: Condition[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const validFields = new Set<string>([
    'quarter', 'timeRemaining', 'timeRemainingSeconds', 'homeScore', 'awayScore',
    'totalScore', 'scoreDifferential', 'absScoreDifferential', 'homeLeading',
    'awayLeading', 'spread', 'total', 'currentLead', 'halftimeLead',
    'q1Home', 'q1Away', 'q1Total', 'q1Differential',
    'q2Home', 'q2Away', 'q2Total', 'q2Differential',
    'q3Home', 'q3Away', 'q3Total', 'q3Differential',
    'q4Home', 'q4Away', 'q4Total', 'q4Differential',
    'halftimeHome', 'halftimeAway', 'halftimeTotal', 'halftimeDifferential',
    'firstHalfTotal', 'secondHalfTotal', 'status',
    'homePlayerWinPct', 'awayPlayerWinPct', 'homePlayerPpm', 'awayPlayerPpm',
    'homePlayerGames', 'awayPlayerGames', 'homePlayerFormWins', 'awayPlayerFormWins',
    'winPctDiff', 'ppmDiff', 'experienceDiff',
    'leadingTeamSpread', 'losingTeamSpread', 'leadingTeamMoneyline', 'losingTeamMoneyline',
    'homeSpread', 'awaySpread', 'homeMoneyline', 'awayMoneyline',
  ]);

  for (const condition of conditions) {
    if (!validFields.has(condition.field)) {
      errors.push(`Unknown field: ${condition.field}`);
    }

    if (condition.operator === 'between' && condition.value2 === undefined) {
      errors.push(`'between' operator requires value2 for field: ${condition.field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Suggest conditions based on keywords
 */
export function suggestConditionsFromKeywords(keywords: string[]): Condition[] {
  const conditions: Condition[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const field = FIELD_KEYWORDS[normalizedKeyword];

    if (field) {
      // Add a default condition for the field
      conditions.push({
        field,
        operator: 'greater_than_or_equal',
        value: 0, // User should adjust
      });
    }
  }

  return conditions;
}
