# Chief of Staff — Orchestrator Agent

## Role
Coordinate all teams, track progress, manage dependencies, ensure clean handoffs.

## Current Phase: 1 — Foundation

---

## Active Sprint: Week 1

### Sprint Goal
All Notion databases created/updated. API types match schema. Basic routes working.

---

## Team Status Dashboard

| Team | Current Task | Status | Blocker |
|------|--------------|--------|---------|
| Database | DB-001: Create Income Streams DB | 🔵 Ready | None |
| Backend | Waiting on Database | ⏸️ Blocked | DB-001 to DB-005 |
| UI | Waiting on Backend | ⏸️ Blocked | BE-003 to BE-005 |
| Integration | INT-001: Google OAuth | 🔵 Ready | None |
| QA | Waiting on Deliverables | ⏸️ Blocked | All teams |

---

## Execution Order (Phase 1)

### Wave 1 (Parallel Start)
```
┌─────────────────────────────────────┐
│ DATABASE TEAM                       │
│ DB-001: Income Streams DB           │
│ DB-002: Revenue Potential field     │
│ DB-004: Daily Discipline DB         │
│ DB-005: Pace field to Weeks         │
└─────────────────────────────────────┘
          ▼ (parallel)
┌─────────────────────────────────────┐
│ INTEGRATION TEAM                    │
│ INT-001: Google Calendar OAuth      │
│ INT-003: Twilio account setup       │
└─────────────────────────────────────┘
```

### Wave 2 (After Wave 1)
```
┌─────────────────────────────────────┐
│ DATABASE TEAM                       │
│ DB-003: Income Stream relation      │
│ DB-006: Update rollups              │
└─────────────────────────────────────┘
          ▼
┌─────────────────────────────────────┐
│ BACKEND TEAM                        │
│ BE-001: Update TypeScript types     │
│ BE-002: Update Notion client        │
└─────────────────────────────────────┘
```

### Wave 3 (After Wave 2)
```
┌─────────────────────────────────────┐
│ BACKEND TEAM                        │
│ BE-003: Income streams API          │
│ BE-004: Discipline tracking API     │
│ BE-005: Update task API             │
└─────────────────────────────────────┘
          ▼
┌─────────────────────────────────────┐
│ INTEGRATION TEAM                    │
│ INT-002: Calendar fetch service     │
└─────────────────────────────────────┘
```

### Wave 4 (After Wave 3)
```
┌─────────────────────────────────────┐
│ UI TEAM                             │
│ UI-001: Income stream selector      │
│ UI-002: Revenue potential badge     │
│ UI-003: Discipline checkboxes       │
│ UI-004: Update task row             │
└─────────────────────────────────────┘
          ▼
┌─────────────────────────────────────┐
│ QA TEAM                             │
│ QA-001: Verify databases            │
│ QA-002: Test APIs                   │
│ QA-003: Verify UI components        │
└─────────────────────────────────────┘
```

---

## Handoff Checklist

### Database → Backend
- [ ] All databases created in Notion
- [ ] All fields added with correct types
- [ ] Relations properly configured
- [ ] Database IDs documented
- [ ] Sample data created for testing

### Backend → UI
- [ ] API endpoints deployed and working
- [ ] TypeScript types exported
- [ ] Response formats documented
- [ ] Error codes defined
- [ ] Example requests/responses provided

### All Teams → QA
- [ ] Acceptance criteria checklist provided
- [ ] Test data available
- [ ] Expected behaviors documented
- [ ] Edge cases identified

---

## Escalation Log

| Date | Team | Issue | Resolution | Status |
|------|------|-------|------------|--------|
| - | - | - | - | - |

---

## Daily Standup Template

```markdown
## Standup — [DATE]

### Database Team
- Yesterday:
- Today:
- Blockers:

### Backend Team
- Yesterday:
- Today:
- Blockers:

### UI Team
- Yesterday:
- Today:
- Blockers:

### Integration Team
- Yesterday:
- Today:
- Blockers:

### QA Team
- Yesterday:
- Today:
- Blockers:

### Key Decisions Needed
- [ ]

### CEO Attention Required
- [ ]
```

---

## Phase 1 Completion Criteria

- [ ] EA - Income Streams database exists with all fields
- [ ] EA - Tasks has Revenue Potential and Income Stream fields
- [ ] EA - Daily Discipline database exists
- [ ] EA - Weeks has Pace field
- [ ] All TypeScript types updated
- [ ] Notion client handles all new operations
- [ ] Income streams API working (CRUD)
- [ ] Discipline API working (CRUD)
- [ ] Tasks API updated for new fields
- [ ] Google Calendar OAuth flow working
- [ ] UI components render correctly
- [ ] All QA tests pass

**CEO Sign-off Required:** Yes

---

## Notes

_Space for orchestration notes, decisions, context_

