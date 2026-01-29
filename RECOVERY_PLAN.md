# MAI Bets V3 - Emergency Recovery Plan

## Current Status: CRITICAL

The system is in a critical state with massive Airtable duplication causing:
- Site extremely slow / unresponsive
- API calls timing out
- Pages not loading (Strategies, Analytics, Players)
- Airtable queries failing

## Root Cause Analysis

The duplication issue stems from **race conditions in serverless environments**:
1. Multiple webhook calls arrive simultaneously
2. Each serverless instance has its own memory (no shared state)
3. Duplicate detection relies on in-memory caches that reset on cold starts
4. The "upsert" logic checks for existing records, but by the time it creates one, another instance already created it

## IMMEDIATE ACTION REQUIRED

### Step 1: Pause All Webhooks (Do This First!)

**CRITICAL**: Stop incoming webhooks to prevent more duplicates:

1. Go to your webhook provider (the-odds-api or whoever sends game updates)
2. Temporarily disable or pause the webhook
3. This stops the bleeding while we clean up

### Step 2: Manual Airtable Cleanup

Since the MCP is timing out, you need to clean up manually in Airtable:

#### Active Games Table
1. Open Airtable → Active Games table
2. Sort by "Event ID" column
3. Look for duplicate Event IDs
4. For each duplicate group: keep the OLDEST record (first created), delete the rest
5. You can select multiple rows and delete them at once

#### Historical Games Table
1. Open Airtable → Historical Games table
2. Sort by "Name" column (this is the Event ID)
3. Delete duplicates, keeping the oldest

#### Players Table
1. Open Airtable → Players table
2. Sort by "Name" column
3. Delete duplicate player names, keeping the oldest

#### Signals Table
1. Open Airtable → Signals table
2. Sort by "Game ID" + "Strategy" columns
3. Delete duplicates for the same game/strategy combo

### Step 3: Verify Cleanup

After manual cleanup, check record counts:
- Active Games: Should be ~50-100 max (only live games)
- Historical Games: Should match actual finished games
- Players: Should be unique NBA players only
- Signals: Should be unique per game/strategy

## LONG-TERM FIX PLAN

### Phase 1: Database-Level Deduplication (Recommended)

**Option A: Use Airtable's Unique Field Feature**
- In Airtable, set "Event ID" as a unique field for Active Games
- This will prevent duplicates at the database level
- Airtable will reject duplicate inserts automatically

**Option B: Add Database Locks**
- Implement Redis or similar for distributed locking
- Before creating a record, acquire a lock on the Event ID
- Release lock after creation completes

### Phase 2: Code Changes

1. **Remove aggressive upsert logic** - Currently every webhook tries to upsert
2. **Add debouncing** - Only process one update per Event ID per 5 seconds
3. **Use Airtable's update-or-create** - Single atomic operation instead of check-then-create

### Phase 3: Architecture Review

Consider moving to:
- A real database (Postgres, MongoDB) with proper unique constraints
- Server-side caching with Redis
- A message queue (SQS, RabbitMQ) to serialize webhook processing

## FILES TO MODIFY

When ready to implement fixes:

| File | Change Needed |
|------|---------------|
| `lib/game-service.ts` | Add distributed locking or use Airtable unique fields |
| `lib/player-service.ts` | Same - add locking |
| `lib/historical-service.ts` | Same - add locking |
| `app/api/webhook/game-update/route.ts` | Add debouncing/rate limiting |

## DEPLOYMENT CHECKLIST

Before re-enabling webhooks:

- [ ] All duplicates cleaned from Airtable
- [ ] Verify site loads normally
- [ ] Test each page: Home, Strategies, Analytics, Players, Signals
- [ ] Consider setting Airtable unique field constraints
- [ ] Re-enable webhooks slowly (one at a time if possible)
- [ ] Monitor for new duplicates

## EMERGENCY CONTACTS

If issues persist:
- Check Vercel deployment logs for errors
- Check Airtable API rate limits (5 requests/second)
- Review webhook provider for duplicate sends

## Quick Reference: Airtable Cleanup SQL-like Queries

If you have Airtable Pro, you can use these formulas to find duplicates:

```
// Find duplicate Event IDs in Active Games
COUNTALL(IF({Event ID} = THISRECORD.{Event ID}, 1, 0)) > 1

// Find duplicate Names in Players
COUNTALL(IF({Name} = THISRECORD.{Name}, 1, 0)) > 1
```

---

**Created**: January 29, 2026
**Priority**: CRITICAL
**Status**: Awaiting manual intervention
