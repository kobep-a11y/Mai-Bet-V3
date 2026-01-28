# MAI Bets V3 - Debugging Protocol

## Overview

This document establishes a standardized debugging protocol for the MAI Bets live data system. Since we're working with real-time, constantly changing data, single snapshots don't provide enough context. **All debugging sessions must follow this time-series observation approach.**

---

## The 60-Second Observation Protocol

### When to Use
- Any time live game data appears incorrect
- When UI elements are flickering/flashing
- When values seem to be changing unexpectedly
- Before making any fixes to the live data pipeline

### Step 1: Initial Assessment (T=0s)
- Take a screenshot
- Document the current state of all visible data
- Note any obvious issues

### Step 2: Time-Series Observation (T=10s, 20s, 30s, 40s, 50s)
- Take screenshots every 10 seconds for at least 60 seconds
- Document what changed between each snapshot
- Look for patterns:
  - **Flickering**: Values changing back and forth
  - **Jumping**: Values making large unexpected changes
  - **Disappearing**: Data vanishing and reappearing
  - **Reordering**: Items shuffling position

### Step 3: Issue Classification

| Issue Type | Pattern | Example |
|------------|---------|---------|
| **Status Flapping** | Status alternates between states | FINAL → LIVE → FINAL |
| **Time Regression** | Time/quarter goes backwards | Q4 0:00 → Q4 12:00 |
| **Data Flickering** | Values flash between two states | Odds: -150 → -3.5 → -150 |
| **Order Instability** | Items reshuffle on each update | Game order changes every refresh |
| **Missing Data** | Values appear blank/undefined | Lead column empty for 0 gap |
| **Pre-live Showing** | Unstarted games appear as live | Q1 12:00 0-0 showing as LIVE |

### Step 4: Root Cause Analysis

For each issue type, check:

**Status Flapping**
- Is validation preventing status regression?
- Check: `validateGameData()` in webhook handler

**Time Regression**
- Is time validation working?
- Check: Game progress calculation logic

**Data Flickering**
- Is data being preserved when webhook sends empty values?
- Check: Default value handling and preservation logic

**Order Instability**
- Is sorting using a stable key?
- Check: Frontend sorting logic

**Missing Data**
- Is the UI conditionally hiding zero/empty values?
- Check: Render conditions in JSX

---

## Issue Tracking Template

```markdown
## Debug Session: [Date/Time]

### Observed Issues
1. [Issue description]
2. [Issue description]

### Observation Log

| Time | Screenshot | Notes |
|------|------------|-------|
| T=0s | ss_xxx | [Initial state] |
| T=10s | ss_xxx | [Changes observed] |
| T=20s | ss_xxx | [Changes observed] |
| T=30s | ss_xxx | [Changes observed] |
| T=40s | ss_xxx | [Changes observed] |
| T=50s | ss_xxx | [Changes observed] |

### Patterns Identified
- [Pattern 1]
- [Pattern 2]

### Root Causes
- [Cause 1]
- [Cause 2]

### Fixes Applied
- [Fix 1]
- [Fix 2]

### Verification Results
- [ ] Issue 1 resolved
- [ ] Issue 2 resolved
```

---

## Key Validation Points

### Backend (Webhook Handler)

1. **Status Regression Prevention**
   ```
   If existing status = 'final', keep it final
   ```

2. **Game Progress Validation**
   ```
   Progress = (quarter * 720) + (720 - timeInSeconds)
   New progress must be >= existing progress
   ```

3. **Data Preservation**
   ```
   If webhook omits a field, keep existing value
   Don't use defaults for existing games
   ```

### Frontend (Live Games Page)

1. **Stable Sorting**
   ```
   Sort by: status priority → eventId
   Never sort by changing values (time, score)
   ```

2. **Pre-live Filtering**
   ```
   Hide games with: Q1, 12:00, score 0-0
   ```

3. **Zero-value Display**
   ```
   Always show numeric values, including 0
   Don't hide 0 lead, 0 spread, etc.
   ```

---

## Quick Debug Checklist

- [ ] Took 6 screenshots over 60 seconds?
- [ ] Documented changes between each?
- [ ] Identified pattern type?
- [ ] Traced to root cause?
- [ ] Applied fix?
- [ ] Verified with another 60-second observation?

---

## Files to Check

| Issue Type | Primary Files |
|------------|---------------|
| Status/Time issues | `app/api/webhook/game-update/route.ts` |
| Odds flickering | `lib/game-service.ts`, webhook handler |
| UI display issues | `app/page.tsx`, `app/globals.css` |
| Sorting issues | `app/page.tsx` (fetchGames function) |
| Data persistence | `lib/game-service.ts` |

---

*This protocol ensures consistent, thorough debugging of live data systems where single-moment snapshots are insufficient.*
