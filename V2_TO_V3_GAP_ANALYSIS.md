# V2 to V3 Feature Gap Analysis

## Executive Summary
V2 (Supabase-based) has several advanced features that V3 (Airtable-based) currently lacks. This document identifies the gaps and prioritizes porting efforts.

---

## What V3 Already Has (Working Well)

| Feature | V3 Status | Notes |
|---------|-----------|-------|
| Player Stats Tracking | ✅ Complete | `player-service.ts` - tracks wins, losses, points, spread records |
| Historical Game Saving | ✅ Complete | `historical-service.ts` - saves finished games |
| Regression Protection | ✅ Complete | In webhook handler - prevents stale data |
| Two-Stage Signals | ✅ Complete | Entry/close trigger system |
| Discord Alerts | ✅ Complete | `discord-service.ts` |
| Debouncing | ✅ Complete | `debounce.ts` - 5-second window |
| Odds Parsing | ✅ Complete | Handles decimal to American conversion |
| Team Name Caching | ✅ Complete | `team-cache.ts` |

---

## What V3 Is Missing (Priority Order)

### 🔴 HIGH PRIORITY

#### 1. Player Stats in Strategy Conditions
**V2 Location:** `evaluateSingleCondition()` in `game-update/index.ts` (lines 1271-1310)

V2 supports these player stat fields in trigger conditions:
```
home_player_win_pct    - Home player win percentage
away_player_win_pct    - Away player win percentage
home_player_ppm        - Home player points per match
away_player_ppm        - Away player points per match
home_player_games      - Home player games played
away_player_games      - Away player games played
home_player_form_wins  - Wins in recent form (last 10 games)
away_player_form_wins  - Wins in recent form
```

**V3 Gap:** `trigger-engine.ts` doesn't fetch or check player stats in conditions.

**Port Action:** Add player stats fetching to `createEvaluationContext()` and add these fields.

---

#### 2. Head-to-Head Player Comparisons
**V2 Location:** `evaluateSingleCondition()` lines 1297-1311

V2 supports head-to-head comparison fields:
```
win_pct_diff    - homePlayerStats.win_percentage - awayPlayerStats.win_percentage
ppm_diff        - homePlayerStats.points_per_match - awayPlayerStats.points_per_match
experience_diff - homePlayerStats.games_played - awayPlayerStats.games_played
```

**V3 Gap:** No head-to-head comparison fields in trigger evaluation.

**Port Action:** Add comparison fields to `GameEvaluationContext` type and evaluation logic.

---

#### 3. Dynamic Leading/Losing Team Conditions
**V2 Location:** `evaluateSingleCondition()` lines 1360-1414

V2 automatically determines which team is leading/losing and lets you reference their odds:
```
leading_team_spread       - Spread for currently leading team
losing_team_spread        - Spread for currently losing team
leading_team_moneyline    - ML for leading team
losing_team_moneyline     - ML for losing team
leading_team_spread_odds  - Spread juice for leading team
losing_team_spread_odds   - Spread juice for losing team
```

**V3 Gap:** Must manually specify home/away, no dynamic leading team logic.

**Port Action:** Add these dynamic fields to evaluation context.

---

### 🟡 MEDIUM PRIORITY

#### 4. Previous Trigger State Tracking (Sequential Mode Enhancement)
**V2 Location:** `evaluateSingleCondition()` lines 1314-1358

V2 tracks which team was leading when previous triggers fired:
```
prev_leader_still_leads    - 1 if prev trigger's leader still leads, 0 if not
prev_leader_current_score  - Current score of team that was leading at prev trigger
prev_trailer_current_score - Current score of team that was trailing at prev trigger
prev_leader_current_margin - Current margin from prev leader's perspective
prev_leader_was_home       - 1 if prev leader was home team
```

**V3 Gap:** Sequential triggers don't track previous state.

**Port Action:** Enhance `ActiveSignal` to store leader state, add fields to evaluation.

---

#### 5. Strategy Rules System
**V2 Location:** `passesRules()` lines 789-838

V2 has pre-conditions that block strategies from running:
```
first_half_only    - Block if Q > 2
second_half_only   - Block if Q < 3
specific_quarter   - Block if not in specific quarter
exclude_overtime   - Block if Q > 4
stop_at           - Block after specific Q + time (e.g., Q4 2:20)
minimum_score     - Block if total score < threshold
```

