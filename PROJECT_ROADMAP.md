# MAI Bets V3 - Project Roadmap & Progress Tracker

**Last Updated:** January 29, 2026
**Overall Progress:** ~65% Complete

---

## 📊 Progress Overview

| Category | Status | Progress |
|----------|--------|----------|
| Core Infrastructure | ✅ Complete | 100% |
| Webhook & Data Processing | ✅ Complete | 100% |
| Trigger Engine | ✅ Complete | 100% |
| Signal Management | 🟡 Mostly Complete | 85% |
| Player Stats System | ✅ Complete | 100% |
| Strategy System | 🟡 Partially Complete | 60% |
| Alerts & Notifications | 🟡 Partially Complete | 70% |
| Analytics & Outcomes | 🔴 Needs Work | 30% |
| AI Features | 🔴 Not Started | 0% |
| Admin & Utilities | 🔴 Not Started | 10% |

---

## ✅ COMPLETED FEATURES (What V3 Already Has)

### Core Infrastructure (100%)
- [x] Next.js 14 app with TypeScript
- [x] Airtable SDK integration (replacing Supabase)
- [x] Environment configuration
- [x] Build system with tests passing

### Webhook & Data Processing (100%)
- [x] Main webhook endpoint (`/api/webhook/game-update`)
- [x] V2-compatible payload parsing
- [x] Odds-embedded format parsing
- [x] Score and time extraction
- [x] Regression protection (prevents stale data)
- [x] Debouncing (5-second window)
- [x] Team name caching

### Trigger Engine (100%)
- [x] Condition evaluation with operators (=, !=, >, <, >=, <=, between)
- [x] Quarter-based fields (q1Home, q2Away, etc.)
- [x] Score differential fields
- [x] Time-based fields (timeRemainingSeconds)
- [x] **Player stats in conditions** (homePlayerWinPct, awayPlayerPpm, etc.) ✨ NEW
- [x] **H2H comparison fields** (winPctDiff, ppmDiff, experienceDiff) ✨ NEW
- [x] **Dynamic leading/losing team fields** ✨ NEW
- [x] **Direct odds fields** (homeSpread, awaySpread, homeMoneyline) ✨ NEW

### Signal Management (85%)
- [x] Signal creation on trigger match
- [x] Two-stage flow (monitoring → watching → bet_taken)
- [x] Active signal store (in-memory)
- [x] Odds requirement checking
- [x] Leading team tracking at trigger time
- [x] Signal closing on game end
- [ ] **Trigger history storage** (V2 stores all trigger snapshots)
- [ ] **Win requirements per strategy** (for auto-outcome)

### Player Stats System (100%)
- [x] Player stats tracking (wins, losses, points, spread records)
- [x] Form tracking (last 10 games)
- [x] Stats fetching for trigger evaluation
- [x] `getPlayersForGame()` function

### Historical Games (100%)
- [x] Historical game service
- [x] Saving finished games to Airtable
- [x] Quarter score storage

### Discord Alerts (100%)
- [x] Webhook integration
- [x] Signal alerts
- [x] Bet available alerts
- [x] Game result alerts
- [x] Blowout protection alerts
- [x] Test message functionality

### UI Dashboard (80%)
- [x] Main dashboard with live games
- [x] Strategies page
- [x] Signals page
- [x] Players page
- [x] Bankroll page
- [x] Analytics page
- [x] Settings page
- [ ] Strategy builder/editor UI
- [ ] Signal history with trigger timeline

---

## 🔴 MISSING FEATURES (Need to Port from V2)

### HIGH PRIORITY

#### 1. Strategy Rules System
**V2 Reference:** `passesRules()` in game-update/index.ts (lines 789-838)

Pre-conditions that block strategies from running:
```
- first_half_only     - Block if Q > 2
- second_half_only    - Block if Q < 3
- specific_quarter    - Block if not in specific quarter
- exclude_overtime    - Block if Q > 4
- stop_at            - Block after Q + time (e.g., Q4 2:20)
- minimum_score      - Block if total score < threshold
```

**Status:** ❌ Not implemented
**Effort:** 2-3 hours
**Files to modify:**
- `types/index.ts` - Add Rule type and rules field to Strategy
- `lib/trigger-engine.ts` - Add `passesRules()` function
- `lib/strategy-service.ts` - Parse rules from Airtable
- `app/api/webhook/game-update/route.ts` - Call passesRules before evaluation

---

#### 2. Win Requirements & Auto-Outcome
**V2 Reference:** `auto-outcome/index.ts`

Automatic win/loss calculation when games end:
```
- leading_team_wins   - Leading team at signal must win game
- home_wins          - Home team must win
- away_wins          - Away team must win
- final_lead_gte     - Final lead >= threshold
- final_lead_lte     - Final lead <= threshold
```

