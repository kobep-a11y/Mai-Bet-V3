# MAI Bets V3 - Executive Overview

## Project Summary

MAI Bets V3 is an automated sports betting signal system for NBA2K simulation games. The system monitors live game data via webhooks, evaluates betting strategies based on configurable triggers, and sends alerts when betting opportunities arise.

---

## Project Goals

### Primary Objective
Build a fully automated betting signal system that:
1. Receives real-time game data from N8N webhooks
2. Evaluates configurable betting strategies against live games
3. Generates signals when trigger conditions are met
4. Sends Discord alerts for actionable betting opportunities
5. Tracks historical performance and player statistics
6. Manages bankroll and calculates profit/loss

### Key Success Metrics
- Strategies trigger signals correctly when conditions are met
- No duplicate records in any Airtable tables
- Historical games are saved with complete Q4 data
- Player statistics are tracked and updated
- Discord alerts fire for bet opportunities

---

## System Architecture

### Data Flow
```
N8N Webhook → Game Update API → Trigger Engine → Signal Service → Discord Alerts
                    ↓
              Airtable Storage
              (Active Games, Historical Games, Signals, Players)
```

### Core Components

| Component | Purpose | File Location |
|-----------|---------|---------------|
| Webhook Handler | Receives game updates from N8N | `app/api/webhook/game-update/route.ts` |
| Game Service | Manages Active Games in Airtable | `lib/game-service.ts` |
| Strategy Service | Loads and caches strategies | `lib/strategy-service.ts` |
| Trigger Engine | Evaluates trigger conditions | `lib/trigger-engine.ts` |
| Signal Service | Creates and manages signals | `lib/signal-service.ts` |
| Historical Service | Saves finished games | `lib/historical-service.ts` |
| Player Service | Tracks player statistics | `lib/player-service.ts` |
| Discord Service | Sends bet alerts | `lib/discord-service.ts` |
| Team Cache | Caches team names by event ID | `lib/team-cache.ts` |

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅
**Status: Complete**

- Airtable integration with REST API (migrated from SDK due to AbortSignal bug)
- Webhook endpoint for receiving game updates
- In-memory game store with Airtable persistence
- Basic game data validation

**Key Files:**
- `lib/game-service.ts`
- `lib/game-store.ts`
- `app/api/webhook/game-update/route.ts`

### Phase 2: Strategy & Signal System ✅
**Status: Complete (needs verification)**

- Strategy loading from Airtable
- Trigger evaluation engine
- Two-stage signal flow (entry → close → odds check)
- Discord webhook integration

**Key Files:**
- `lib/strategy-service.ts`
- `lib/trigger-engine.ts`
- `lib/signal-service.ts`
- `lib/discord-service.ts`

### Phase 3: Historical Data & Analytics ✅
**Status: Complete**

- Historical game saving with Q4 calculation
- Player statistics tracking
- Analytics API for performance metrics

**Key Files:**
- `lib/historical-service.ts`
- `lib/player-service.ts`
- `app/api/analytics/route.ts`

### Phase 4: Bankroll Management ✅
**Status: Complete**

- Bankroll tracking table
- Transaction history
- Profit/loss calculations

**Key Files:**
- `app/api/bankroll/route.ts`
- Airtable: `Bankroll` table

### Phase 5: AI Pattern Mining 🔄
**Status: In Progress**

- Pattern analysis from historical data
- Strategy optimization suggestions
- Automated strategy generation

**Key Files:**
- `app/api/ai/patterns/route.ts`

---

## Airtable Schema

### Tables

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| Active Games | Event ID | Currently live games |
| Historical Games | Name (Event ID) | Finished games with stats |
| Strategies | Auto ID | Betting strategy configurations |
| Triggers | Auto ID | Trigger conditions for strategies |
| Signals | Auto ID | Generated betting signals |
| Players | Name | Player statistics |
| Bankroll | Transaction ID | Financial tracking |

### Important Field Notes
- **Active Games**: `Away Team ` has a trailing space (Airtable quirk)
- **Historical Games**: Uses `Name` field for Event ID
- **Signals**: Links to Strategies via record ID array

---

## Debug Endpoints

