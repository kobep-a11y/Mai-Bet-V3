# MAI Bets V3 - Task Delegation Guide

**Purpose:** This file organizes remaining work into independent task categories that can be worked on in parallel by multiple Claude Code instances.

**How to Use:**
1. Open a new Claude Code instance
2. Point it to one of the task categories below
3. Have it work through the tasks in that category
4. Mark tasks as complete when done

---

## Task Category Overview

| Category | Focus Area | Estimated Effort | Dependencies |
|----------|------------|------------------|--------------|
| A | Strategy Rules & Logic | 3 hours | None |
| B | Outcomes & Win Requirements | 4 hours | None |
| C | Trigger State & History | 5 hours | None |
| D | Alerts & Notifications | 4 hours | None |
| E | UI Dashboard Enhancements | 4 hours | None |
| F | AI Features | 10+ hours | Categories A, B |
| G | Utilities & Maintenance | 4 hours | None |

---

## Category A: Strategy Rules & Logic

**Instance Prompt:**
> "Work on implementing the Strategy Rules system for MAI Bets V3. Focus on the files and tasks listed under Category A in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### A1. Add Rule Types (types/index.ts)
```typescript
// Add these types to types/index.ts

type RuleType =
  | 'first_half_only'      // Block if Q > 2
  | 'second_half_only'     // Block if Q < 3
  | 'specific_quarter'     // Block if not in specific quarter
  | 'exclude_overtime'     // Block if Q > 4
  | 'stop_at'              // Block after Q + time (e.g., Q4 2:20)
  | 'minimum_score';       // Block if total score < threshold

interface Rule {
  type: RuleType;
  value?: number | string;  // e.g., quarter number, "Q4 2:20", score threshold
}

// Add to Strategy interface:
// rules?: Rule[];
```
**Status:** [x] Complete

#### A2. Implement passesRules() Function (lib/trigger-engine.ts)
- Create function that evaluates all rules for a strategy
- Return false if any rule blocks the strategy
- Handle each rule type: first_half_only, second_half_only, specific_quarter, exclude_overtime, stop_at, minimum_score
- Reference V2: `passesRules()` in game-update/index.ts lines 789-838

**Status:** [x] Complete

#### A3. Parse Rules from Airtable (lib/strategy-service.ts)
- Add rules parsing when fetching strategies
- Rules should be stored as JSON string in Airtable "Rules" field
- Parse and validate rules on strategy load

**Status:** [x] Complete

#### A4. Integrate Rules Check in Webhook
- File: `app/api/webhook/game-update/route.ts`
- Call passesRules() before trigger evaluation
- Skip strategy if rules fail
- Log when rules block a strategy

**Status:** [x] Complete

#### A5. Add Tests for Rules
- Test first_half_only blocks Q3/Q4
- Test stop_at with various time formats
- Test minimum_score threshold

**Status:** [x] Complete

---

## Category B: Outcomes & Win Requirements

**Instance Prompt:**
> "Work on implementing the Win Requirements and Auto-Outcome system for MAI Bets V3. Focus on the files and tasks listed under Category B in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### B1. Add Win Requirement Types (types/index.ts)
```typescript
type WinRequirementType =
  | 'leading_team_wins'    // Leading team at signal must win game
  | 'home_wins'            // Home team must win
  | 'away_wins'            // Away team must win
  | 'final_lead_gte'       // Final lead >= threshold
  | 'final_lead_lte';      // Final lead <= threshold

interface WinRequirement {
  type: WinRequirementType;
  value?: number;  // For final_lead_gte/lte
}

// Add to Strategy interface:
// winRequirements?: WinRequirement[];
```
**Status:** [x] Complete

#### B2. Create Outcome Service (lib/outcome-service.ts)
- Create new file with outcome calculation logic
- `evaluateOutcome(signal, finalGameState)` - returns 'win' | 'loss' | 'push'
- Handle each win requirement type
- Store leading team at trigger time for 'leading_team_wins'
- Reference V2: `auto-outcome/index.ts`

**Status:** [x] Complete

#### B3. Store Win Requirements with Signals
- Modify signal creation to store win requirements
- Store leading team at trigger time in signal snapshot
- Add fields to ActiveSignal and Signal types

