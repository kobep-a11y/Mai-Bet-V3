// ============================================
// GAME TYPES - Complete game data structure
// ============================================

export interface QuarterScores {
  q1Home: number;
  q1Away: number;
  q2Home: number;
  q2Away: number;
  q3Home: number;
  q3Away: number;
  q4Home: number;
  q4Away: number;
  otHome?: number;
  otAway?: number;
}

export interface HalftimeScores {
  home: number;
  away: number;
}

export interface FinalScores {
  home: number;
  away: number;
}

export interface LiveGame {
  id: string;
  eventId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  status: 'scheduled' | 'live' | 'halftime' | 'final';

  // Quarter-by-quarter scores
  quarterScores: QuarterScores;
  halftimeScores: HalftimeScores;
  finalScores: FinalScores;

  // Betting lines
  spread: number;
  mlHome: number;
  mlAway: number;
  total: number;

  // Metadata
  lastUpdate: string;
  rawData?: Record<string, unknown>;
}

// ============================================
// STRATEGY TYPES
// ============================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'contains';

export type ConditionField =
  | 'quarter'
  | 'timeRemaining'
  | 'timeRemainingSeconds'
  | 'homeScore'
  | 'awayScore'
  | 'totalScore'
  | 'scoreDifferential'
  | 'absScoreDifferential'
  | 'homeLeading'
  | 'awayLeading'
  | 'spread'
  | 'total'
  | 'q1Home' | 'q1Away' | 'q1Total' | 'q1Differential'
  | 'q2Home' | 'q2Away' | 'q2Total' | 'q2Differential'
  | 'q3Home' | 'q3Away' | 'q3Total' | 'q3Differential'
  | 'q4Home' | 'q4Away' | 'q4Total' | 'q4Differential'
  | 'halftimeHome' | 'halftimeAway' | 'halftimeTotal' | 'halftimeDifferential'
  | 'firstHalfTotal' | 'secondHalfTotal'
  | 'status';

export interface Condition {
  field: ConditionField | string;
  operator: ConditionOperator;
  value: number | string | boolean;
  value2?: number | string; // For 'between' operator
}

export interface StrategyTrigger {
  id: string;
  strategyId: string;
  name: string;
  conditions: Condition[];
  order: number;
  entryOrClose: 'entry' | 'close';
}

export interface DiscordWebhook {
  url: string;
  name: string; // e.g., "Main Signals", "Blowout Alerts"
  isActive: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerMode: 'sequential' | 'parallel';
  isActive: boolean;
  triggers: StrategyTrigger[];
  discordWebhooks: DiscordWebhook[]; // Multiple webhooks per strategy
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SIGNAL TYPES
// ============================================

export interface Signal {
  id: string;
  strategyId: string;
  strategyName: string;
  triggerId: string;
  triggerName: string;
  gameId: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  entryTime: string;
  closeTime?: string;
  entrySpread?: number;
  entryTotal?: number;
  closeSpread?: number;
  closeTotal?: number;
  finalHomeScore?: number;
  finalAwayScore?: number;
  status: 'active' | 'won' | 'lost' | 'pushed' | 'closed';
  result?: 'win' | 'loss' | 'push';
  profitLoss?: number;
  notes?: string;
  createdAt: string;
}

// Active signals tracking (in-memory)
export interface ActiveSignal {
  signalId: string;
  strategyId: string;
  gameId: string;
  triggeredAt: string;
  awaitingClose: boolean;
}

// ============================================
// TRIGGER EVALUATION TYPES
// ============================================

export interface TriggerEvaluationResult {
  triggered: boolean;
  strategy: Strategy;
  trigger: StrategyTrigger;
  game: LiveGame;
  matchedConditions: Condition[];
  failedConditions: Condition[];
}

export interface GameEvaluationContext {
  // Direct game fields
  quarter: number;
  timeRemaining: string;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  totalScore: number;
  scoreDifferential: number; // home - away (positive = home leading)
  absScoreDifferential: number;
  homeLeading: boolean;
  awayLeading: boolean;
  spread: number;
  total: number;
  status: string;