### System Health & Diagnostics

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/debug/system-check` | GET | Comprehensive system health check |
| `/api/debug/test-trigger-eval` | GET | Test trigger evaluation against live games |
| `/api/debug/cleanup-duplicates` | GET | Clean up duplicate records |
| `/api/debug/webhook-fields` | GET | Debug webhook field mapping |
| `/api/debug/raw-data` | GET | View raw webhook data |
| `/api/debug/test-triggers` | GET | Test trigger configurations |

### Maintenance Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/cleanup-games` | GET | Clean up finished/stale games |
| `/api/cron/game-end-check` | GET | Check for games that ended |
| `/api/games/clear-finished` | GET | Clear finished games |

### Testing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test-historical` | GET | Test historical game saving |
| `/api/test-players` | GET | Test player stats |
| `/api/discord/test` | GET | Test Discord webhooks |
| `/api/verify` | GET | Verify Airtable connection |

---

## Debug Protocols

### Protocol 1: Signals Not Firing

**Symptoms:** No signals being created despite active strategies and live games

**Diagnosis Steps:**
1. Run `/api/debug/system-check` - Check for active strategies and valid triggers
2. Run `/api/debug/test-trigger-eval` - See which conditions pass/fail
3. Check trigger conditions in Airtable match game state

**Common Causes:**
- Trigger conditions don't match current game quarter/state
- Invalid JSON in Conditions field
- Strategy not marked as active
- In-memory signal store preventing duplicate signals

### Protocol 2: Duplicate Records

**Symptoms:** Multiple records for same event/player in Airtable

**Diagnosis Steps:**
1. Run `/api/debug/system-check` - See duplicate count
2. Run `/api/debug/cleanup-duplicates` - Remove duplicates

**Prevention:**
- Code now auto-cleans duplicates when detected
- Race conditions mitigated with Airtable checks

### Protocol 3: Live Games Not Updating

**Symptoms:** Active Games table not receiving updates

**Diagnosis Steps:**
1. Check N8N workflow is running
2. Run `/api/debug/system-check` - Check recent activity
3. Check Vercel deployment logs for webhook errors

**Common Causes:**
- N8N workflow paused/errored
- Airtable API rate limits
- Field name mismatches (especially trailing spaces)

### Protocol 4: Team Names Missing

**Symptoms:** Games showing without team names in Active Games

**Diagnosis Steps:**
1. Check if N8N sends team names in webhook data
2. Review team-cache.ts lookup logic
3. Check Historical Games for team name source

**Solution:**
- Team cache system looks up names from Historical Games
- Status webhooks include team names; odds-only webhooks don't

### Protocol 5: Historical Games Not Saving

**Symptoms:** Finished games not appearing in Historical Games table

**Diagnosis Steps:**
1. Check game status is 'final'
2. Verify game has complete data (scores, quarters)
3. Check for existing record (deduplication)

---

## Key Configuration

