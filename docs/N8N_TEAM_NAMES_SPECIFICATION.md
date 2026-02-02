# N8N Webhook Update: Add Team Names

**Task ID:** INT-001  
**Priority:** P1 (Bug Fix)  
**Effort:** ~30 minutes  
**Dependencies:** None

---

## Summary

The live games dashboard shows blank team names because the N8N workflow only sends odds data without team information. This document provides the exact changes needed in N8N.

> [!IMPORTANT]
> **The backend is already ready** — it parses `Home Team` and `Away Team` fields when present. Only N8N needs to be updated.

---

## Current vs Required Payload

### ❌ Current (Missing Team Names)

```json
{
  "Event ID": "11344362",
  "Money Line": [{ "home_od": "1.5", "away_od": "2.8", "ss": "55:42", "time_str": "3 - 06:00" }],
  "Spread": [{ "handicap": "-7.5", "home_od": "1.91", "away_od": "1.91" }],
  "Total Points": [{ "handicap": "190.5", "over_od": "1.91", "under_od": "1.91" }]
}
```

### ✅ Required (With Team Names)

```json
{
  "Event ID": "11344362",
  "Home Team": "NY Knicks (HOLLOW)",
  "Away Team": "LA Lakers (HOGGY)",
  "Money Line": [{ "home_od": "1.5", "away_od": "2.8", "ss": "55:42", "time_str": "3 - 06:00" }],
  "Spread": [{ "handicap": "-7.5", "home_od": "1.91", "away_od": "1.91" }],
  "Total Points": [{ "handicap": "190.5", "over_od": "1.91", "under_od": "1.91" }]
}
```

---

## N8N Implementation Steps

### Step 1: Locate the Workflow

Open the N8N workflow that sends game updates to:
```
POST https://[your-domain]/api/webhook/game-update
```

### Step 2: Find Team Name Data Source

In the B365API response, team names are typically in:
- `home.name` or `home_team_name`
- `away.name` or `away_team_name`

Look at your current data flow from B365API → N8N to identify where team names are available.

### Step 3: Add Fields to HTTP Request Node

In the HTTP Request node that calls `/api/webhook/game-update`, add these two fields to the JSON body:

| Field Name | Value | Source |
|------------|-------|--------|
| `Home Team` | `"NY Knicks (PLAYER_NAME)"` | From B365API home team field |
| `Away Team` | `"LA Lakers (PLAYER_NAME)"` | From B365API away team field |

**Field Name Options (Any of these will work):**
- `Home Team` / `Away Team` ← Preferred
- `home_team` / `away_team`
- `HomeTeam` / `AwayTeam`

### Step 4: Include on EVERY Update

> [!CAUTION]
> Team names must be sent with **every** webhook update, not just on game start. Otherwise, odds-only updates will cause team names to disappear.

Configure the N8N workflow to include team names in:
- Initial game creation updates
- Score updates
- Odds updates
- All live game data pushes

---

## Optional Fields (Nice to Have)

These fields are also supported but not required:

```json
{
  "Home Team ID": "12345",
  "Away Team ID": "67890",
  "League": "NBA2K"
}
```

---

## Testing Procedure

### 1. Send Test Webhook

Use curl or N8N to send a test payload:

```bash
curl -X POST https://[your-domain]/api/webhook/game-update \
  -H "Content-Type: application/json" \
  -d '{
    "Event ID": "TEST123",
    "Home Team": "Lakers (TEST_HOME)",
    "Away Team": "Celtics (TEST_AWAY)",
    "Money Line": [{"home_od":"1.5","away_od":"2.5","ss":"45:42","time_str":"2 - 05:00"}],
    "Spread": [{"handicap":"-3.5","home_od":"1.91","away_od":"1.91"}],
    "Total Points": [{"handicap":"185.5","over_od":"1.91","under_od":"1.91"}]
  }'
```

### 2. Verify API Response

Check `/api/games` to confirm team names are stored:

```bash
curl https://[your-domain]/api/games
```

Look for:
```json
{
  "homeTeam": "Lakers (TEST_HOME)",
  "awayTeam": "Celtics (TEST_AWAY)"
}
```

### 3. Verify Dashboard

Open the live games dashboard and confirm:
- Team names display (not blank)
- Format shows "Lakers vs Celtics" or similar
- Player names in parentheses are visible

### 4. Verify Subsequent Updates

Send a second update with **only odds** (no team names) and confirm team names are **preserved** from the first update (backend caches them automatically).

---

## Backend Reference

The webhook handler already parses team names at [route.ts lines 279-313](file:///Users/kobepowell/Desktop/mai-bets-v3/app/api/webhook/game-update/route.ts#L279-L313):

```typescript
let homeTeam = String(getField(data, 'Home Team', 'home_team', 'HomeTeam', 'homeTeam') || '');
let awayTeam = String(getField(data, 'Away Team', 'away_team', 'AwayTeam', 'awayTeam') || '');
```

The team cache ([team-cache.ts](file:///Users/kobepowell/Desktop/mai-bets-v3/lib/team-cache.ts)) automatically:
- Caches team names when first received
- Preserves them for subsequent odds-only updates
- Falls back to Active Games/Historical Games tables

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| Webhook includes `Home Team` field | ⬜ |
| Webhook includes `Away Team` field | ⬜ |
| Fields sent with every update | ⬜ |
| Dashboard shows team names | ⬜ |
| Test webhook verified | ⬜ |

---

## Troubleshooting

### Team names still blank after update?

1. Verify N8N workflow is actually deployed (not just saved as draft)
2. Check N8N execution logs for the field values
3. Run `/api/admin/init-team-cache` to refresh cache
4. Check backend logs for "📦 Cached team names" messages

### Data source question?

If B365API data structure is unclear, look for fields containing team information in the API response. Common locations:
- `FI` object → team records
- Root level `home`/`away` objects
- Match/fixture details

---

*Document created by Integration Team | January 29, 2026*