**V3 Gap:** No rules system - strategies run at all times.

**Port Action:** Add `rules` field to Strategy type, add `passesRules()` check before trigger evaluation.

---

### 🟢 LOW PRIORITY

#### 6. Game Timeline Snapshots
**V2 Location:** `captureTimelineSnapshot()` lines 466-601

V2 captures detailed snapshots at game start for backtesting:
- Player stats at game start
- Opening odds
- Backfills odds when they arrive late

**V3 Gap:** No timeline snapshots table.

**Port Action:** Create Airtable table + capture logic.

---

#### 7. SMS Alerts
**V2 Location:** `sendSMSAlerts()` (not shown in excerpt)

V2 sends SMS alerts in addition to Discord.

**V3 Gap:** Discord only.

**Port Action:** Add SMS service if needed.

---

## Webhook Payload Compatibility

### V2 Expected Format (Direct Fields)
```json
{
  "Event ID": "11344362",
  "Home Team": "NY Knicks (PLAYER_NAME)",
  "Away Team": "LA Lakers (PLAYER_NAME)",
  "Home Score ( API )": 45,
  "Away Score ( API )": 42,
  "Quarter": "3",
  "Time Minutes ( API )": "8",
  "Time Seconds ( API ) ": "45"
}
```

### V3 Expected Format (Odds-Embedded)
```json
{
  "Event ID": "11344362",
  "Home Team": "NY Knicks (PLAYER_NAME)",
  "Away Team": "LA Lakers (PLAYER_NAME)",
  "Money Line": [{ "home_od": "1.5", "away_od": "2.8", "ss": "55:42", "time_str": "3 - 06:00" }],
  "Spread": [{ "handicap": "-7.5", "home_od": "1.91", "away_od": "1.91" }],
  "Total Points": [{ "handicap": "190.5", "over_od": "1.91", "under_od": "1.91" }]
}
```

### Compatibility Status
✅ V3 webhook ALREADY supports V2 format via fallback in `mapN8NFields()`:
- Lines 221-228 check for direct score/time fields if odds arrays are empty
- `Home Score ( API )`, `Away Score ( API )`, `Quarter`, `Time Minutes ( API )`, etc.

---

## Implementation Plan

### Phase 1: Player Stats in Conditions (1-2 hours)
1. Update `GameEvaluationContext` type in `types/index.ts`
2. Modify `createEvaluationContext()` in `trigger-engine.ts` to accept player stats
3. Fetch player stats in `processGameUpdate()` before trigger evaluation
4. Add player stat fields to evaluation context

### Phase 2: Head-to-Head Comparisons (30 min)
1. Add `win_pct_diff`, `ppm_diff`, `experience_diff` to evaluation context
2. Calculate from player stats passed in

### Phase 3: Dynamic Leading Team Conditions (1 hour)
1. Add `leading_team_*` and `losing_team_*` fields
2. Determine leading team dynamically based on current score
3. Map to appropriate home/away odds

### Phase 4: Strategy Rules System (1 hour)
1. Add `rules` field to `Strategy` type
2. Add `AirtableStrategyFields` mapping
3. Implement `passesRules()` function
4. Call before trigger evaluation in webhook

### Phase 5: Previous Trigger State Tracking (2 hours)
1. Enhance `ActiveSignal` to store `leadingTeamAtTrigger`
2. Pass previous trigger snapshot to condition evaluation
3. Add `prev_leader_*` fields to evaluation

---

## File Changes Required

| File | Changes |
|------|---------|
| `types/index.ts` | Add player stat fields, rules field, prev_leader fields |
| `lib/trigger-engine.ts` | Add player stats param, new condition fields, rules check |
| `lib/player-service.ts` | Export function to get player stats for game |
| `lib/signal-service.ts` | Store leading team state in active signals |
| `app/api/webhook/game-update/route.ts` | Fetch player stats, pass to trigger evaluation |
| `lib/strategy-service.ts` | Parse rules from Airtable |

---

## Testing Plan

1. **Webhook V2 Format Test**: Send V2-format payload, verify parsing
2. **Player Stats Condition Test**: Create strategy with `home_player_win_pct > 60`
3. **Head-to-Head Test**: Create strategy with `win_pct_diff > 10`
4. **Leading Team Test**: Create strategy with `leading_team_spread > -5`
5. **Rules Test**: Create strategy with `first_half_only` rule

---

*Generated: 2026-01-29*
