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
  // Airtable trigger aliases
  | 'currentLead'      // Alias for absScoreDifferential
  | 'halftimeLead'     // Absolute halftime lead
  // Quarter scores
  | 'q1Home' | 'q1Away' | 'q1Total' | 'q1Differential'
  | 'q2Home' | 'q2Away' | 'q2Total' | 'q2Differential'
  | 'q3Home' | 'q3Away' | 'q3Total' | 'q3Differential'
  | 'q4Home' | 'q4Away' | 'q4Total' | 'q4Differential'
  | 'halftimeHome' | 'halftimeAway' | 'halftimeTotal' | 'halftimeDifferential'
  | 'firstHalfTotal' | 'secondHalfTotal'
  | 'status'
  // =========================================
  // PLAYER STATS FIELDS (V2 port)
  // =========================================
  | 'homePlayerWinPct'       // Home player win percentage
  | 'awayPlayerWinPct'       // Away player win percentage
  | 'homePlayerPpm'          // Home player points per match
  | 'awayPlayerPpm'          // Away player points per match
  | 'homePlayerGames'        // Home player games played
  | 'awayPlayerGames'        // Away player games played
  | 'homePlayerFormWins'     // Wins in home player's recent form
  | 'awayPlayerFormWins'     // Wins in away player's recent form
  // HEAD-TO-HEAD COMPARISON FIELDS
  | 'winPctDiff'             // homePlayerWinPct - awayPlayerWinPct
  | 'ppmDiff'                // homePlayerPpm - awayPlayerPpm
  | 'experienceDiff'         // homePlayerGames - awayPlayerGames
  // =========================================
  // DYNAMIC LEADING/LOSING TEAM FIELDS
  // =========================================
  | 'leadingTeamSpread'      // Spread for currently leading team
  | 'losingTeamSpread'       // Spread for currently losing team
  | 'leadingTeamMoneyline'   // ML for leading team
  | 'losingTeamMoneyline'    // ML for losing team
  // =========================================
  // ODDS FIELDS
  // =========================================
  | 'homeSpread'             // Home team spread
  | 'awaySpread'             // Away team spread
  | 'homeMoneyline'          // Home team moneyline
  | 'awayMoneyline';         // Away team moneyline

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

  // Odds requirement for two-stage system
  oddsRequirement?: OddsRequirement;

  // Strategy metadata
  expiryTimeQ4?: string;  // When to expire (e.g., "2:20" means 2:20 left in Q4)
  isTwoStage?: boolean;   // Does this strategy have both entry and close triggers?

  createdAt: string;
  updatedAt: string;
}

// ============================================
// SIGNAL TYPES - Two-Stage Signal System
// ============================================

/**
 * Signal Status Lifecycle:
 * - monitoring: Entry trigger fired, waiting for close trigger (two-stage strategies)
 * - watching: All game conditions met, waiting for odds to align
 * - bet_taken: Odds aligned, entry was available
 * - expired: Odds never aligned before 2:20 Q4
 * - won/lost/pushed: Final result after game ends
 */
export type SignalStatus =
  | 'monitoring'    // Entry trigger fired, waiting for close trigger
  | 'watching'      // Close trigger fired (or one-stage), waiting for odds
  | 'bet_taken'     // Odds aligned, bet was available
  | 'expired'       // Odds never aligned before cutoff (2:20 Q4)
  | 'won'           // Final result: win
  | 'lost'          // Final result: loss
  | 'pushed'        // Final result: push
  | 'closed';       // Manually closed

/**
 * Bet side - which team to bet on
 */
export type BetSide = 'leading_team' | 'trailing_team' | 'home' | 'away';

/**
 * Odds requirement type
 * - spread: Bet on spread (actual >= value means easier to cover)
 * - moneyline: Bet on ML (actual >= value means better payout)
 * - total_over: Bet over (actual <= value means easier to go over)
 * - total_under: Bet under (actual >= value means easier to stay under)
 */
export type OddsType = 'spread' | 'moneyline' | 'total_over' | 'total_under';

/**
 * Odds requirement for a strategy
 */
