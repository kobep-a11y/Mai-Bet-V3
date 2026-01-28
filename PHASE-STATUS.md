# MAI Bets V3 - Phase Status Report

**Generated:** January 28, 2026
**Version:** 3.0.0

---

## Phase 2: Backend Complete

### Signal System (signal-service.ts)
- **Two-Stage Lifecycle:** monitoring → watching → bet_taken → won/lost/pushed/expired
- **Signal Creation:** Entry triggers fire → creates signal in monitoring state
- **Close Triggers:** Moves signal from monitoring to watching
- **Odds Alignment:** Continuous checking until odds match or cutoff reached
- **Bet Activation:** Marks bet_taken when odds align
- **Expiry Handling:** Marks expired if odds never aligned before Q4 2:20

### Discord Integration (discord-service.ts)
- **Signal Alerts:** When entry trigger fires
- **Bet Available Alerts:** When odds align and bet becomes actionable (PRIMARY)
- **Game Result Alerts:** Win/loss/push at game end
- **Signal Close Alerts:** Alternative result format
- **Blowout Alerts:** Protection warnings
- Player name extraction from team strings

### Trigger Engine (trigger-engine.ts)
- **40+ Condition Fields:** Quarter scores, halftime, differentials, spreads, totals
- **Operators:** equals, not_equals, greater_than, less_than, between, contains
- **Strategy Modes:** sequential (first match) or parallel (all matches)
- **Two-Stage Support:** Entry vs close trigger distinction

### Game End Detection (game-end-check/route.ts)
- Auto-detects finished games
- Calculates win/loss/push for spread, moneyline, totals
- Updates Airtable signal records
- Sends Discord result alerts
- Updates player stats

### Player Stats (player-service.ts)
- Win/loss record, win rate
- Scoring stats (points for/against, margins)
- ATS record and percentage
- Over/under tracking
- Last 10 form and streaks
- Leaderboards by various stats

### Backtesting (backtest-service.ts)
- Single strategy testing against historical data
- Multi-strategy comparison
- Game state simulation at multiple points
- ROI calculation with -110 juice assumption
- Win rate and trigger count analysis

### Webhook Handler (game-update/route.ts)
- N8N format parsing with nested odds arrays
- Score string parsing ("51:49")
- Time string parsing ("5 - 01:23")
- Decimal to American odds conversion
- Backwards movement protection
- Constant data preservation (team names)
- Airtable persistence via game-service.ts

### Data Persistence
- **Active Games:** Airtable table for serverless persistence
- **Signals:** Full lifecycle tracking with entry/close times
- **Historical Games:** Completed game archive
- **Players:** Stats and form tracking
- **Strategies/Triggers:** Configuration storage

---

## Phase 2: What's Tested & Working

| Component | Status | Notes |
|-----------|--------|-------|
| Webhook Ingestion | Working | N8N data parsing fixed |
| Game Display | Working | Stable sorting by eventId |
| Airtable Persistence | Working | Survives serverless cold starts |
| In-Memory Store | Working | Fast lookups during requests |
| Data Validation | Working | Prevents backwards movement |
| Constant Preservation | Working | Team names persist across updates |

---

## Phase 2: Needs Verification

| Component | Test Needed |
|-----------|-------------|
| Discord Alerts | Send test signal, verify embed formatting |
| Trigger Evaluation | Confirm triggers fire at correct conditions |
| Signal Lifecycle | Verify full monitoring → bet_taken flow |
| Game End Detection | Confirm result calculation accuracy |
| Odds Alignment | Test spread/ML/total matching |

---

## Phase 3: Requirements

### 3.1 UI/Dashboard Enhancements
- **Analytics Dashboard:** Win rate charts, ROI tracking, signal history
- **Strategy Builder UI:** Visual interface for creating triggers
- **Backtest Results Page:** View historical test results with charts
- **Player Stats Page:** Leaderboards, individual player cards
- **Signal History Page:** Browse past signals with filters

### 3.2 Advanced Features
- **Rules System:** First half only, stop at time, max signals per day
- **AI Pattern Discovery:** Analyze historical data for winning patterns
- **AI Strategy Builder:** Natural language → trigger conditions
- **Discord Message Templates:** User-customizable alert formats
- **Strategy Performance Tracking:** Win rate by strategy over time

### 3.3 Mobile & Notifications
- **Mobile Responsive:** Full mobile experience
- **SMS Alerts:** Twilio integration for text notifications
- **Push Notifications:** Browser/mobile push for bet alerts

### 3.4 Data & Integration
- **Multiple Data Providers:** Beyond N8N, support direct API feeds
- **Bankroll Management:** Track bets placed, P&L tracking
- **Export Functionality:** CSV/PDF reports for tax purposes

---

## Immediate Next Steps

1. **Test End-to-End Flow**
   - Send test webhook with live game data
   - Verify trigger fires
   - Confirm Discord alert received
   - Check Airtable signal created

2. **Verify Game End Flow**
   - Mark test game as final
   - Confirm result calculation
   - Check Discord result alert
   - Verify player stats updated

3. **Production Deployment Checklist**
   - All environment variables set
   - Discord webhook URL configured
   - Airtable tables created with correct schema
   - N8N workflow pointing to correct endpoint

---

## Environment Variables Required

```env
# Airtable
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Optional
WEBHOOK_SECRET=your-secret-for-n8n-auth
```

---

## Airtable Tables Required

1. **Active Games** - Live game state persistence
2. **Strategies** - Strategy definitions
3. **Triggers** - Trigger conditions (linked to Strategies)
4. **Signals** - Signal lifecycle tracking
5. **Historical Games** - Completed game archive
6. **Players** - Player stats and form

---

## File Structure (Key Files)

```
/lib
  ├── signal-service.ts      # Signal lifecycle management
  ├── discord-service.ts     # Discord webhook integration
  ├── trigger-engine.ts      # Condition evaluation
  ├── player-service.ts      # Player stats tracking
  ├── backtest-service.ts    # Historical testing
  ├── game-service.ts        # Airtable game persistence
  └── game-store.ts          # In-memory game cache

/app/api
  ├── webhook/game-update/   # N8N webhook endpoint
  ├── cron/game-end-check/   # Game completion processing
  ├── signals/               # Signal listing
  ├── players/               # Player stats API
  └── backtest/              # Backtesting API

/types
  └── index.ts               # All TypeScript types
```
