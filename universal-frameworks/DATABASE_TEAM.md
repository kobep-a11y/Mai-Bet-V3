# Database Team — Notion Schema Management

## Role
Design, create, and maintain all Notion databases. Ensure data integrity and proper relationships.

## Tech Stack
- Notion API
- @notionhq/client

## Current Phase: 1 — Foundation

---

## Active Tasks

### DB-001: Create EA - Income Streams Database
**Priority:** P0
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Create new Notion database to track income streams/projects.

#### Schema
```
EA - Income Streams
├── Stream Name (title) — e.g., "MAI Bets", "Solar Sales"
├── Type (select) — Product / Service / Investment / Employment
├── Status (select) — Active / Building / Paused / Archived
├── Monthly Target (number) — Revenue goal
├── Current Monthly (number) — Actual revenue
├── Description (text) — Brief description
├── Priority (select) — Primary / Secondary / Experimental
└── Created (created_time) — Auto
```

#### Acceptance Criteria
- [ ] Database created under MyAI page (same parent as EA Tasks)
- [ ] All fields configured with correct types
- [ ] Select options populated
- [ ] Icon set (💰 or similar)
- [ ] Initial income streams added:
  - MAI Bets (Product, Active)
  - Solar Sales (Service, Active)
  - Life Insurance (Service, Active)
  - AI Automations (Service, Building)
  - Trading (Investment, Active)
  - Content Creation (Product, Building)

#### Output
- Database ID: `[TO BE FILLED]`
- Database URL: `[TO BE FILLED]`

---

### DB-002: Add Revenue Potential Field to EA Tasks
**Priority:** P0
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Add new select field to classify tasks by revenue impact.

#### Field Specification
```
Field Name: Revenue Potential
Type: Select
Options:
  - Direct Revenue (green) — Will generate money today/this week
  - Pipeline (blue) — Leads to future revenue
  - Infrastructure (yellow) — Supports revenue operations
  - Maintenance (gray) — Necessary but not growth
```

#### Acceptance Criteria
- [ ] Field added to EA Tasks database
- [ ] All options created with colors
- [ ] Field visible in default view
- [ ] Field added to "Daily Check-In" view

#### Output
- Field ID: `[TO BE FILLED]`
- Confirmation screenshot

---

### DB-003: Add Income Stream Relation to EA Tasks
**Priority:** P0
**Status:** ⏸️ Waiting
**Dependencies:** DB-001

#### Objective
Link tasks to income streams for tracking which projects get attention.

#### Field Specification
```
Field Name: Income Stream
Type: Relation
Related Database: EA - Income Streams (from DB-001)
Relation Type: Many-to-one (each task → one stream)
```

#### Acceptance Criteria
- [ ] Relation field created
- [ ] Points to correct database
- [ ] Existing tasks can be linked
- [ ] Shows in Daily Check-In view

#### Output
- Field ID: `[TO BE FILLED]`

---

### DB-004: Create EA - Daily Discipline Database
**Priority:** P0
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Track daily health/discipline metrics separate from task completion.

#### Schema
```
EA - Daily Discipline
├── Date (title) — "January 28, 2025"
├── Workout Done (checkbox)
├── Meals On Plan (checkbox)
├── Steps Goal Hit (checkbox)
├── Discipline Score (formula) — Sum of checkboxes (0-3)
├── Notes (text) — Optional quick note
├── Linked Snapshot (relation) — Links to Daily Snapshots
└── Created (created_time)
```

#### Formula for Discipline Score
```
(if(prop("Workout Done"), 1, 0) + if(prop("Meals On Plan"), 1, 0) + if(prop("Steps Goal Hit"), 1, 0))
```

#### Acceptance Criteria
- [ ] Database created under MyAI page
- [ ] All fields configured
- [ ] Formula calculates correctly (test with sample data)
- [ ] Icon set (💪 or similar)

#### Output
- Database ID: `[TO BE FILLED]`
- Database URL: `[TO BE FILLED]`

---

### DB-005: Add Pace Field to EA Weeks
**Priority:** P0
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Add field to capture weekly pace assessment during CEO Day.

#### Field Specification
```
Field Name: Pace
Type: Select
Options:
  - In Discipline (green) — Following routines, staying consistent
  - In Effort (blue) — Working hard but routines slipping
  - On Paper (yellow) — Plans exist but not executing
  - No (red) — Not on track at all
```

#### Acceptance Criteria
- [ ] Field added to EA - Weeks database
- [ ] All options created with appropriate colors
- [ ] Field visible in default view

#### Output
- Field ID: `[TO BE FILLED]`

---

### DB-006: Update Rollup Formulas
**Priority:** P1
**Status:** ⏸️ Waiting
**Dependencies:** DB-002, DB-003

#### Objective
Add rollups to track revenue task completion at week level.

#### Fields to Add to EA - Weeks
```
Revenue Tasks Planned (rollup)
  - Relation: Tasks in this week
  - Property: Revenue Potential
  - Calculate: Count where = "Direct Revenue"

Revenue Tasks Completed (rollup)
  - Relation: Tasks in this week
  - Property: Status
  - Calculate: Count where = "Completed" AND Revenue Potential = "Direct Revenue"
```

#### Acceptance Criteria
- [ ] Both rollup fields created
- [ ] Calculations verified with test data
- [ ] Visible in Weeks view

#### Output
- Rollup formulas documented

---

## Completed Tasks

| ID | Task | Completed | Output |
|----|------|-----------|--------|
| - | - | - | - |

---

## Handoff Checklist (to Backend Team)

When all tasks complete, provide:

- [ ] All database IDs documented
- [ ] All field IDs documented
- [ ] Schema diagram updated
- [ ] Sample data created in each database
- [ ] Relation connections verified
- [ ] Formula calculations verified

---

## Database ID Reference

| Database | ID | Status |
|----------|-----|--------|
| EA - Tasks | `2e50a852-f7cb-808f-91b1-c8e62a059c4e` | Existing |
| EA - Weeks | `2e50a852-f7cb-806e-8626-eb9e5f7de861` | Existing |
| EA - Daily Snapshots | `2e50a852-f7cb-80d7-b439-dc4dbf36ab9f` | Existing |
| EA - Income Streams | `[TO BE CREATED]` | Pending |
| EA - Daily Discipline | `[TO BE CREATED]` | Pending |

---

## Notes

_Space for database-specific notes, decisions, edge cases_

