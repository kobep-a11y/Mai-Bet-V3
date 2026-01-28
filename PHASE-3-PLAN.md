# MAI Bets V3 - Phase 3 CEO Execution Plan

**Document Version:** 1.1
**Created:** January 28, 2026
**Updated:** January 28, 2026
**Status:** IN PROGRESS

---

## Progress Update (v1.2)

### Completed Today (Latest):
- ✅ Fixed Airtable SDK AbortSignal bug - migrated historical-service.ts to REST API
- ✅ Fixed Historical Games field name issues (trailing spaces)
- ✅ Fixed Winner field options (lowercase: home, away, tie)
- ✅ Historical Games now saving correctly to Airtable
- ✅ Deployed REST API migration to production

### Previously Completed:
- ✅ Analytics Dashboard built with full UI
- ✅ /api/analytics endpoint created
- ✅ Win rate, ROI calculations working
- ✅ Strategy performance tracking in dashboard
- ✅ Signal volume chart added
- ✅ Deployed to production

---

## Executive Summary

Phase 2 has been successfully completed, establishing a robust backend infrastructure with real-time game tracking, two-stage signal lifecycle, Discord notifications, and comprehensive data persistence. Phase 3 focuses on **Analytics & Intelligence** - transforming raw data into actionable insights through player analytics, performance tracking, and enhanced UI experiences.

### Phase 2 Completion Status: ✅ 95% Complete

| Component | Status | Notes |
|-----------|--------|-------|
| Live Game Dashboard | ✅ Complete | Real-time updates, stable display |
| Two-Stage Signal System | ✅ Complete | Full lifecycle tracking |
| Discord Integration | ✅ Complete | Multi-template notifications |
| Strategy Builder | ✅ Complete | 60+ conditions, AI builder |
| Player Service Backend | ✅ Complete | Full stats tracking infrastructure |
| Historical Game Archive | ✅ Complete | Auto-archival on game end |
| Final Game Cleanup | ✅ Complete | Removes from Active Games table |

---

## Phase 3 Scope: Analytics & Intelligence

### Primary Objectives

1. **Analytics Dashboard** - Visual performance insights
2. **Player Analytics Integration** - Ensure stats flow correctly
3. **Performance Tracking** - Strategy ROI over time
4. **Data Visualization** - Charts and trends

---

## Section A: Infrastructure Verification (Priority: HIGH)

Before building new features, verify existing infrastructure works end-to-end.

### A1. Player Stats Integration
**Status:** Infrastructure built, needs verification

**What Exists:**
- `lib/player-service.ts` - Full implementation (443 lines)
- `app/players/page.tsx` - Leaderboard UI (275 lines)
- `app/api/players/route.ts` - API endpoints
- Player extraction from team names working

**Verification Tasks:**

| # | Task | Status | Test Method |
|---|------|--------|-------------|
| A1.1 | Verify player extraction from "Team (PLAYER)" format | ⬜ Pending | Send test game, check Players table |
| A1.2 | Verify player stats update on game end | ⬜ Pending | Complete test game, verify stats increment |
| A1.3 | Verify leaderboard displays correctly | ⬜ Pending | Visit /players, check sorting |
| A1.4 | Verify recent form (W/L) updates | ⬜ Pending | Check last 10 games array |
| A1.5 | Verify streak calculation | ⬜ Pending | Check streak type and count |

### A2. Signal Lifecycle Verification
**Status:** Built, needs live testing

| # | Task | Status | Test Method |
|---|------|--------|-------------|
| A2.1 | Entry trigger fires correctly | ⬜ Pending | Create strategy, send matching game |
| A2.2 | Close trigger transitions state | ⬜ Pending | Two-stage strategy test |
| A2.3 | Odds alignment detection works | ⬜ Pending | Set required spread, verify detection |
| A2.4 | Signal expiry at Q4 2:20 works | ⬜ Pending | Let signal expire, verify status |
| A2.5 | Win/loss/push calculation correct | ⬜ Pending | End game, verify result |

### A3. Discord Notification Verification

