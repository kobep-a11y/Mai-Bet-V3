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

export interface Condition {
  field: string;
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

export interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerMode: 'sequential' | 'parallel';
  isActive: boolean;
  triggers: StrategyTrigger[];
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
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  entryTime: string;
  closeTime?: string;
  entryValue?: number;
  closeValue?: number;
  status: 'active' | 'won' | 'lost' | 'pushed';
  notes?: string;
  createdAt: string;
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
}

export interface AirtableTriggerFields {
  Name: string;
  Strategy?: string[];
  Conditions?: string;
  Order?: number;
  'Entry Or Close'?: 'entry' | 'close';
}

export interface AirtableSignalFields {
  Name?: string;
  Strategy?: string[];
  'Game ID'?: string;
  'Entry Time'?: string;
  'Close Time'?: string;
  'Entry Value'?: number;
  'Close Value'?: number;
  Status?: 'active' | 'won' | 'lost' | 'pushed';
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
  'Game Date'?: string;
  'Raw Data'?: string;
}
