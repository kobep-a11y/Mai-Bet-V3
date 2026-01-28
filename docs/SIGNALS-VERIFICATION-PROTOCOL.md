# Signals & Triggers Verification Protocol

## Overview
This document provides a step-by-step protocol for verifying that the MAI Bets V3 signal generation system is working correctly. Follow these steps after each deployment or when debugging signal issues.

---

## Quick Health Check

### Step 1: System Status Endpoint
```
GET /api/debug/system-check
```

**Expected Response:**
- All Airtable tables accessible (Strategies, Triggers, Signals)
- Environment variables configured
- `success: true`

**Red Flags:**
- `status: 'fail'` for any core table
- Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID

---

## Signal System Verification

### Step 2: Strategy Loading Test
```
GET /api/debug/test-triggers
```

**What to Check:**
1. `strategyLoading.status` should be `"success"`
2. `strategyLoading.totalStrategies` should be > 0
3. `strategyLoading.activeStrategies` should be > 0 (at least one strategy active)
4. Each strategy should have `triggerCount` > 0

**Expected Healthy Response:**
```json
{
  "success": true,
  "message": "✅ System working: X active strategies with triggers ready",
  "strategyLoading": {
    "status": "success",
    "totalStrategies": 3,
    "activeStrategies": 2,
    "strategies": [
      {
        "name": "Strategy Name",
        "isActive": true,
        "triggerCount": 2,
        "triggers": [...]
      }
    ]
  }
}
```

**Red Flags:**
- `totalStrategies: 0` - No strategies in Airtable
- `activeStrategies: 0` - All strategies disabled
- Strategy with `triggerCount: 0` - Strategy has no triggers
- `status: "fail"` - Airtable connection issue

---

### Step 3: Trigger Evaluation Test
```
GET /api/debug/test-triggers?mode=evaluate
```

**What to Check:**
1. `mockGame` object is created with test data
2. `evaluationContext` shows all computed fields
3. `triggerEvaluation` shows which triggers would fire
4. `individualTriggerTests` shows per-trigger breakdown

**Key Fields in Evaluation Context:**
- `quarter`, `timeRemainingSeconds`
- `homeScore`, `awayScore`, `totalScore`
- `scoreDifferential`, `currentLead`
- `q1Total`, `q2Total`, `q3Total`, `halftimeTotal`
- `halftimeLead`, `firstHalfTotal`

**Understanding Trigger Results:**
```json
{
  "individualTriggerTests": [
    {
      "strategyName": "My Strategy",
      "triggerName": "Entry Trigger",
      "passed": true,
      "matchedCount": 3,
      "failedCount": 0,
      "matchedConditions": [...],
      "failedConditions": []
    }
  ]
}
```

- `passed: true` means ALL conditions matched
- `matchedConditions` shows which conditions passed
- `failedConditions` shows which conditions failed (useful for debugging)

---

### Step 4: Verify Airtable Trigger Conditions

Manually check your Airtable Triggers table:

1. **Conditions Format** - Each trigger's `Conditions` field should be valid JSON:
```json
[
  {"field": "quarter", "operator": "equals", "value": 3},
  {"field": "currentLead", "operator": "greater_than", "value": 10}
]
```

2. **Supported Fields:**
   - `quarter` - Current quarter (1-4)
   - `timeRemainingSeconds` - Seconds left in quarter
   - `homeScore`, `awayScore`, `totalScore`
   - `scoreDifferential` - Home minus Away
   - `currentLead` - Absolute lead (always positive)
   - `halftimeLead` - Absolute halftime lead
   - `q1Total`, `q2Total`, `q3Total`, `q4Total` - Quarter totals
   - `halftimeTotal`, `firstHalfTotal`, `secondHalfTotal`
   - `spread`, `total` - Current betting lines

3. **Supported Operators:**
   - `equals`, `not_equals`
   - `greater_than`, `less_than`
   - `greater_than_or_equal`, `less_than_or_equal`
   - `between` (requires `value` and `value2`)
   - `contains` (for string fields)

---

## Live Signal Flow Verification

### Step 5: Test Webhook Processing

**Option A: Use the N8N workflow** (Production)
- Verify N8N is sending game data to `/api/webhook/game-update`
- Check Vercel function logs for processing messages

