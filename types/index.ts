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

// ============================================
// MESSAGE TEMPLATE TYPES - Customizable Alerts
// ============================================

/**
 * Template types for different notification scenarios
 */
export type MessageTemplateType = 'signal' | 'bet_available' | 'game_result' | 'blowout' | 'close';

/**
 * Message template with customizable placeholders
 *
 * Available placeholders:
 *
 * Team/Player Info:
 *   {home_team}          - Full home team name (e.g., "OKC Thunder (KJMR)")
 *   {away_team}          - Full away team name
 *   {home_player}        - Home player name only (e.g., "KJMR")
 *   {away_player}        - Away player name only
 *   {winning_team}       - Team that won (final result alerts)
 *   {losing_team}        - Team that lost
 *   {leading_team}       - Currently leading team
 *   {trailing_team}      - Currently trailing team
 *   {bet_team}           - Team being bet on
 *   {bet_player}         - Player being bet on
 *
 * Score Info:
 *   {home_score}         - Current/final home score
 *   {away_score}         - Current/final away score
 *   {total_score}        - Combined score
 *   {current_lead}       - Current point lead
 *   {trigger_lead}       - Lead when trigger fired
 *   {final_lead}         - Final game lead
 *   {score_display}      - Formatted "away - home" display
 *
 * Game State:
 *   {quarter}            - Current quarter (1-4)
 *   {game_time}          - Time remaining in quarter
 *   {status}             - Game status (live, halftime, final)
 *   {game_id}            - Event ID
 *
 * Strategy/Trigger Info:
 *   {strategy_name}      - Name of strategy
 *   {trigger_name}       - Name of trigger that fired
 *   {signal_id}          - Signal ID
 *
 * Odds Info:
 *   {home_spread}        - Current home spread
 *   {away_spread}        - Current away spread
 *   {spread}             - Generic spread value
 *   {total_line}         - Over/under line
 *   {trigger_home_spread} - Home spread when trigger fired
 *   {trigger_away_spread} - Away spread when trigger fired
 *   {required_spread}    - Required spread for bet
 *   {entry_spread}       - Spread when bet was taken
 *   {home_ml}            - Home moneyline
 *   {away_ml}            - Away moneyline
 *   {leading_team_spread} - Spread for leading team
 *   {trailing_team_spread} - Spread for trailing team
 *
 * Result Info (for close/result alerts):
 *   {result}             - "WIN", "LOSS", or "PUSH"
 *   {result_emoji}       - ✅, ❌, or ➖
 */
export interface MessageTemplate {
  type: MessageTemplateType;
  template: string;
  format?: 'text' | 'embed'; // Text for SMS, embed for Discord
}

/**
 * All available placeholder keys for message templates
 */
export type TemplatePlaceholder =
  // Team/Player
  | 'home_team'
  | 'away_team'
  | 'home_player'
  | 'away_player'
  | 'winning_team'
  | 'losing_team'
  | 'leading_team'
  | 'trailing_team'
  | 'bet_team'
  | 'bet_player'
  // Scores
  | 'home_score'
  | 'away_score'
  | 'total_score'
  | 'current_lead'
  | 'trigger_lead'
  | 'final_lead'
  | 'score_display'
  // Game State
  | 'quarter'
  | 'game_time'
  | 'status'
  | 'game_id'
  // Strategy/Trigger
  | 'strategy_name'
  | 'trigger_name'
  | 'signal_id'
  // Odds
  | 'home_spread'
  | 'away_spread'
  | 'spread'
  | 'total_line'
  | 'trigger_home_spread'
  | 'trigger_away_spread'
  | 'required_spread'
  | 'entry_spread'
  | 'home_ml'
  | 'away_ml'
  | 'leading_team_spread'
  | 'trailing_team_spread'
  // Results
  | 'result'
  | 'result_emoji';

/**
 * Context object containing all values for template placeholder replacement
 */
export interface TemplateContext {
  // Team/Player
  homeTeam?: string;
  awayTeam?: string;
  homePlayer?: string;
  awayPlayer?: string;
  winningTeam?: string;
  losingTeam?: string;
  leadingTeam?: string;
  trailingTeam?: string;
  betTeam?: string;
  betPlayer?: string;
  // Scores
  homeScore?: number;
  awayScore?: number;
  totalScore?: number;
  currentLead?: number;
  triggerLead?: number;
  finalLead?: number;
  // Game State
  quarter?: number;
  gameTime?: string;
  status?: string;
  gameId?: string;
  // Strategy/Trigger
  strategyName?: string;
  triggerName?: string;
  signalId?: string;
  // Odds
  homeSpread?: number;
  awaySpread?: number;
  spread?: number;
  totalLine?: number;
  triggerHomeSpread?: number;
  triggerAwaySpread?: number;
  requiredSpread?: number;
  entrySpread?: number;
  homeMl?: number;
  awayMl?: number;
  leadingTeamSpread?: number;
  trailingTeamSpread?: number;
  // Results
  result?: 'win' | 'loss' | 'push';
}