**Status:** ❌ Not implemented
**Effort:** 3-4 hours
**Files to create/modify:**
- `types/index.ts` - Add WinRequirement type
- `lib/outcome-service.ts` - Create auto-outcome calculation
- `app/api/cron/calculate-outcomes/route.ts` - Cron endpoint
- Signal service - Store win requirements with signals

---

#### 3. Previous Trigger State Tracking (Sequential Mode)
**V2 Reference:** `evaluateSingleCondition()` lines 1314-1358

For sequential triggers, track state from previous triggers:
```
- prev_leader_still_leads     - 1 if prev trigger's leader still leads
- prev_leader_current_score   - Current score of prev leader
- prev_trailer_current_score  - Current score of prev trailer
- prev_leader_current_margin  - Current margin from prev leader's perspective
- prev_leader_was_home        - 1 if prev leader was home team
```

**Status:** ❌ Not implemented
**Effort:** 2-3 hours
**Files to modify:**
- `lib/signal-service.ts` - Store trigger snapshots in active signals
- `lib/trigger-engine.ts` - Add prev_leader fields to evaluation context
- `types/index.ts` - Add previous trigger fields

---

### MEDIUM PRIORITY

#### 4. Trigger History Storage
**V2 Reference:** `createSignal()` lines 1476-1550

Store complete history of all triggers that fired:
```javascript
triggerHistory: [
  { trigger_id, name, timestamp, snapshot },
  { trigger_id, name, timestamp, snapshot },
  ...
]
```

**Status:** ❌ Not implemented
**Effort:** 1-2 hours
**Files to modify:**
- `lib/signal-service.ts` - Build and store trigger history
- `types/index.ts` - Add TriggerHistoryEntry type

---

#### 5. Game Timeline Snapshots
**V2 Reference:** `captureTimelineSnapshot()` lines 466-601

Capture snapshots at game start for backtesting:
- Player stats at game start
- Opening odds
- Backfill logic for late odds

**Status:** ❌ Not implemented
**Effort:** 3-4 hours
**Files to create:**
- `lib/timeline-service.ts` - Timeline snapshot capture
- Airtable table: "Timeline Snapshots"

---

#### 6. Message Templates for Alerts
**V2 Reference:** `formatMessageTemplate()` lines 1553-1611

Customizable message templates with 20+ placeholders:
```
{home_team}, {away_team}, {winning_team}, {losing_team}
{home_score}, {away_score}, {current_lead}, {trigger_lead}
{quarter}, {game_time}, {strategy_name}
{home_spread}, {away_spread}, {total_line}
{trigger_home_spread}, {trigger_away_spread}, etc.
```

**Status:** ❌ Not implemented (hardcoded embeds)
**Effort:** 2 hours
**Files to modify:**
- `lib/discord-service.ts` - Add template formatting
- `types/index.ts` - Add template field to strategy

---

### LOW PRIORITY

#### 7. SMS Alerts
**V2 Reference:** `sendSMSAlerts()` and `send-sms/index.ts`

Send SMS in addition to Discord alerts.

**Status:** ❌ Not implemented
**Effort:** 3-4 hours
**Files to create:**
- `lib/sms-service.ts` - SMS sending via Twilio/similar
- Airtable tables: "SMS Recipients", "SMS Subscriptions"

---

#### 8. AI Strategy Builder
**V2 Reference:** `ai-strategy-builder/index.ts`

AI-powered strategy creation from natural language.

**Status:** ❌ Not implemented
**Effort:** 4-6 hours
**Files to create:**
- `lib/ai/strategy-builder.ts`
- `app/api/ai/build-strategy/route.ts`

---

#### 9. AI Strategy Discovery
**V2 Reference:** `ai-discover-strategies/index.ts`

AI analysis of historical data to discover winning patterns.

**Status:** ❌ Not implemented
**Effort:** 6-8 hours
**Files to create:**
- `lib/ai/strategy-discovery.ts`
- `app/api/ai/discover/route.ts`

---

#### 10. Data Cleanup Utilities
**V2 Reference:** `data-cleanup/index.ts`

Maintenance utilities for cleaning old data.

**Status:** ❌ Not implemented
**Effort:** 2 hours

---

#### 11. Recalculate Outcomes
**V2 Reference:** `recalculate-outcomes/index.ts`

Batch recalculation of signal outcomes.

**Status:** ❌ Not implemented
**Effort:** 2 hours

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Strategy Rules (Priority: HIGH) ⏱️ 3 hours
```
□ Step 1.1: Add Rule type to types/index.ts
□ Step 1.2: Add rules field to Strategy interface
□ Step 1.3: Implement passesRules() in trigger-engine.ts
□ Step 1.4: Update strategy-service.ts to parse rules from Airtable
□ Step 1.5: Call passesRules() in webhook before trigger evaluation
□ Step 1.6: Test with first_half_only and stop_at rules
□ Step 1.7: Commit and push
```

