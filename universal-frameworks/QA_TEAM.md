# QA Team — Quality Assurance

## Role
Verify all deliverables meet acceptance criteria. Test edge cases. Ensure production readiness.

## Current Phase: 1 — Foundation

---

## QA Philosophy

1. **Test as you go** — Don't wait until the end
2. **Assume bugs exist** — Your job is to find them
3. **Document everything** — Reproducible steps for every issue
4. **User perspective** — Test like a real user would use it
5. **Mobile first** — Check phone experience before desktop

---

## Active Tasks

### QA-001: Verify All Notion Databases Created
**Priority:** P0
**Status:** ⏸️ Blocked
**Dependencies:** DB-001 through DB-006
**Blocked By:** Database Team completion

#### Objective
Confirm all Notion databases exist with correct schema.

#### Verification Checklist

**EA - Income Streams (NEW)**
- [ ] Database exists under correct parent
- [ ] Stream Name (title) field present
- [ ] Type (select) with options: Product, Service, Investment, Employment
- [ ] Status (select) with options: Active, Building, Paused, Archived
- [ ] Monthly Target (number) field present
- [ ] Current Monthly (number) field present
- [ ] Priority (select) with options: Primary, Secondary, Experimental
- [ ] Initial data populated (6 income streams)

**EA - Tasks (UPDATED)**
- [ ] Revenue Potential (select) field added
  - Options: Direct Revenue, Pipeline, Infrastructure, Maintenance
  - Colors assigned correctly
- [ ] Income Stream (relation) field added
  - Links to EA - Income Streams
- [ ] Fields visible in Daily Check-In view

**EA - Daily Discipline (NEW)**
- [ ] Database exists under correct parent
- [ ] Date (title) field present
- [ ] Workout Done (checkbox) field present
- [ ] Meals On Plan (checkbox) field present
- [ ] Steps Goal Hit (checkbox) field present
- [ ] Discipline Score (formula) calculates correctly
  - Test: 0 checks = 0, 1 check = 1, 3 checks = 3
- [ ] Linked Snapshot (relation) field present

**EA - Weeks (UPDATED)**
- [ ] Pace (select) field added
  - Options: In Discipline, In Effort, On Paper, No
  - Colors: Green, Blue, Yellow, Red

#### Test Data Verification
- [ ] Can create a task with income stream linked
- [ ] Can create a task with revenue potential set
- [ ] Can create discipline entry with all checkboxes
- [ ] Formula calculates score correctly
- [ ] Relations work bidirectionally

#### Output
- Verification report with screenshots
- List of any issues found
- Sign-off or rejection with reasons

---

### QA-002: Test API Endpoints
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-003, BE-004, BE-005

#### Objective
Verify all API endpoints work correctly.

#### Test Plan

**Income Streams API**
```
GET /api/income-streams
- [ ] Returns array of streams
- [ ] Each stream has all fields
- [ ] Empty array if no streams (not error)

POST /api/income-streams
- [ ] Creates new stream
- [ ] Returns created stream with ID
- [ ] Validates required fields
- [ ] 400 on missing fields

PATCH /api/income-streams/[id]
- [ ] Updates specified fields only
- [ ] Returns success
- [ ] 404 on invalid ID

DELETE /api/income-streams/[id]
- [ ] Soft deletes (sets status to Archived)
- [ ] 404 on invalid ID
```

**Discipline API**
```
GET /api/discipline
- [ ] Returns today's entry
- [ ] Creates entry if none exists
- [ ] Score calculated correctly

PATCH /api/discipline/[date]
- [ ] Updates checkboxes
- [ ] Recalculates score
- [ ] 400 on invalid date format
```

**Tasks API (Updated)**
```
GET /api/tasks
- [ ] Includes revenuePotential field
- [ ] Includes incomeStream relation
- [ ] ?revenueOnly=true filters correctly

PATCH /api/tasks
- [ ] Can update revenuePotential
- [ ] Can link/unlink incomeStream
```

#### Error Handling Tests
- [ ] Invalid JSON returns 400
- [ ] Missing auth returns 401
- [ ] Invalid ID returns 404
- [ ] Server errors return 500 with safe message

#### Output
- API test report
- Postman/curl commands for each test
- List of failures with reproduction steps

---

### QA-003: Verify UI Components Render Correctly
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** UI-001 through UI-004

#### Objective
Confirm all new UI components work on desktop and mobile.

#### Test Plan

**IncomeStreamSelector**
- [ ] Loads streams on mount
- [ ] Shows loading state
- [ ] Dropdown opens/closes
- [ ] Selection works
- [ ] Clear selection works
- [ ] Shows status badges
- [ ] Mobile: Full width, touch-friendly

**RevenuePotentialBadge**
- [ ] Correct colors for each type
- [ ] Small size renders in table
- [ ] Medium size renders in detail
- [ ] Null value shows nothing

**DisciplineCheckboxes**
- [ ] Shows current state on load
- [ ] Checkbox toggle works
- [ ] Score updates immediately
- [ ] Visual feedback on change
- [ ] Mobile: Large tap targets

**TaskRow (Updated)**
- [ ] Income stream column shows
- [ ] Revenue potential badge shows
- [ ] Table doesn't overflow
- [ ] Drag still works
- [ ] Mobile: Priority columns hidden appropriately

**RevenueAlertBanner**
- [ ] Shows when no revenue tasks
- [ ] Shows day count
- [ ] Dismiss works
- [ ] Plan Now button works
- [ ] Styling is prominent but not annoying

#### Visual Regression
- [ ] No layout breaks on desktop (1920px)
- [ ] No layout breaks on laptop (1366px)
- [ ] No layout breaks on tablet (768px)
- [ ] No layout breaks on mobile (375px)

#### Accessibility
- [ ] All inputs have labels
- [ ] Focus states visible
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader announces states

#### Output
- Component test report with screenshots
- List of visual bugs
- Accessibility findings

---

## Bug Report Template

```markdown
## Bug: [Short Description]

**Severity:** Critical / High / Medium / Low
**Component:** [Component name]
**Environment:** Desktop / Mobile / Both

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[Attach if applicable]

### Console Errors
```
[Paste any errors]
```

### Additional Context
[Any other info]
```

---

## Test Environment Checklist

Before testing:
- [ ] Latest code deployed
- [ ] Test Notion workspace accessible
- [ ] Test user credentials available
- [ ] Mobile device or emulator ready
- [ ] Network throttling tools ready (for slow connection tests)

---

## Phase 1 Sign-Off Criteria

All must pass for CEO approval:

- [ ] All Notion databases created correctly
- [ ] All API endpoints return expected responses
- [ ] All UI components render without errors
- [ ] Mobile experience is acceptable
- [ ] No critical or high severity bugs open
- [ ] Performance acceptable (< 3s page load)

---

## Completed Tasks

| ID | Task | Completed | Result |
|----|------|-----------|--------|
| - | - | - | - |

---

## Bug Tracker

| ID | Description | Severity | Status | Assigned |
|----|-------------|----------|--------|----------|
| - | - | - | - | - |

---

## Notes

_Space for QA-specific notes, recurring issues, test environment quirks_