export interface OddsRequirement {
  type: OddsType;
  value: number; // e.g., -4.5 for spread, +150 for ML, 210.5 for total
  betSide: BetSide;
}

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

  // Two-stage tracking
  entryTriggerTime?: string;    // When entry trigger fired (stage 1)
  closeTriggerTime?: string;    // When close trigger fired (stage 2 for two-stage)
  oddsAlignedTime?: string;     // When odds became available
  expiryTime?: string;          // When signal expired (if it did)

  // Legacy fields for compatibility
  entryTime: string;
  closeTime?: string;

  // Odds at various stages
  entrySpread?: number;
  entryTotal?: number;
  entryML?: number;
  closeSpread?: number;
  closeTotal?: number;

  // Required vs actual odds
  requiredSpread?: number;      // What spread was needed
  actualSpreadAtEntry?: number; // What spread was when bet taken

  // Leading team tracking
  leadingTeamAtTrigger?: 'home' | 'away';
  leadingTeamSpreadAtEntry?: number;

  // Final results
  finalHomeScore?: number;
  finalAwayScore?: number;
  status: SignalStatus;
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

  // Two-stage tracking
  stage: 'monitoring' | 'watching';  // Current stage
  entryTriggerFired: boolean;        // Has entry trigger fired?
  closeTriggerFired: boolean;        // Has close trigger fired?
  leadingTeamAtTrigger?: 'home' | 'away';  // Who was leading when conditions met
  requiredSpread?: number;           // What spread is needed for this strategy
  oddsCheckStartTime?: string;       // When we started watching for odds
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

  // =========================================
  // FIELD ALIASES - Match Airtable trigger format
  // =========================================
  currentLead: number;      // Alias for absScoreDifferential
  halftimeLead: number;     // Absolute halftime lead

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

  // =========================================
  // PLAYER STATS (V2 port)
  // =========================================
  homePlayerWinPct: number | null;       // Home player win percentage
  awayPlayerWinPct: number | null;       // Away player win percentage
  homePlayerPpm: number | null;          // Home player points per match (avgPointsFor)
  awayPlayerPpm: number | null;          // Away player points per match
  homePlayerGames: number | null;        // Home player games played
  awayPlayerGames: number | null;        // Away player games played
  homePlayerFormWins: number | null;     // Wins in home player's last 10 games
  awayPlayerFormWins: number | null;     // Wins in away player's last 10 games

  // HEAD-TO-HEAD COMPARISONS
  winPctDiff: number | null;             // homePlayerWinPct - awayPlayerWinPct
  ppmDiff: number | null;                // homePlayerPpm - awayPlayerPpm
  experienceDiff: number | null;         // homePlayerGames - awayPlayerGames

  // =========================================
  // DYNAMIC LEADING/LOSING TEAM ODDS
  // =========================================
  leadingTeamSpread: number | null;      // Spread for currently leading team
  losingTeamSpread: number | null;       // Spread for currently losing team
  leadingTeamMoneyline: number | null;   // Moneyline for leading team
  losingTeamMoneyline: number | null;    // Moneyline for losing team

  // DIRECT ODDS FIELDS
  homeSpread: number | null;             // Home team spread
  awaySpread: number | null;             // Away team spread (typically -homeSpread)
  homeMoneyline: number | null;          // Home team moneyline
  awayMoneyline: number | null;          // Away team moneyline
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
// PLAYER TYPES
// ============================================

export interface Player {
  id: string;
  name: string;        // e.g., "KJMR", "HYPER", "EXO"
  teamName: string;    // e.g., "OKC Thunder"
  fullTeamName: string; // e.g., "OKC Thunder (KJMR)"

  // Career stats
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;

  // Scoring stats
  totalPointsFor: number;
  totalPointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  avgMargin: number;

  // Betting stats
  spreadRecord: { wins: number; losses: number; pushes: number };
  totalRecord: { overs: number; unders: number; pushes: number };
  atsWinRate: number;   // Against the spread win rate
  overRate: number;     // % of games going over

  // Recent form (last 10 games)
  recentForm: ('W' | 'L')[];
  streak: { type: 'W' | 'L'; count: number };

  // Metadata
  isActive: boolean;
  lastGameDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AirtablePlayerFields {
  Name: string;
  'Team Name'?: string;
  'Full Team Name'?: string;
  'Games Played'?: number;
  Wins?: number;
  Losses?: number;
  'Win Rate'?: number;
  'Total Points For'?: number;
  'Total Points Against'?: number;
  'Avg Points For'?: number;
  'Avg Points Against'?: number;
  'Avg Margin'?: number;
  'Spread Wins'?: number;
  'Spread Losses'?: number;
  'Spread Pushes'?: number;
  'Total Overs'?: number;
  'Total Unders'?: number;
  'Total Pushes'?: number;
  'ATS Win Rate'?: number;
  'Over Rate'?: number;
  'Recent Form'?: string;  // JSON array
  'Streak Type'?: 'W' | 'L';
  'Streak Count'?: number;
  'Is Active'?: boolean;
  'Last Game Date'?: string;
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

  // Flexible odds requirement fields
  'Odds Type'?: OddsType;          // spread, moneyline, total_over, total_under
  'Odds Value'?: number;           // e.g., -4.5, +150, 210.5
  'Bet Side'?: BetSide;            // leading_team, trailing_team, home, away
  'Expiry Time Q4'?: string;       // e.g., "2:20"
  'Is Two Stage'?: boolean;        // Does strategy have entry + close triggers?
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
  Status?: SignalStatus;
  Result?: 'win' | 'loss' | 'push';
  'Profit Loss'?: number;
  Notes?: string;

  // Two-stage tracking fields
  'Entry Trigger Time'?: string;    // When entry trigger fired
  'Close Trigger Time'?: string;    // When close trigger fired
  'Odds Aligned Time'?: string;     // When odds became available
  'Expiry Time'?: string;           // When signal expired
  'Required Spread'?: number;       // What spread was needed
  'Actual Spread At Entry'?: number; // Spread when bet was available
  'Leading Team At Trigger'?: 'home' | 'away';
  'Leading Team Spread'?: number;   // Leading team's spread when bet taken
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
