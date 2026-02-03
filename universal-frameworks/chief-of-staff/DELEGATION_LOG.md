# Chief of Staff — Delegation Log

**Purpose:** Track all team delegations with prompts and status.

---

## Active Delegations

### DEVOPS-001: Git Initialization & GitHub Sync
**Team:** DevOps (Ad-hoc)  
**Status:** 🟡 PENDING DELEGATION  
**Created:** 2026-02-03  
**Priority:** P0  

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