**Status:** [x] Complete

#### B4. Create Outcome Calculation Cron Endpoint
- File: `app/api/cron/calculate-outcomes/route.ts`
- Fetch finished games with unresolved signals
- Calculate outcome for each signal
- Update signal status in Airtable
- Update bankroll if applicable

**Status:** [x] Complete

#### B5. Integrate Outcome Calculation on Game End
- In webhook, detect when game ends
- Trigger outcome calculation for that game's signals
- Send Discord notification with outcome

**Status:** [x] Complete

---

## Category C: Trigger State & History

**Instance Prompt:**
> "Work on implementing Previous Trigger State tracking and Trigger History storage for MAI Bets V3. Focus on the files and tasks listed under Category C in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### C1. Add Trigger Snapshot Types (types/index.ts)
```typescript
interface TriggerSnapshot {
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

interface TriggerHistoryEntry {
  triggerId: string;
  triggerName: string;
  timestamp: string;
  snapshot: TriggerSnapshot;
}
```
**Status:** [x] Complete

#### C2. Store Trigger Snapshots in Active Signals
- Modify ActiveSignal to include triggerSnapshots array
- Capture snapshot each time a trigger fires
- Store previous trigger info for sequential evaluation

**Status:** [x] Complete

#### C3. Add Previous Leader Fields to Evaluation Context
Add these fields to GameEvaluationContext:
```typescript
// Previous trigger state (for sequential modes)
prev_leader_still_leads: number;      // 1 if prev trigger's leader still leads
prev_leader_current_score: number;    // Current score of prev leader
prev_trailer_current_score: number;   // Current score of prev trailer
prev_leader_current_margin: number;   // Current margin from prev leader's perspective
prev_leader_was_home: number;         // 1 if prev leader was home team
```
- Reference V2: lines 1314-1358

**Status:** [x] Complete

#### C4. Calculate Previous Leader Fields
- In createEvaluationContext(), add logic to calculate prev_leader_* fields
- Pass previous trigger snapshot when evaluating sequential triggers
- Handle case when no previous trigger exists

**Status:** [x] Complete

#### C5. Build Trigger History Array
- When signal moves to watching/bet_taken, build complete trigger history
- Store all trigger snapshots that led to the signal
- Include in signal when saved to Airtable

**Status:** [x] Complete

#### C6. Display Trigger Timeline in UI (Optional)
- Show trigger history on signal detail view
- Display each trigger with timestamp and snapshot data

**Status:** [x] Complete

---

## Category D: Alerts & Notifications ✅ COMPLETE

**Instance Prompt:**
> "Work on enhancing the Alerts and Notifications system for MAI Bets V3. Focus on message templates and SMS alerts as listed under Category D in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### D1. Add Message Template Types
```typescript
// Add to types/index.ts
interface MessageTemplate {
  type: 'signal' | 'bet_available' | 'game_result';
  template: string;  // Template with placeholders
}

// Available placeholders:
// {home_team}, {away_team}, {winning_team}, {losing_team}
// {home_score}, {away_score}, {current_lead}, {trigger_lead}
// {quarter}, {game_time}, {strategy_name}
// {home_spread}, {away_spread}, {total_line}
// {trigger_home_spread}, {trigger_away_spread}
```
**Status:** [x] Complete

#### D2. Implement formatMessageTemplate() Function
- File: `lib/discord-service.ts`
- Create function to replace placeholders with actual values
- Handle missing values gracefully
- Support 20+ placeholder types from V2

**Status:** [x] Complete

#### D3. Update Discord Service to Use Templates
- Check if strategy has custom template
- Use template if provided, fall back to default embed
- Test with various template formats

**Status:** [x] Complete

#### D4. Create SMS Service (lib/sms-service.ts)
- Create new file for SMS functionality
- Integrate with Twilio or similar provider
- `sendSMS(recipient, message)` function
- Rate limiting and error handling

**Status:** [x] Complete

#### D5. Create Airtable Tables for SMS
- SMS Recipients table (phone, name, active)
- SMS Subscriptions table (recipient_id, strategy_id, alert_types)

**Status:** [x] Complete (types documented in types/index.ts)