### Environment Variables
```
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app0F9QifiBrnNssJ
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Strategy Configuration (Airtable)

Each strategy needs:
- **Name**: Display name
- **Is Active**: Must be checked for strategy to fire
- **Triggers**: Linked trigger records
- **Odds Type**: spread, moneyline, total_over, total_under
- **Odds Value**: Target value for the bet
- **Bet Side**: leading_team, trailing_team, home, away
- **Is Two Stage**: Whether to use entry/close trigger flow
- **Expiry Time Q4**: When to stop watching (default: 2:20)

### Trigger Configuration (Airtable)

Each trigger needs:
- **Name**: Display name
- **Strategy**: Link to parent strategy
- **Entry Or Close**: 'entry' or 'close'
- **Order**: Evaluation order (lower = first)
- **Conditions**: JSON array of conditions

**Condition Format:**
```json
[
  {
    "field": "quarter",
    "operator": "equals",
    "value": 3
  },
  {
    "field": "currentLead",
    "operator": "greater_than_or_equal",
    "value": 10
  }
]
```

**Available Fields:**
- `quarter`, `timeRemaining`, `timeRemainingSeconds`
- `homeScore`, `awayScore`, `totalScore`
- `scoreDifferential`, `absScoreDifferential`, `currentLead`
- `q1Home`, `q1Away`, `q1Total`, `q1Differential` (same for q2, q3, q4)
- `halftimeHome`, `halftimeAway`, `halftimeTotal`, `halftimeLead`
- `spread`, `total`, `status`

**Operators:**
- `equals`, `not_equals`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `between` (uses value and value2)

---

## File Structure

```
mai-bets-v3/
├── app/
│   ├── api/
│   │   ├── webhook/
│   │   │   └── game-update/route.ts    # Main webhook handler
│   │   ├── strategies/route.ts          # Strategy CRUD
│   │   ├── triggers/route.ts            # Trigger CRUD
│   │   ├── signals/route.ts             # Signal listing
│   │   ├── historical-games/route.ts    # Historical data
│   │   ├── players/route.ts             # Player stats
│   │   ├── analytics/route.ts           # Performance metrics
│   │   ├── bankroll/route.ts            # Financial tracking
│   │   ├── cron/
│   │   │   ├── cleanup-games/route.ts   # Game cleanup
│   │   │   └── game-end-check/route.ts  # End detection
│   │   ├── debug/
│   │   │   ├── system-check/route.ts    # Health check
│   │   │   ├── test-trigger-eval/route.ts # Trigger testing
│   │   │   ├── cleanup-duplicates/route.ts # Duplicate removal
│   │   │   ├── webhook-fields/route.ts  # Field debugging
│   │   │   └── raw-data/route.ts        # Raw data view
│   │   └── discord/test/route.ts        # Discord testing
│   └── page.tsx                         # Dashboard
├── lib/
│   ├── game-service.ts                  # Active Games management
│   ├── game-store.ts                    # In-memory game cache
│   ├── strategy-service.ts              # Strategy loading
│   ├── trigger-engine.ts                # Condition evaluation
│   ├── signal-service.ts                # Signal lifecycle
│   ├── historical-service.ts            # Historical saving
│   ├── player-service.ts                # Player stats
│   ├── discord-service.ts               # Discord alerts
│   └── team-cache.ts                    # Team name caching
├── types/
│   └── index.ts                         # TypeScript definitions
└── EXECUTIVE_OVERVIEW.md                # This file
```

---

## Known Issues & Solutions

### Issue: Airtable SDK AbortSignal Bug
**Solution:** Migrated all services to REST API instead of SDK

### Issue: Race Conditions Creating Duplicates
**Solution:** Added duplicate detection and cleanup in all services

### Issue: Away Team Field Has Trailing Space
**Solution:** Code now uses `'Away Team '` with trailing space

### Issue: Q4 Scores Not Calculated
**Solution:** Calculate Q4 = Final - Halftime - Q3

### Issue: Serverless Cold Starts Reset In-Memory State
**Solution:** Persist all critical data to Airtable, reload on startup

---

## Deployment

### Vercel Configuration
- Framework: Next.js
- Build Command: `next build`
- Output Directory: `.next`

### Required Environment Variables
Set in Vercel dashboard:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `DISCORD_WEBHOOK_URL` (optional)

### Deployment URL
`https://mai-bets-v3.vercel.app`

---

## Quick Reference Commands

### Run Debug Checks
```bash
# Full system health check
curl https://mai-bets-v3.vercel.app/api/debug/system-check

# Test why triggers aren't firing
curl https://mai-bets-v3.vercel.app/api/debug/test-trigger-eval

# Clean up duplicate records
curl https://mai-bets-v3.vercel.app/api/debug/cleanup-duplicates

# Clean up stale games
curl https://mai-bets-v3.vercel.app/api/cron/cleanup-games
```

### Monitor Live Data
```bash
# Get current live games
curl https://mai-bets-v3.vercel.app/api/webhook/game-update

# Get recent signals
curl https://mai-bets-v3.vercel.app/api/signals

# Get player leaderboard
curl https://mai-bets-v3.vercel.app/api/players
```

---

## Contact & Support

For technical issues:
1. Check debug endpoints first
2. Review Vercel deployment logs
3. Verify Airtable data directly
4. Check N8N workflow status

---

*Last Updated: January 29, 2026*