| # | Task | Status | Test Method |
|---|------|--------|-------------|
| A3.1 | Signal alert sends on trigger | ⬜ Pending | Verify Discord embed received |
| A3.2 | Bet available alert works | ⬜ Pending | Odds align, verify alert |
| A3.3 | Game result alert sends | ⬜ Pending | End game, verify alert |
| A3.4 | Player names appear correctly | ⬜ Pending | Check "KJMR vs HYPER" format |

---

## Section B: Analytics Dashboard (Priority: HIGH)

### B1. Analytics Page Build
**Current Status:** Placeholder "Coming Soon" page exists

**Target Features:**

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| B1.1 | Overall win rate card | High | Low |
| B1.2 | Total signals count | High | Low |
| B1.3 | ROI calculation (-110 juice) | High | Medium |
| B1.4 | Win rate by strategy chart | High | Medium |
| B1.5 | Signal volume over time chart | Medium | Medium |
| B1.6 | Best/worst performing strategies | High | Low |
| B1.7 | Recent results table | High | Low |
| B1.8 | Player performance insights | Medium | Medium |

### B2. Data Sources for Analytics

**Available Data:**
- `Signals` table - Full lifecycle, entry/close times, results
- `Historical Games` table - All completed games
- `Players` table - Player stats, form, streaks
- `Strategies` table - Strategy metadata

**Calculated Metrics:**
```
Win Rate = Won / (Won + Lost) × 100
ROI = ((Won × 0.91) - Lost) / Total Bets × 100  [assumes -110 juice]
ATS Rate = Spread Wins / (Spread Wins + Spread Losses) × 100
```

### B3. Analytics Page Component Structure

```
/app/analytics/page.tsx
├── Summary Cards (4 cards)
│   ├── Total Signals
│   ├── Win Rate
│   ├── ROI
│   └── Active Strategies
├── Performance Charts
│   ├── Win Rate Over Time (line)
│   └── Signal Volume (bar)
├── Strategy Leaderboard
│   ├── Best Performers
│   └── Worst Performers
├── Recent Results Table
│   └── Last 20 signals with outcomes
└── Player Insights
    ├── Top Winners
    └── Hot Streaks
```

---

## Section C: Player Analytics Enhancement (Priority: HIGH)

### C1. Current Player Page Status
**Status:** ✅ Fully implemented

**Existing Features:**
- League overview stats
- Sortable leaderboard (win rate, games, margin, ATS)
- Player cards with detailed stats
- Recent form visualization (last 10)
- Streak display

### C2. Player Page Enhancements

| # | Enhancement | Priority | Status |
|---|-------------|----------|--------|
| C2.1 | Player detail modal/page | Medium | ⬜ Pending |
| C2.2 | Head-to-head records | Low | ⬜ Pending |
| C2.3 | Player trend charts | Medium | ⬜ Pending |
| C2.4 | Best/worst matchups | Low | ⬜ Pending |
| C2.5 | Performance by time of day | Low | ⬜ Pending |

### C3. Player Stats Data Flow

```
Game Webhook → Webhook Handler → Game Store →
→ (Game Ends) → Historical Service → Player Service
                                          ↓
                                   Update Stats:
                                   - Win/Loss record
                                   - Points for/against
                                   - ATS record
                                   - Over/under record
                                   - Recent form
                                   - Streak
```

**Verification Point:** Ensure `processGameForPlayerStats()` is called when games end.

---

## Section D: Strategy Performance Tracking (Priority: MEDIUM)

### D1. Strategy Stats Requirements

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Signals | Signals table | COUNT where strategyId matches |
| Win Rate | Signals table | won / (won + lost) |
| ROI | Signals table | Standard -110 juice calc |
| Avg Entry Time | Signals table | AVG of entry quarter/time |
| Best Time Window | Signals table | Group by Q+time, find best |