### Phase 2: Win Requirements & Auto-Outcome (Priority: HIGH) ⏱️ 4 hours
```
□ Step 2.1: Add WinRequirement type to types/index.ts
□ Step 2.2: Add winRequirements field to Strategy
□ Step 2.3: Create lib/outcome-service.ts with evaluateOutcome()
□ Step 2.4: Create /api/cron/calculate-outcomes endpoint
□ Step 2.5: Store winRequirements in signals when created
□ Step 2.6: Update signal-service to call outcome calculation on game end
□ Step 2.7: Test with leading_team_wins requirement
□ Step 2.8: Commit and push
```

### Phase 3: Previous Trigger State (Priority: HIGH) ⏱️ 3 hours
```
□ Step 3.1: Add TriggerSnapshot interface to types
□ Step 3.2: Store trigger snapshots in ActiveSignal
□ Step 3.3: Add prev_leader_* fields to GameEvaluationContext
□ Step 3.4: Calculate prev_leader fields in createEvaluationContext
□ Step 3.5: Pass previous trigger info to sequential trigger evaluation
□ Step 3.6: Test sequential triggers with prev_leader_still_leads
□ Step 3.7: Commit and push
```

### Phase 4: Trigger History (Priority: MEDIUM) ⏱️ 2 hours
```
□ Step 4.1: Add TriggerHistoryEntry type
□ Step 4.2: Modify signal creation to build trigger history
□ Step 4.3: Store trigger history in signal snapshot
□ Step 4.4: Update Discord alerts to show trigger timeline (optional)
□ Step 4.5: Commit and push
```

### Phase 5: Message Templates (Priority: MEDIUM) ⏱️ 2 hours
```
□ Step 5.1: Add messageTemplate field to strategy discordWebhooks
□ Step 5.2: Create formatMessageTemplate() function
□ Step 5.3: Update Discord service to use templates
□ Step 5.4: Test with custom template
□ Step 5.5: Commit and push
```

### Phase 6: Timeline Snapshots (Priority: MEDIUM) ⏱️ 4 hours
```
□ Step 6.1: Create Timeline Snapshots table in Airtable
□ Step 6.2: Create lib/timeline-service.ts
□ Step 6.3: Capture snapshot at game start in webhook
□ Step 6.4: Add backfill logic for late odds
□ Step 6.5: Commit and push
```

### Phase 7: SMS Alerts (Priority: LOW) ⏱️ 4 hours
```
□ Step 7.1: Create SMS Recipients table in Airtable
□ Step 7.2: Create SMS Subscriptions table in Airtable
□ Step 7.3: Create lib/sms-service.ts
□ Step 7.4: Integrate with Twilio API
□ Step 7.5: Add SMS sending to signal alerts
□ Step 7.6: Commit and push
```

### Phase 8: AI Features (Priority: LOW) ⏱️ 10+ hours
```
□ Step 8.1: Create AI strategy builder
□ Step 8.2: Create AI strategy discovery
□ Step 8.3: Add AI endpoints
□ Step 8.4: Create UI for AI features
```

---

## 🔢 EFFORT ESTIMATES

| Phase | Feature | Hours | Status |
|-------|---------|-------|--------|
| 1 | Strategy Rules | 3 | ⬜ Not Started |
| 2 | Win Requirements & Auto-Outcome | 4 | ⬜ Not Started |
| 3 | Previous Trigger State | 3 | ⬜ Not Started |
| 4 | Trigger History | 2 | ⬜ Not Started |
| 5 | Message Templates | 2 | ⬜ Not Started |
| 6 | Timeline Snapshots | 4 | ⬜ Not Started |
| 7 | SMS Alerts | 4 | ⬜ Not Started |
| 8 | AI Features | 10+ | ⬜ Not Started |
| - | **TOTAL REMAINING** | **32+ hours** | - |

---

## 🎯 RECOMMENDED NEXT STEPS

1. **Start with Phase 1 (Strategy Rules)** - This is critical for strategies to work like V2
2. **Then Phase 2 (Auto-Outcome)** - Needed to track wins/losses automatically
3. **Then Phase 3 (Previous Trigger State)** - Completes sequential trigger support

These 3 phases (~10 hours) will bring V3 to ~85% feature parity with V2.

---

## 📁 V2 Reference Files Location

All V2 code is available at:
```
/sessions/eloquent-wonderful-dijkstra/v2-framework/game-pulse-keeper-main/supabase/functions/
```

Key files:
- `game-update/index.ts` - Main webhook (1700+ lines)
- `auto-outcome/index.ts` - Outcome calculation
- `ai-strategy-builder/index.ts` - AI builder
- `send-sms/index.ts` - SMS service

---

*This document should be updated as features are completed.*