#### D6. Add SMS Sending to Signal Alerts
- When sending Discord alert, also send SMS if configured
- Check SMS subscriptions for strategy
- Format message appropriately for SMS (shorter format)

**Status:** [x] Complete

---

## Category E: UI Dashboard Enhancements ✅ COMPLETE

**Instance Prompt:**
> "Work on enhancing the UI Dashboard for MAI Bets V3. Focus on the Strategy Builder and Signal History views as listed under Category E in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### E1. Strategy Builder UI
- Create new page: `app/strategies/builder/page.tsx`
- Form for creating/editing strategies
- Trigger condition builder with operators
- Rules configuration section
- Win requirements selection
- Discord webhook configuration

**Status:** [x] Complete
**Implementation:** Created dedicated builder page with collapsible sections, 60+ condition fields organized by category, AI Builder mode for natural language strategy creation, and AI Discovery mode for pattern analysis.

#### E2. Strategy Editor UI
- Edit existing strategies
- Show current triggers and conditions
- Allow adding/removing triggers
- Save changes to Airtable

**Status:** [x] Complete
**Implementation:** Builder page supports editing via `?edit=strategyId` query param. Loads existing strategy data, conditions, rules, and allows full modification.

#### E3. Signal History with Trigger Timeline
- Enhance signals page to show trigger history
- Timeline view showing each trigger that fired
- Snapshot data for each trigger
- Filter by strategy, date, outcome

**Status:** [x] Complete
**Implementation:** Added `TriggerTimeline` component with visual timeline, color-coded events (entry, close, odds, expiry), snapshot details display, and comprehensive filtering by strategy, date range, and outcome.

#### E4. Real-time Updates
- Add polling or WebSocket for live updates
- Show signal status changes in real-time
- Update game scores automatically

**Status:** [x] Complete
**Implementation:** Added connection status indicator (connected/connecting/disconnected), countdown timer for next refresh, auto-pause on tab switch, visual refresh states, and improved refresh button with loading state.

#### E5. Analytics Enhancements
- Add charts for win/loss by strategy
- ROI tracking over time
- Filter by date range, strategy, sport

**Status:** [x] Complete
**Implementation:** Added Win Rate Trend chart (SVG line chart with cumulative performance), ROI Chart (profit/loss in units over time), improved stacked bar chart with tooltips, and comprehensive filters for strategy and date range (7D/30D/90D/All).

---

## Category F: AI Features

**Instance Prompt:**
> "Work on implementing AI Features for MAI Bets V3. Focus on the AI Strategy Builder and Discovery systems as listed under Category F in PROJECT_ROADMAP_DELEGATION.md"

**Note:** This category depends on Categories A and B being mostly complete.

### Tasks

#### F1. AI Strategy Builder (lib/ai/strategy-builder.ts)
- Create AI service for natural language strategy creation
- Parse user descriptions into trigger conditions
- Generate rules and win requirements
- Reference V2: `ai-strategy-builder/index.ts`

**Status:** [ ] Not Started

#### F2. AI Strategy Builder Endpoint
- File: `app/api/ai/build-strategy/route.ts`
- Accept natural language description
- Return structured strategy configuration
- Validate generated strategy

**Status:** [ ] Not Started

#### F3. AI Strategy Discovery (lib/ai/strategy-discovery.ts)
- Analyze historical data for patterns
- Identify potentially profitable strategies
- Generate strategy suggestions
- Reference V2: `ai-discover-strategies/index.ts`

**Status:** [ ] Not Started

#### F4. AI Discovery Endpoint
- File: `app/api/ai/discover/route.ts`
- Accept parameters (date range, sport, filters)
- Return discovered patterns and suggested strategies

**Status:** [ ] Not Started

#### F5. AI Features UI
- Add AI builder interface to strategies page
- Natural language input for strategy creation
- Display discovered strategies with stats
- One-click creation from AI suggestions

**Status:** [ ] Not Started

---

## Category G: Utilities & Maintenance ✅ COMPLETE

**Instance Prompt:**
> "Work on implementing Utility features for MAI Bets V3. Focus on data cleanup and recalculation tools as listed under Category G in PROJECT_ROADMAP_DELEGATION.md"

### Tasks