### D2. Strategy Page Enhancements

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| D2.1 | Win/loss record on strategy card | High | ⬜ Pending |
| D2.2 | ROI badge | High | ⬜ Pending |
| D2.3 | Last 10 results | Medium | ⬜ Pending |
| D2.4 | Performance trend | Medium | ⬜ Pending |
| D2.5 | Backtest results display | Medium | ⬜ Pending |

---

## Section E: API Enhancements (Priority: MEDIUM)

### E1. New API Endpoints Needed

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| GET /api/analytics/summary | Dashboard summary stats | High |
| GET /api/analytics/history | Performance over time | Medium |
| GET /api/strategies/[id]/performance | Strategy-specific stats | High |
| GET /api/players/[name]/history | Player game history | Medium |

### E2. Existing API Verification

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/signals | ✅ Works | Fetches all signals |
| GET /api/players | ✅ Works | Fetches leaderboard |
| POST /api/players | ✅ Works | Creates player |
| GET /api/strategies | ✅ Works | Fetches strategies |
| POST /api/backtest | ✅ Works | Runs backtest |

---

## Section F: UI Polish (Priority: LOW)

### F1. Responsive Design

| Page | Mobile Status | Notes |
|------|---------------|-------|
| Live Games | ⬜ Needs check | Card layout may need adjustment |
| Signals | ⬜ Needs check | Timeline may overflow |
| Strategies | ⬜ Needs check | AI builder needs mobile view |
| Players | ⬜ Needs check | Table needs horizontal scroll |
| Analytics | ⬜ Not built | Build mobile-first |

### F2. Loading States

| Page | Loading State | Status |
|------|---------------|--------|
| Live Games | Spinner | ✅ |
| Signals | Spinner | ✅ |
| Players | Spinner | ✅ |
| Analytics | None | ⬜ Build |

---

## Execution Checklist

### Week 1: Verification & Foundation

- [ ] **Day 1-2: Infrastructure Verification**
  - [ ] A1.1 - A1.5: Player stats integration tests
  - [ ] A2.1 - A2.5: Signal lifecycle tests
  - [ ] A3.1 - A3.4: Discord notification tests
  - [ ] Fix any issues discovered

- [ ] **Day 3-4: Analytics API**
  - [ ] Create /api/analytics/summary endpoint
  - [ ] Calculate win rate, ROI, signal counts
  - [ ] Test with real data

- [ ] **Day 5: Analytics Dashboard Foundation**
  - [ ] Replace placeholder page
  - [ ] Add summary cards
  - [ ] Connect to analytics API

### Week 2: Analytics Build-out

- [ ] **Day 1-2: Charts & Visualization**
  - [ ] Add recharts or similar library
  - [ ] Win rate over time chart
  - [ ] Signal volume chart

- [ ] **Day 3: Strategy Performance**
  - [ ] Add win/loss display to strategy cards
  - [ ] Calculate ROI per strategy
  - [ ] Add performance badges

- [ ] **Day 4-5: Polish & Testing**
  - [ ] Mobile responsiveness check
  - [ ] Loading states
  - [ ] Error handling
  - [ ] End-to-end testing

---

## Technical Dependencies