// ============================================
// RULE TYPES - Strategy Execution Rules
// ============================================

export type RuleType =
  | 'first_half_only'      // Block if Q > 2
  | 'second_half_only'     // Block if Q < 3
  | 'specific_quarter'     // Block if not in specific quarter
  | 'exclude_overtime'     // Block if Q > 4
  | 'stop_at'              // Block after Q + time (e.g., Q4 2:20)
  | 'minimum_score';       // Block if total score < threshold

export interface Rule {
  type: RuleType;
  value?: number | string;  // e.g., quarter number, "Q4 2:20", score threshold
}

// ============================================
// WIN REQUIREMENT TYPES - Outcome Determination
// ============================================

/**
 * Win Requirement Types for determining bet outcomes
 * These define HOW a bet wins/loses based on final game state
 *
 * Difference from OddsRequirement:
 * - OddsRequirement: Determines WHEN to take a bet (spread alignment)
 * - WinRequirement: Determines IF the bet WON based on game result
 */
export type WinRequirementType =
  | 'leading_team_wins'    // Leading team at signal time must win game
  | 'home_wins'            // Home team must win
  | 'away_wins'            // Away team must win
  | 'final_lead_gte'       // Final lead must be >= threshold
  | 'final_lead_lte';      // Final lead must be <= threshold

export interface WinRequirement {
  type: WinRequirementType;
  value?: number;  // For final_lead_gte/lte (e.g., 5 means "must win by 5+")
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

  // Strategy execution rules
  rules?: Rule[];

  // Win requirements for outcome determination
  winRequirements?: WinRequirement[];

  // Custom message templates
  messageTemplates?: MessageTemplate[];

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

  // Win requirements (stored at signal creation for outcome calculation)
  winRequirements?: WinRequirement[];
  leadMarginAtTrigger?: number;  // Lead amount when signal was created (for final_lead_* requirements)

  // Final results
  finalHomeScore?: number;
  finalAwayScore?: number;
  status: SignalStatus;
  result?: 'win' | 'loss' | 'push';
  profitLoss?: number;
  notes?: string;
  createdAt: string;

  // Trigger history (for tracking sequential triggers)
  triggerHistory?: TriggerHistoryEntry[];  // Complete history of triggers that led to this signal
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

  // Trigger history tracking (for sequential evaluation)
  triggerSnapshots: TriggerSnapshot[];       // All trigger snapshots that led to this signal
  lastTriggerSnapshot?: TriggerSnapshot;     // Most recent trigger snapshot (for prev_leader_* calculations)
}

// ============================================
// TRIGGER SNAPSHOT & HISTORY TYPES
// ============================================

/**
 * Snapshot of game state when a trigger fires
 * Used for tracking previous trigger states in sequential evaluation
 */
export interface TriggerSnapshot {
  triggerId: string;
  triggerName: string;
  timestamp: string;
  quarter: number;
  timeRemaining: string;
  homeScore: number;
  awayScore: number;
  leadingTeam: 'home' | 'away' | 'tie';
  leadAmount: number;
  homeSpread?: number;
  awaySpread?: number;
  totalLine?: number;
}

/**
 * Entry in the trigger history array
 * Tracks each trigger that fired in the sequence leading to a signal
 */
export interface TriggerHistoryEntry {
  triggerId: string;
  triggerName: string;
  timestamp: string;
  snapshot: TriggerSnapshot;
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

  // =========================================
  // PREVIOUS LEADER FIELDS (for sequential modes)
  // Reference V2: lines 1314-1358
  // =========================================
  prev_leader_still_leads: number | null;      // 1 if prev trigger's leader still leads, 0 otherwise
  prev_leader_current_score: number | null;    // Current score of prev leader
  prev_trailer_current_score: number | null;   // Current score of prev trailer
  prev_leader_current_margin: number | null;   // Current margin from prev leader's perspective
  prev_leader_was_home: number | null;         // 1 if prev leader was home team, 0 otherwise
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
  Rules?: string;                  // JSON string of Rule[]
  'Win Requirements'?: string;     // JSON string of WinRequirement[]
  'Message Templates'?: string;    // JSON string of MessageTemplate[]
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

  // Trigger history tracking
  'Trigger History'?: string;       // JSON string of TriggerHistoryEntry[]

  // Win requirements tracking (for auto-outcome calculation)
  'Win Requirements'?: string;      // JSON string of WinRequirement[]
  'Lead Margin At Trigger'?: number; // Lead amount when signal was created
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

// ============================================
// TIMELINE SNAPSHOTS - For backtesting
// ============================================

/**
 * Snapshot Type - when the snapshot was captured
 */
export type TimelineSnapshotType =
  | 'game_start'   // Captured when game first appears
  | 'quarter_end'  // End of Q1, Q3, Q4
  | 'halftime'     // End of Q2
  | 'game_end'     // Final game state
  | 'periodic'     // Regular interval snapshots
  | 'odds_update'; // Significant odds movement

/**
 * Player stats at snapshot time (for backtesting)
 */
export interface PlayerStatsSnapshot {
  playerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  recentForm: string; // JSON array as string
  streakType: 'W' | 'L';
  streakCount: number;
}

/**
 * Timeline Snapshot - game state at a point in time
 */
export interface TimelineSnapshot {
  id?: string;
  eventId: string;
  snapshotType: TimelineSnapshotType;
  timestamp: string;

