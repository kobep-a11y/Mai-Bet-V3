# Chief of Staff — Delegation Log

**Purpose:** Track all team delegations with prompts and status.

**Last Updated:** 2026-02-03 13:34

---

## Active Delegations

### CEO-ENV-001: Create Environment Configuration
**Team:** CEO (You)  
**Status:** 🔴 ACTION REQUIRED  
**Created:** 2026-02-03  
**Priority:** P0 — BLOCKING  
**Blocks:** All other fixes

**Required Actions:**
1. Create `.env.local` file in project root with:
```env
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

2. Verify these Airtable tables exist with data:
   - Strategies (at least 1 with `Is Active = true`)
   - Triggers (linked to active strategies with conditions)
   - Active Games
   - Signals

**Report back:** "ENV-001 done" when credentials are set

---

### BE-HYDRATE-001: Signal Store Hydration (Ready After ENV)
**Team:** Backend  
**Status:** 🟡 READY WHEN ENV DONE  
**Created:** 2026-02-03  
**Priority:** P1  
**Depends On:** CEO-ENV-001

**Prompt:**
```markdown
You are the Backend Team for MAI Bets V3.

## Context Files to Read First
1. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\BACKEND_TEAM.md`
2. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\lib\signal-service.ts`

## Your Mission
Fix the signal store cold start issue. Currently, when the Vercel serverless function cold starts, the in-memory SignalStore is empty. Close triggers fail because they can't find matching signals.

## Problem Details (from QA Diagnostic)
- File: `lib/signal-service.ts` lines 166-218
- The `SignalStore` is in-memory only
- After cold start, close triggers fire but find no active signal
- Log shows: "Close trigger fired but no active signal found for strategy..."

## Requirements
1. Implement signal store hydration from Airtable
2. In `checkWatchingSignalsForOdds()` (line 426), query Airtable for signals with status = 'monitoring' or 'watching'
3. Re-populate the in-memory store before evaluation
4. Ensure this happens transparently on first webhook call after cold start

## Acceptance Criteria
- [ ] Signal store loads active signals from Airtable on cold start
- [ ] Close triggers find matching signals after cold start
- [ ] No duplicate signals created
- [ ] Performance impact minimal (< 500ms added latency)

## Handoff
Report back with:
1. Summary of implementation
2. Files modified
3. How to test the fix
```

---

### DB-FIELD-001: Fix Airtable Field Name (Ready After ENV)
**Team:** Database  
**Status:** 🟡 READY WHEN ENV DONE  
**Created:** 2026-02-03  
**Priority:** P2  
**Depends On:** CEO-ENV-001

**Prompt:**
```markdown
You are the Database Team for MAI Bets V3.

## Context Files to Read First
1. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\DATABASE_TEAM.md`
2. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\AIRTABLE-SCHEMA.md`
3. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\lib\game-service.ts`

## Your Mission
Fix the Airtable field name mismatch. The "Away Team " field has a trailing space which could cause silent data save failures.

## Problem Details (from QA Diagnostic)
- File: `lib/game-service.ts` lines 122-126
- The field is named "Away Team " (with trailing space)
- Code works with this but it's fragile

## Options
1. **Option A (Recommended):** Rename field in Airtable UI to "Away Team" (no space)
   - Then update `game-service.ts` to use `Away Team` without trailing space
   
2. **Option B:** Keep Airtable as-is, add comments explaining the quirk

## Verification
1. Go to Airtable "Active Games" table
2. Check exact field name for away team
3. If it has trailing space, rename it
4. Update code to match

## Handoff
Report back with:
1. Current Airtable field name (exactly as shown)
2. Action taken (renamed or kept)
3. Any code changes needed
```

---