#### G1. Data Cleanup Utility (lib/cleanup-service.ts)
- Create service for cleaning old data
- Remove stale active signals
- Archive old games
- Clear temporary cache data
- Reference V2: `data-cleanup/index.ts`

**Status:** [x] Complete
**Implementation:** Created `lib/cleanup-service.ts` with functions for cleaning stale signals, old games, duplicates, and archiving historical data. Includes `runFullCleanup()` for comprehensive cleanup.

#### G2. Cleanup Cron Endpoint
- File: `app/api/cron/cleanup/route.ts`
- Run cleanup on schedule
- Configurable retention periods
- Log cleanup actions

**Status:** [x] Complete
**Implementation:** Created `app/api/cron/cleanup/route.ts` with GET (scheduled) and POST (custom) endpoints. Supports operations: full, signals, games, duplicates, expire, archive.

#### G3. Recalculate Outcomes Utility
- File: `lib/recalculate-service.ts`
- Batch recalculation of signal outcomes
- Useful when win requirement logic changes
- Reference V2: `recalculate-outcomes/index.ts`

**Status:** [x] Complete
**Implementation:** Created `lib/recalculate-service.ts` with `recalculateByIds()`, `recalculateByDateRange()`, `recalculateByStrategy()`, and `recalculateAll()` functions.

#### G4. Recalculate Endpoint
- File: `app/api/admin/recalculate-outcomes/route.ts`
- Accept date range or specific signal IDs
- Return summary of recalculated outcomes

**Status:** [x] Complete
**Implementation:** Created `app/api/admin/recalculate-outcomes/route.ts` with POST endpoint supporting multiple operation modes with safety confirmation for bulk operations.

#### G5. Timeline Snapshots Service
- File: `lib/timeline-service.ts`
- Capture game state at start for backtesting
- Store player stats at game start
- Store opening odds
- Add backfill logic for late odds

**Status:** [x] Complete
**Implementation:** Created `lib/timeline-service.ts` with snapshot capture functions for game lifecycle (start, periodic, quarter, halftime, end), odds updates, and backfill logic.

#### G6. Create Timeline Snapshots Airtable Table
- Design table schema
- Add fields for player stats, odds, timestamps
- Create indexes for efficient querying

**Status:** [x] Complete
**Implementation:** Added `AirtableTimelineSnapshotFields` interface to `types/index.ts` with complete table schema documentation.

---

## Progress Tracking

### Quick Status Reference
Use these markers when updating task status:
- `[ ]` Not Started
- `[~]` In Progress
- `[x]` Complete
- `[!]` Blocked

### Completion Checklist

| Category | Tasks | Complete | Notes |
|----------|-------|----------|-------|
| A: Strategy Rules | 5 | 5/5 | ✅ Complete |
| B: Outcomes | 5 | 5/5 | ✅ Complete |
| C: Trigger State | 6 | 6/6 | ✅ Complete |
| D: Alerts | 6 | 6/6 | ✅ Complete |
| E: UI | 5 | 5/5 | ✅ Complete |
| F: AI | 5 | 0/5 | Depends on A, B |
| G: Utilities | 6 | 6/6 | ✅ Complete |
| **Total** | **38** | **33/38** | |

---

## Inter-Category Dependencies

```
Category A (Strategy Rules)
    └── Category F (AI) - needs rules system

Category B (Outcomes)
    └── Category F (AI) - needs win requirements

Category C (Trigger State)
    └── Category E (UI) - for trigger timeline display

Category D (Alerts)
    └── No dependencies

Category E (UI)
    └── Categories A, B, C for data to display

Category G (Utilities)
    └── No dependencies
```

---

## Notes for Claude Code Instances

1. **Read PROJECT_ROADMAP.md first** - Understand the full context before starting
2. **Check existing code** - Many patterns already exist in the codebase
3. **Reference V2 code** - Located at `/sessions/eloquent-wonderful-dijkstra/v2-framework/game-pulse-keeper-main/supabase/functions/`
4. **Update this file** - Mark tasks as complete when done
5. **Commit frequently** - Make atomic commits for each completed task
6. **Test your changes** - Run `npm run build` and `npm run test` after changes

---

*Last Updated: January 29, 2026*