  // Game state
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  status: 'scheduled' | 'live' | 'halftime' | 'final';

  // Odds at this point
  spread?: number;
  total?: number;
  mlHome?: number;
  mlAway?: number;

  // Opening odds (only set on game_start snapshot)
  openingSpread?: number;
  openingTotal?: number;
  openingMlHome?: number;
  openingMlAway?: number;

  // Player stats at snapshot time
  homePlayerStats?: PlayerStatsSnapshot;
  awayPlayerStats?: PlayerStatsSnapshot;

  // Metadata
  notes?: string;
}

/**
 * Airtable fields for Timeline Snapshots table
 *
 * Table Schema:
 * - Name (Primary): eventId-snapshotType-timestamp
 * - Event ID (Text): Game event ID
 * - Snapshot Type (Single Select): game_start, quarter_end, halftime, game_end, periodic, odds_update
 * - Timestamp (Date/Time): When snapshot was captured
 * - Home Team (Text): Home team name
 * - Away Team (Text): Away team name
 * - Home Score (Number): Home team score
 * - Away Score (Number): Away team score
 * - Quarter (Number): Current quarter (1-4, 5 for OT)
 * - Time Remaining (Text): Time remaining in quarter (e.g., "5:30")
 * - Status (Single Select): scheduled, live, halftime, final
 * - Spread (Number): Current spread
 * - Total (Number): Current total line
 * - ML Home (Number): Home moneyline
 * - ML Away (Number): Away moneyline
 * - Opening Spread (Number): Opening spread
 * - Opening Total (Number): Opening total line
 * - Opening ML Home (Number): Opening home moneyline
 * - Opening ML Away (Number): Opening away moneyline
 * - Home Player Stats (Long Text): JSON string of PlayerStatsSnapshot
 * - Away Player Stats (Long Text): JSON string of PlayerStatsSnapshot
 * - Notes (Long Text): Additional notes
 */
export interface AirtableTimelineSnapshotFields {
  Name: string; // eventId-snapshotType-timestamp
  'Event ID': string;
  'Snapshot Type': TimelineSnapshotType;
  Timestamp: string;

  // Game state
  'Home Team'?: string;
  'Away Team'?: string;
  'Home Score'?: number;
  'Away Score'?: number;
  Quarter?: number;
  'Time Remaining'?: string;
  Status?: 'scheduled' | 'live' | 'halftime' | 'final';

  // Current odds
  Spread?: number;
  Total?: number;
  'ML Home'?: number;
  'ML Away'?: number;

  // Opening odds
  'Opening Spread'?: number;
  'Opening Total'?: number;
  'Opening ML Home'?: number;
  'Opening ML Away'?: number;

  // Player stats (stored as JSON strings)
  'Home Player Stats'?: string;
  'Away Player Stats'?: string;

  Notes?: string;
}

// ============================================
// SMS TYPES - SMS Notifications
// ============================================

/**
 * SMS Alert Types that can be subscribed to
 */
export type SMSAlertType = 'bet_available' | 'game_result' | 'blowout';

/**
 * SMS Recipient - A person who can receive SMS notifications
 *
 * Airtable Table: SMS Recipients
 * - Name (Primary): Recipient name
 * - Phone (Text): Phone number (E.164 format recommended, e.g., +1234567890)
 * - Is Active (Checkbox): Whether recipient should receive messages
 */
export interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * SMS Subscription - Links a recipient to a strategy for specific alert types
 *
 * Airtable Table: SMS Subscriptions
 * - Name (Primary/Formula): Auto-generated from recipient + strategy
 * - Recipient ID (Link to SMS Recipients): Which recipient
 * - Strategy ID (Link to Strategies): Which strategy
 * - Alert Types (Long Text): JSON array of alert types, e.g., ["bet_available", "game_result"]
 * - Is Active (Checkbox): Whether subscription is active
 */
export interface SMSSubscription {
  id: string;
  recipientId: string;
  strategyId: string;
  alertTypes: SMSAlertType[];
  isActive: boolean;
}

/**
 * Airtable fields for SMS Recipients table
 */
export interface AirtableSMSRecipientFields {
  Name: string;
  Phone: string;
  'Is Active'?: boolean;
}

/**
 * Airtable fields for SMS Subscriptions table
 */
export interface AirtableSMSSubscriptionFields {
  Name?: string;
  'Recipient ID': string[]; // Link to SMS Recipients
  'Strategy ID': string[];  // Link to Strategies
  'Alert Types'?: string;   // JSON array of SMSAlertType
  'Is Active'?: boolean;
}
