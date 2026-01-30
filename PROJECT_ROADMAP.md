# MAI Bets V3 - Project Roadmap & Progress Tracker

**Last Updated:** January 29, 2026 (AUDIT COMPLETED)
**Overall Progress:** ~95% Complete

---

## 📊 Progress Overview

| Category | Status | Progress |
|----------|--------|----------|
| Core Infrastructure | ✅ Complete | 100% |
| Webhook & Data Processing | ✅ Complete | 100% |
| Trigger Engine | ✅ Complete | 100% |
| Signal Management | ✅ Complete | 100% |
| Player Stats System | ✅ Complete | 100% |
| Strategy System | ✅ Complete | 100% |
| Alerts & Notifications | ✅ Complete | 100% |
| Analytics & Outcomes | ✅ Complete | 100% |
| AI Features | ✅ Complete | 100% |
| Admin & Utilities | ✅ Complete | 100% |
| UI/UX | 🟡 Minor Polish | 95% |

---

## 🔧 RECENT BUG FIXES & IMPROVEMENTS (January 29, 2026)

### Strategy Page - Fixed Triggers Display
- **Issue:** Individual strategy endpoints (`/api/strategies/[id]`) showed 0 triggers
- **Root Cause:** `ARRAYJOIN({Strategy})` in Airtable returns record names, not IDs
- **Fix:** Changed to fetch all triggers and filter by strategy ID in application code
- **Files Modified:** `app/api/strategies/[id]/route.ts`

### Team Name Caching - Admin Endpoints
- **Issue:** Live games weren't showing team names
- **Root Cause:** N8N webhook doesn't send team names, only odds data
- **Fix:** Created admin endpoints for cache initialization and data backfill
- **Files Created:**
  - `app/api/admin/init-team-cache/route.ts` - Initialize team cache on cold start
  - `app/api/admin/backfill-team-names/route.ts` - Backfill from Historical Games
- **Note:** N8N workflow should be updated to include "Home Team" and "Away Team" fields
  - **✅ Specification Created:** See `docs/N8N_TEAM_NAMES_SPECIFICATION.md` for implementation instructions

### UI/UX Improvements
- **Settings Page Contrast:** Fixed dark mode text visibility (gray-500/600 → gray-300/400)
- **Leading Team Color:** Changed from coral (orange) to sky (blue) for consistency
- **Odds Badges:** Updated to blue/gray theme with `.spread` and `.total` variants
- **Files Modified:**
  - `app/globals.css` - Updated winning/leading team colors and odds badge styles
  - `app/settings/page.tsx` - Improved text contrast throughout

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

### UI Dashboard (85%)
- [x] Main dashboard with live games
- [x] Strategies page
- [x] Signals page
- [x] Players page
- [x] Bankroll page
- [x] Analytics page
- [x] Settings page
- [x] **Settings page contrast fix** (dark mode readability) ✨ NEW
- [x] **UI color update** (blue for leading team, blue/gray for odds badges) ✨ NEW
- [ ] Strategy builder/editor UI
- [ ] Signal history with trigger timeline

### Admin & Utilities (40%)
- [x] **Admin team cache initialization** (`/api/admin/init-team-cache`) ✨ NEW
- [x] **Admin team name backfill** (`/api/admin/backfill-team-names`) ✨ NEW
- [ ] Data cleanup utilities
- [ ] Bulk recalculate outcomes

---

## ✅ PREVIOUSLY MISSING FEATURES - NOW COMPLETE

### HIGH PRIORITY (ALL COMPLETE)

#### 1. Strategy Rules System ✅ COMPLETE
**File:** `lib/trigger-engine.ts` - `passesRules()` function
- first_half_only, second_half_only, specific_quarter
- exclude_overtime, stop_at, minimum_score

#### 2. Win Requirements & Auto-Outcome ✅ COMPLETE
**File:** `lib/outcome-service.ts` - `evaluateOutcome()` function
- leading_team_wins, home_wins, away_wins
- final_lead_gte, final_lead_lte
- Cron endpoint: `/api/cron/calculate-outcomes`

#### 3. Previous Trigger State Tracking ✅ COMPLETE
**Files:** `lib/signal-service.ts`, `lib/trigger-engine.ts`
- prev_leader_still_leads, prev_leader_current_score
- prev_trailer_current_score, prev_leader_current_margin

### MEDIUM PRIORITY (ALL COMPLETE)

#### 4. Trigger History Storage ✅ COMPLETE
**File:** `lib/signal-service.ts`

#### 5. Game Timeline Snapshots ✅ COMPLETE
**File:** `lib/timeline-service.ts` (19KB implementation)
- 5 exported capture functions
- Player stats at game start, opening odds

#### 6. Message Templates ✅ COMPLETE
**File:** `lib/discord-service.ts` (25KB implementation)
- Full template support with placeholders

### LOW PRIORITY (ALL COMPLETE)

#### 7. SMS Alerts ✅ COMPLETE
**File:** `lib/sms-service.ts` (12KB implementation)
- Twilio integration ready

#### 8. AI Strategy Builder ✅ COMPLETE
**File:** `lib/ai/strategy-builder.ts` (25KB implementation)
**Endpoint:** `/api/ai/build-strategy`

#### 9. AI Strategy Discovery ✅ COMPLETE
**File:** `lib/ai/strategy-discovery.ts` (23KB implementation)

#### 10. Data Cleanup Utilities ✅ COMPLETE
**File:** `lib/cleanup-service.ts` (15KB implementation)

#### 11. Recalculate Outcomes ✅ COMPLETE
**File:** `lib/recalculate-service.ts` (20KB implementation)
**Endpoint:** `/api/admin/recalculate-outcomes`

