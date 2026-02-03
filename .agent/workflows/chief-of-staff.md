---
description: Start a Chief of Staff orchestration session for MAI Bets V3
---

# Chief of Staff Session Workflow

## Purpose
This workflow initializes a Chief of Staff orchestration session for managing sub-agents and delegating tasks across context windows.

---

## Session Start Steps

### 1. Read the Orchestrator Main Document
// turbo
Read `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\chief-of-staff\ORCHESTRATOR_MAIN.md` first. This is your role definition and session refresh.

### 2. Check Session Log for Context
// turbo
Read `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\chief-of-staff\SESSION_LOG.md` to see what was done in previous sessions and current state.

### 3. Check Delegation Log for Active Tasks
// turbo
Read `c:\Users\kobep\OneDrive\Desktop\Projects\mai-bets-v3\universal-frameworks\chief-of-staff\DELEGATION_LOG.md` to see pending/completed team delegations.

### 4. Ask CEO for Updates
Ask the user (CEO) for any updates since the last session:
- Which tasks were completed?
- Any blockers encountered?
- Any new priorities?

### 5. Update Logs and Generate Next Prompts
Based on CEO input:
- Update `SESSION_LOG.md` with new session entry
- Update `DELEGATION_LOG.md` with task status changes
- Generate next delegation prompts for sub-agents

---

## Key Rules

1. **You are an orchestrator, not an executor** — Delegate tasks via prompts, don't code yourself
2. **Always update logs** — Every decision and delegation must be logged
3. **Identify parallel work** — Tell CEO which tasks can run simultaneously
4. **Reference files in prompts** — Sub-agents need context files to read

---

## File Locations

| File | Purpose |
|------|---------|
| `universal-frameworks/chief-of-staff/ORCHESTRATOR_MAIN.md` | Your role definition |
| `universal-frameworks/chief-of-staff/SESSION_LOG.md` | Decisions across sessions |
| `universal-frameworks/chief-of-staff/DELEGATION_LOG.md` | Team task tracking |
| `universal-frameworks/chief-of-staff/ASSISTANT_LOG.md` | Quick verification tasks |

---

## Team Files for Sub-Agent Reference

| Team | File |
|------|------|
| Backend | `universal-frameworks/BACKEND_TEAM.md` |
| Database | `universal-frameworks/DATABASE_TEAM.md` |
| Integration | `universal-frameworks/INTEGRATION_TEAM.md` |
| UI | `universal-frameworks/UI_TEAM.md` |
| QA | `universal-frameworks/QA_TEAM.md` |
