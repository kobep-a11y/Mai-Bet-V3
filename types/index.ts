// MAI Bets V3 - Type Definitions

// ============================================
// Live Game Types (Real-time from N8N webhook)
// ============================================

export interface LiveGame {
  id: string;
  event_id: string;
  league: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished';
  spread_home: number;
  spread_away: number;
  moneyline_home: number;
  moneyline_away: number;
  total_line: number;
  home_lead: number;
  away_lead: number;
  halftime_home_score?: number;
  halftime_away_score?: number;
  halftime_lead?: number;
  created_at: string;
  updated_at: string;
}

export interface LiveGameOdds {
  id: string;
  game_id: string;
  spread_home: number;
  spread_away: number;
  moneyline_home: number;
  moneyline_away: number;
  total_line: number;
  timestamp: string;
}

// ============================================
// Strategy Types (Airtable-backed)
// ============================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'between'
  | 'not_between';

export type ConditionField =
  | 'current_lead'
  | 'halftime_lead'
  | 'quarter'
  | 'spread_vs_lead'
  | 'moneyline_home'
  | 'moneyline_away'
  | 'total_score'
  | 'home_score'
  | 'away_score';

export type WinRequirement =
  | 'team_wins'
  | 'team_covers_spread'
  | 'lead_maintained'
  | 'total_over'
  | 'total_under';

export interface StrategyCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: number;
  value2?: number; // For 'between' operator
}

export interface StrategyTrigger {
  id: string;
  strategy_id: string;
  name: string;
  order_index: number;
  entry_conditions: StrategyCondition[];
  close_conditions: StrategyCondition[];
  win_requirement: WinRequirement;
  is_active: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  trigger_mode: 'sequential' | 'parallel';
  is_active: boolean;
  triggers: StrategyTrigger[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Signal Types
// ============================================

export type SignalStatus = 'pending' | 'active' | 'won' | 'lost' | 'closed';

export interface Signal {
  id: string;
  game_id: string;
  strategy_id: string;
  trigger_id: string;
  team: 'home' | 'away';
  entry_quarter: number;
  entry_lead: number;
  entry_spread: number;
  entry_moneyline: number;
  entry_time: string;
  close_quarter?: number;
  close_lead?: number;
  close_time?: string;
  status: SignalStatus;
  result?: 'win' | 'loss' | 'push';
  notes?: string;
  discord_sent: boolean;
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Historical Data Types
// ============================================

export interface HistoricalGame {
  id: string;
  event_id: string;
  league: string;
  home_team: string;
  away_team: string;
  final_home_score: number;
  final_away_score: number;
  halftime_home_score: number;
  halftime_away_score: number;
  opening_spread_home: number;
  opening_moneyline_home: number;
  opening_moneyline_away: number;
  opening_total: number;
  game_date: string;
  created_at: string;
}

// ============================================
// Webhook Payload Types
// ============================================

export interface WebhookGamePayload {
  event_id: string;
  league: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished';
  odds?: {
    spread_home: number;
    spread_away: number;
    moneyline_home: number;
    moneyline_away: number;
    total_line: number;
  };
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ============================================
// Airtable Record Types
// ============================================

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableStrategyFields {
  Name: string;
  Description: string;
  'Trigger Mode': 'sequential' | 'parallel';
  'Is Active': boolean;
}

export interface AirtableTriggerFields {
  Name: string;
  'Strategy ID': string[];
  'Order Index': number;
  'Entry Conditions': string; // JSON string
  'Close Conditions': string; // JSON string
  'Win Requirement': WinRequirement;
  'Is Active': boolean;
}

export interface AirtableSignalFields {
  'Game ID': string;
  'Strategy ID': string[];
  'Trigger ID': string[];
  Team: 'home' | 'away';
  'Entry Quarter': number;
  'Entry Lead': number;
  'Entry Spread': number;
  'Entry Moneyline': number;
  'Entry Time': string;
  'Close Quarter'?: number;
  'Close Lead'?: number;
  'Close Time'?: string;
  Status: SignalStatus;
  Result?: 'win' | 'loss' | 'push';
  Notes?: string;
  'Discord Sent': boolean;
  'SMS Sent': boolean;
}

export interface AirtableHistoricalGameFields {
  'Event ID': string;
  League: string;
  'Home Team': string;
  'Away Team': string;
  'Final Home Score': number;
  'Final Away Score': number;
  'Halftime Home Score': number;
  'Halftime Away Score': number;
  'Opening Spread Home': number;
  'Opening ML Home': number;
  'Opening ML Away': number;
  'Opening Total': number;
  'Game Date': string;
}