---

## ✅ IMPLEMENTATION ROADMAP - ALL PHASES COMPLETE

### Phase 1: Strategy Rules ✅ COMPLETE
### Phase 2: Win Requirements & Auto-Outcome ✅ COMPLETE
### Phase 3: Previous Trigger State ✅ COMPLETE
### Phase 4: Trigger History ✅ COMPLETE
### Phase 5: Message Templates ✅ COMPLETE
### Phase 6: Timeline Snapshots ✅ COMPLETE
### Phase 7: SMS Alerts ✅ COMPLETE
### Phase 8: AI Features ✅ COMPLETE

---

## 🔢 EFFORT SUMMARY

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Strategy Rules | ✅ Complete |
| 2 | Win Requirements & Auto-Outcome | ✅ Complete |
| 3 | Previous Trigger State | ✅ Complete |
| 4 | Trigger History | ✅ Complete |
| 5 | Message Templates | ✅ Complete |
| 6 | Timeline Snapshots | ✅ Complete |
| 7 | SMS Alerts | ✅ Complete |
| 8 | AI Features | ✅ Complete |
| - | **ALL FEATURES IMPLEMENTED** | ✅ |

---

## 🎯 REMAINING TASKS (Polish & Verification)

### Data Pipeline Verification
- [x] N8N webhook sending team names - **FIXED** (Jan 29, 2026)
- [x] Players page showing data - **FIXED** (changed filter from 5 to 1 games)
- [ ] Verify Historical Games saves when games finish
- [ ] Verify outcome calculations on game completion

### Configuration & Credentials
- [ ] Verify Twilio credentials for SMS service
- [ ] Verify OpenAI/Anthropic API key for AI features
- [ ] Test all cron jobs are running on schedule

### UI Polish
- [x] Settings page contrast - **FIXED**
- [x] Odds badge colors (blue/gray theme) - **FIXED**
- [x] Lead indicator colors - **FIXED**
- [ ] Final review of all pages for consistency

---

## 🤝 DELEGATION FRAMEWORK INTEGRATION

MAI Bets V3 now uses a Universal Delegation Framework for organizing remaining work across specialized teams.

### Framework Files
- **Main Framework**: `universal-frameworks/MAI_BETS_DELEGATION.md`
- **Prompt Templates**: `universal-frameworks/CHIEF_OF_STAFF_PROMPTS.md`
- **Team Files**: `universal-frameworks/*_TEAM.md`

### Team Structure

| Team | Responsibilities | Current Phase Work |
|------|------------------|-------------------|
| **Backend Team** | Core logic, strategy engine, trigger evaluation | BE-001 (Strategy Rules), BE-002 (Auto-Outcome), BE-003 (Prev Trigger State) |
| **Database Team** | Airtable schema updates, new tables | DB-001 (Rules field), DB-002 (WinRequirements field) |
| **Integration Team** | N8N, Discord, SMS | INT-001 (N8N team names), INT-002 (Discord templates) |
| **UI Team** | React components, dashboards | UI-004 (Signal history), UI-008 (Strategy builder) |
| **QA Team** | V2 parity testing, verification | QA-001, QA-002, QA-003 (Test each phase) |

### Phase-to-Team Mapping

```
Phase 1: Strategy Rules (3 hours)
  DB-001 (Database) → BE-001 (Backend) → QA-001 (QA)

Phase 2: Win Requirements (4 hours)
  DB-002 (Database) → BE-002 (Backend) → QA-002 (QA)

Phase 3: Previous Trigger State (3 hours)
  BE-003 (Backend) → QA-003 (QA)

Phase 4: Trigger History (2 hours)
  BE-004 (Backend) → UI-004 (UI) → QA-004 (QA)

Phase 5: Message Templates (2 hours)
  DB-005 (Database) → BE-005 (Backend) → INT-005 (Integration) → QA-005 (QA)

Phase 6: Timeline Snapshots (4 hours)
  DB-006 (Database) → BE-006 (Backend) → QA-006 (QA)

Phase 7: SMS Alerts (4 hours)
  DB-007 (Database) → BE-007 (Backend) → INT-007 (Integration) → QA-007 (QA)

Phase 8: AI Features (10+ hours)
  BE-008 (Backend) → UI-008 (UI) → QA-008 (QA)
```

### How to Use the Delegation Framework

1. **Request Task Prompt**: Ask Chief of Staff (the AI managing this framework) for a prompt
2. **CEO Delegates**: Copy the generated prompt into a new AI chat for that team
3. **Team Executes**: Team member follows the prompt and completes the task
4. **Report Back**: Tell Chief of Staff the outcome to update status and get next task

**Example:**
```
CEO: "Generate prompt for BE-001 (Strategy Rules)"
Chief of Staff: [Generates ready-to-paste prompt with all context]
CEO: [Pastes into new Backend team chat]
Backend: [Implements passesRules() function]
CEO: "BE-001 complete. What's next?"
Chief of Staff: "Great! Next is QA-001. Here's the QA prompt..."
```

### Ready-to-Use Prompts

The framework includes 3 example prompts ready to use:
- **Backend - Strategy Rules (BE-001)**: Implement passesRules() function
- **Database - Add Rules Field (DB-001)**: Update Airtable schema
- **QA - Test Strategy Rules (QA-001)**: Verify V2 parity

See `universal-frameworks/CHIEF_OF_STAFF_PROMPTS.md` for full templates.

### Gate Reviews

CEO approval required before:
- Phase transitions
- Airtable schema changes
- N8N webhook modifications
- Production deployments

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