### Required Libraries (Already Installed)
- `recharts` - Charting
- `airtable` - Database
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Required Environment Variables
```env
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Airtable Tables Required
| Table | Status | Notes |
|-------|--------|-------|
| Active Games | ✅ | Live game state |
| Historical Games | ⚠️ VERIFY | Completed games - see schema below |
| Signals | ✅ | Signal lifecycle |
| Strategies | ✅ | Strategy definitions |
| Triggers | ✅ | Linked to strategies |
| Players | ✅ | Player stats |

---

## CRITICAL: Historical Games Airtable Schema

**The Historical Games table MUST have these exact field names for auto-saving to work:**

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single line text | Event ID (primary field) |
| Home Team | Single line text | e.g., "NY Knicks (HOLLOW)" |
| Away Team | Single line text | e.g., "LA Lakers (HOGGY)" |
| Home Team ID | Single line text | Team identifier |
| Away Team ID | Single line text | Team identifier |
| Home Score | Number | Final home score |
| Away Score | Number | Final away score |
| Q1 Home | Number | Quarter 1 home score |
| Q1 Away | Number | Quarter 1 away score |
| Q2 Home | Number | Quarter 2 home score |
| Q2 Away | Number | Quarter 2 away score |
| Halftime Home | Number | Halftime home score |
| Halftime Away | Number | Halftime away score |
| Q3 Home | Number | Quarter 3 home score |
| Q3 Away | Number | Quarter 3 away score |
| Q4 Home | Number | Quarter 4 home score |
| Q4 Away | Number | Quarter 4 away score |
| Total Points | Number | Sum of final scores |
| Point Differential | Number | Home - Away |
| Winner | Single select | Options: home, away, tie |
| Spread | Number | Closing spread line |
| Total | Number | Closing total line |
| Spread Result | Single select | Options: home_cover, away_cover, push |
| Total Result | Single select | Options: over, under, push |
| Game Date | Date | When game was played |
| Raw Data | Long text | JSON backup of full game data |

**Troubleshooting if Historical Games aren't saving:**
1. Check Vercel logs for errors in `saveHistoricalGame`
2. Verify table name is exactly "Historical Games"
3. Verify all field names match exactly (case sensitive)
4. Check Airtable API key has write permissions

---

## CRITICAL: Players Airtable Schema

**The Players table MUST have these exact field names for player stats to work:**

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single line text | Player name (primary, e.g., "KJMR") |
| Team Name | Single line text | e.g., "OKC Thunder" |
| Full Team Name | Single line text | e.g., "OKC Thunder (KJMR)" |
| Games Played | Number | Total games |
| Wins | Number | Total wins |
| Losses | Number | Total losses |
| Win Rate | Number | Win percentage |
| Total Points For | Number | Cumulative points scored |
| Total Points Against | Number | Cumulative points allowed |
| Avg Points For | Number | PPG |
| Avg Points Against | Number | Opponent PPG |
| Avg Margin | Number | Average win/loss margin |
| Spread Wins | Number | ATS wins |
| Spread Losses | Number | ATS losses |
| Spread Pushes | Number | ATS pushes |
| Total Overs | Number | Over hits |
| Total Unders | Number | Under hits |
| Total Pushes | Number | Total pushes |
| ATS Win Rate | Number | ATS percentage |
| Over Rate | Number | Over percentage |
| Recent Form | Long text | JSON array of last 10 W/L |
| Streak Type | Single select | Options: W, L |
| Streak Count | Number | Current streak length |
| Last Game Date | Date | Most recent game |
| Is Active | Checkbox | Currently playing |

---

## Success Criteria

### Phase 3 Complete When:

1. **Analytics Dashboard Live**
   - Win rate displays correctly
   - ROI calculation accurate
   - Charts render properly
   - Mobile responsive

2. **Player Analytics Verified**
   - Stats update on game end
   - Leaderboard accurate
   - Recent form updates
   - Streak calculation correct

3. **Strategy Performance Visible**
   - Win/loss record on cards
   - ROI badges accurate
   - Backtest results accessible

4. **End-to-End Flow Verified**
   - Webhook → Signal → Discord → Game End → Stats Update
   - No manual intervention required
   - Data persists across serverless restarts

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Player stats not updating | High | Verify processGameForPlayerStats call chain |
| Analytics queries slow | Medium | Add Airtable caching, limit query size |
| Discord rate limits | Low | Queue messages, respect limits |
| Airtable API limits | Medium | Batch operations, use caching |

---

## Notes for Development

### Quick Wins (Can do immediately)
1. Verify player extraction works with live games
2. Check if player stats increment on game end
3. Replace analytics placeholder with basic cards

### Requires More Work
1. Full charting implementation
2. Strategy performance tracking
3. Player detail pages

### Deferred to Phase 4
1. SMS/Push notifications
2. Multiple data providers
3. Bankroll management
4. Export functionality

---

**Document End**

*This plan provides a comprehensive roadmap for Phase 3 execution. Each section is designed to be tackled independently, allowing for flexible prioritization based on business needs.*