  // Quarter scores
  q1Home: number;
  q1Away: number;
  q1Total: number;
  q1Differential: number;
  q2Home: number;
  q2Away: number;
  q2Total: number;
  q2Differential: number;
  q3Home: number;
  q3Away: number;
  q3Total: number;
  q3Differential: number;
  q4Home: number;
  q4Away: number;
  q4Total: number;
  q4Differential: number;

  // Halftime
  halftimeHome: number;
  halftimeAway: number;
  halftimeTotal: number;
  halftimeDifferential: number;

  // Half totals
  firstHalfTotal: number;
  secondHalfTotal: number;
}

// ============================================
// HISTORICAL GAME TYPE (for Airtable storage)
// ============================================

export interface HistoricalGame {
  id: string;
  eventId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;

  // Final scores
  finalHomeScore: number;
  finalAwayScore: number;

  // Quarter scores
  q1Home: number;
  q1Away: number;
  q2Home: number;
  q2Away: number;
  halftimeHome: number;
  halftimeAway: number;
  q3Home: number;
  q3Away: number;
  q4Home: number;
  q4Away: number;

  // Game result
  winner: 'home' | 'away' | 'tie';
  totalPoints: number;
  pointDifferential: number;

  // Betting results
  spread?: number;
  total?: number;
  spreadResult?: 'home_cover' | 'away_cover' | 'push';
  totalResult?: 'over' | 'under' | 'push';

  // Metadata
  gameDate: string;
  rawData?: string; // JSON string of full data
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// AIRTABLE FIELD MAPPINGS
// ============================================

export interface AirtableStrategyFields {
  Name: string;
  Description?: string;
  'Trigger Mode'?: 'sequential' | 'parallel';
  'Is Active'?: boolean;
  'Discord Webhooks'?: string; // JSON string of DiscordWebhook[]
}

export interface AirtableTriggerFields {
  Name: string;
  Strategy?: string[];
  Conditions?: string; // JSON string of Condition[]
  Order?: number;
  'Entry Or Close'?: 'entry' | 'close';
}

export interface AirtableSignalFields {
  Name?: string;
  Strategy?: string[];
  'Strategy Name'?: string;
  'Trigger ID'?: string;
  'Trigger Name'?: string;
  'Game ID'?: string;
  'Event ID'?: string;
  'Home Team'?: string;
  'Away Team'?: string;
  'Home Score'?: number;
  'Away Score'?: number;
  Quarter?: number;
  'Time Remaining'?: string;
  'Entry Time'?: string;
  'Close Time'?: string;
  'Entry Spread'?: number;
  'Entry Total'?: number;
  'Close Spread'?: number;
  'Close Total'?: number;
  'Final Home Score'?: number;
  'Final Away Score'?: number;
  Status?: 'active' | 'won' | 'lost' | 'pushed' | 'closed';
  Result?: 'win' | 'loss' | 'push';
  'Profit Loss'?: number;
  Notes?: string;
}

export interface AirtableHistoricalGameFields {
  Name: string; // Event ID
  'Home Team'?: string;
  'Away Team'?: string;
  'Home Team ID'?: string;
  'Away Team ID'?: string;
  'Home Score'?: number;
  'Away Score'?: number;
  'Q1 Home'?: number;
  'Q1 Away'?: number;
  'Q2 Home'?: number;
  'Q2 Away'?: number;
  'Halftime Home'?: number;
  'Halftime Away'?: number;
  'Q3 Home'?: number;
  'Q3 Away'?: number;
  'Q4 Home'?: number;
  'Q4 Away'?: number;
  'Total Points'?: number;
  'Point Differential'?: number;
  Winner?: 'home' | 'away' | 'tie';
  Spread?: number;
  Total?: number;
  'Spread Result'?: 'home_cover' | 'away_cover' | 'push';
  'Total Result'?: 'over' | 'under' | 'push';
  'Game Date'?: string;
  'Raw Data'?: string;
}