**Option B: Manual Test** (Development)
```bash
curl -X POST https://your-app.vercel.app/api/webhook/game-update \
  -H "Content-Type: application/json" \
  -d '{
    "Event ID": "test-123",
    "Home Team": "Test Home",
    "Away Team": "Test Away",
    "Money Line": [{"home_od": "1.5", "away_od": "2.5", "ss": "65:55", "time_str": "3 - 05:00"}],
    "Spread": [{"handicap": "-5.5"}],
    "Total Points": [{"handicap": "185.5"}]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "processing": {
    "triggersFireCount": 1,
    "signalsCreated": 1,
    "closeTriggersProcessed": 0,
    "betsAvailable": 0,
    "discordAlertsSent": 0
  }
}
```

---

### Step 6: Verify Signal Creation

After webhook processes a game:

1. **Check Signals API:**
```
GET /api/signals
```

2. **Check Airtable Signals Table:**
   - New record should appear
   - Status should be `monitoring` (two-stage) or `watching` (one-stage)
   - All game data fields populated

3. **Check Vercel Logs:**
   - Look for: `✅ Loaded X strategies (Y active) with Z total triggers`
   - Look for: `⚡ Entry trigger: [Strategy] triggered...`
   - Look for: `🔵 Signal created: Strategy Name for Away @ Home`

---

## Signal Lifecycle Verification

### Two-Stage Strategy Flow
```
Entry Trigger Fires → Signal (monitoring) → Close Trigger Fires → Signal (watching) → Odds Align → Signal (bet_taken)
```

### One-Stage Strategy Flow
```
Entry Trigger Fires → Signal (watching) → Odds Align → Signal (bet_taken)
```

### Status Meanings
| Status | Meaning |
|--------|---------|
| `monitoring` | Entry trigger fired, waiting for close trigger (two-stage only) |
| `watching` | Close trigger fired (or one-stage), waiting for odds to align |
| `bet_taken` | Odds aligned, bet is available |
| `expired` | Hit 2:20 Q4 without odds aligning |
| `won` / `lost` / `pushed` | Final result after game ended |

---

## Common Issues & Solutions

### Issue: No Strategies Loading
**Symptom:** `totalStrategies: 0`

**Check:**
1. Airtable API key is correct
2. Base ID is correct
3. Table is named exactly "Strategies"

### Issue: Strategies Load But No Triggers
**Symptom:** Strategy has `triggerCount: 0`

**Check:**
1. Triggers table exists and named exactly "Triggers"
2. Each trigger has the Strategy field linked correctly
3. Strategy field in Triggers is a "Link to another record" type

### Issue: Triggers Not Firing
**Symptom:** `triggerEvaluation.triggersFireCount: 0`

**Check:**
1. Strategy `isActive` is true
2. Game `status` is `live` or `halftime`
3. Trigger conditions match the game state
4. Use `/api/debug/test-triggers?mode=evaluate` to see failed conditions

### Issue: Signals Not Persisting
**Symptom:** Signal created in logs but not in Airtable

**Check:**
1. Signals table exists in Airtable
2. All required fields exist in Signals table
3. Check Vercel logs for Airtable errors

---

## Verification Checklist

Before considering the system operational, verify:

- [ ] `/api/debug/system-check` returns all green
- [ ] `/api/debug/test-triggers` shows strategies and triggers loading
- [ ] At least one strategy is active (`isActive: true`)
- [ ] Each active strategy has at least one trigger
- [ ] Trigger conditions are valid JSON in Airtable
- [ ] Test webhook creates a signal (or explains why not)
- [ ] Signal appears in Airtable Signals table
- [ ] Signal appears on `/signals` page
- [ ] Vercel logs show strategy loading and trigger evaluation

---

## Emergency Procedures

### If Signals Stop Working

1. **Check Vercel function logs** for errors
2. **Run** `/api/debug/test-triggers` to verify strategy loading
3. **Check Airtable** for any schema changes
4. **Verify environment variables** are still set in Vercel
5. **Redeploy** if needed to clear serverless cold start issues

### If Duplicate Signals Appear

1. Check `signalStore` in-memory tracking
2. Verify deduplication logic in `createSignal()`
3. Cold starts may reset memory - signals table is source of truth

---

## Monitoring Commands

**Check Strategy Count:**
```bash
curl https://your-app.vercel.app/api/debug/test-triggers | jq '.strategyLoading'
```

**Check Active Signals in Memory:**
```bash
curl https://your-app.vercel.app/api/debug/test-triggers | jq '.activeSignals'
```

**Check Recent Signals:**
```bash
curl https://your-app.vercel.app/api/signals
```

---

*Last Updated: January 2026*
*Version: MAI Bets V3*