**Prompt:**
```markdown
You are the DevOps Team for MAI Bets V3.

## Context Files to Read First
- `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\README.md` (project overview)

## Your Mission
Initialize Git in the MAI Bets V3 project and sync with GitHub.

## Current State
- Project directory: `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3`
- Git status: NOT initialized (no .git folder)
- GitHub: Repository may or may not exist

## Task Objectives
1. Initialize git in the project directory
2. Create appropriate .gitignore (Node.js/Next.js project)
3. Make initial commit with all current files
4. Check if GitHub repo exists at expected location
5. If no repo, guide CEO on creating one OR create if you have access
6. Push to GitHub (main branch)

## Acceptance Criteria
- [ ] `.git` folder exists in project root
- [ ] `.gitignore` properly excludes node_modules, .env.local, etc.
- [ ] Initial commit made with meaningful message
- [ ] Remote origin configured
- [ ] Code pushed to GitHub successfully

## Handoff
Report back with:
1. Git initialized: Yes/No
2. Commit hash of initial commit
3. GitHub repo URL
4. Any issues encountered

Begin by running `git status` to confirm current state, then proceed.
```

**Completion Notes:** *(To be filled when complete)*

---

### QA-DIAG-001: Full System Diagnostic
**Team:** QA  
**Status:** 🟡 PENDING DELEGATION  
**Created:** 2026-02-03  
**Priority:** P0  

**Prompt:**
```markdown
You are the QA Team for MAI Bets V3, performing a full system diagnostic.

## Context Files to Read First
1. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\QA_TEAM.md` (your role)
2. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\DEBUGGING-PROTOCOL.md` (debug approach)
3. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\PHASE-STATUS.md` (current status)
4. `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\PROJECT_ROADMAP.md` (feature list)

## Your Mission
Conduct a comprehensive top-to-bottom diagnostic of MAI Bets V3 to identify all issues.

## Known Problem Areas (CEO reported)
- Triggers are not firing properly
- Alerts are not being sent out
- Airtable data not being updated/used properly
- Live games display seems okay

## Diagnostic Scope

### 1. Webhook Pipeline
- Check `/app/api/webhook/game-update/route.ts`
- Verify payload parsing is correct
- Check if games are being stored in memory and Airtable

### 2. Trigger Engine
- Check `/lib/trigger-engine.ts`
- Verify condition evaluation logic
- Check if strategies are being loaded from Airtable
- Look for any error handling that might silently fail

### 3. Signal Service
- Check `/lib/signal-service.ts`
- Verify signal creation flow
- Check two-stage lifecycle (monitoring → watching → bet_taken)

### 4. Discord Alerts
- Check `/lib/discord-service.ts`
- Verify webhook URL configuration
- Check if alerts are being called but failing silently

### 5. Airtable Integration
- Check `/lib/airtable.ts`
- Verify CRUD operations work
- Check table names match schema
- Look for authentication issues

### 6. Build & Runtime
- Run `npm run build` and check for errors
- Run `npm run dev` and check for startup issues
- Review any existing test files in `__tests__/`

## Diagnostic Method
For each area:
1. Read the relevant source files
2. Identify potential failure points
3. Look for missing error handling
4. Check for hardcoded values that should be env vars
5. Note any TODO/FIXME comments

## Deliverables
Provide a structured report:

```
## Diagnostic Report — 2026-02-03

### Summary
- Critical Issues: X
- Warnings: Y
- Areas Verified OK: Z

### Critical Issues
1. [ISSUE-001] Description
   - File: path/to/file.ts
   - Line: XX
   - Problem: What's wrong
   - Fix: Suggested fix
   - Team: Which team should fix (Backend/Database/Integration/UI)

### Warnings
1. [WARN-001] Description...

### Verified OK
- Component X: Working as expected
- Component Y: Working as expected

### Recommended Fix Order
1. First fix this (blocking other fixes)
2. Then fix this (depends on #1)
3. Can fix in parallel: A, B, C
```

## Handoff
After completing diagnostic, save your report and summarize:
1. Total issues found
2. Top 3 critical issues
3. Recommended next team to delegate to

Begin by reading the context files, then systematically check each area.
```

**Completion Notes:** *(To be filled when complete)*

---

## Completed Delegations

*(None yet)*

---

## Blocked Delegations

*(None yet)*

---

*Update this file as delegations are created, completed, or blocked*
