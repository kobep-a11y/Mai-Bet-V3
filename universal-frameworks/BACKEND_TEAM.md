# Backend Team — API & Business Logic

## Role
Build API routes, implement business logic, handle authentication, create cron jobs.

## Tech Stack
- Next.js 14 API Routes
- TypeScript
- NextAuth.js
- Vercel Cron
- @notionhq/client

## Current Phase: 1 — Foundation

---

## Active Tasks

### BE-001: Update TypeScript Types for New Schema
**Priority:** P0
**Status:** ⏸️ Blocked
**Dependencies:** DB-001, DB-002, DB-003, DB-004, DB-005
**Blocked By:** Database Team completing schema changes

#### Objective
Update all TypeScript type definitions to match new Notion schema.

#### Files to Update
```
src/types/index.ts
```

#### New Types Required
```typescript
// Income Stream Types
export type IncomeStreamType = 'Product' | 'Service' | 'Investment' | 'Employment'
export type IncomeStreamStatus = 'Active' | 'Building' | 'Paused' | 'Archived'
export type IncomeStreamPriority = 'Primary' | 'Secondary' | 'Experimental'

export interface IncomeStream {
  id: string
  url: string
  streamName: string
  type: IncomeStreamType
  status: IncomeStreamStatus
  monthlyTarget: number | null
  currentMonthly: number | null
  description: string | null
  priority: IncomeStreamPriority | null
}

// Revenue Potential (add to Task)
export type RevenuePotential = 'Direct Revenue' | 'Pipeline' | 'Infrastructure' | 'Maintenance'

// Update Task interface
export interface Task {
  // ... existing fields ...
  revenuePotential: RevenuePotential | null  // NEW
  incomeStreamId: string | null               // NEW
  incomeStream?: IncomeStream                 // NEW (populated)
}

// Daily Discipline
export interface DailyDiscipline {
  id: string
  url: string
  date: string
  workoutDone: boolean
  mealsOnPlan: boolean
  stepsGoalHit: boolean
  disciplineScore: number
  notes: string | null
  linkedSnapshotId: string | null
}

// Pace (add to Week)
export type Pace = 'In Discipline' | 'In Effort' | 'On Paper' | 'No'

// Update Week interface
export interface Week {
  // ... existing fields ...
  pace: Pace | null                    // NEW
  revenueTasksPlanned: number | null   // NEW
  revenueTasksCompleted: number | null // NEW
}
```

#### Acceptance Criteria
- [ ] All new types defined
- [ ] Task interface updated with new fields
- [ ] Week interface updated with new fields
- [ ] No TypeScript errors in codebase
- [ ] Types exported correctly

#### Output
- Updated `types/index.ts`

---

### BE-002: Update Notion Client Library
**Priority:** P0
**Status:** ⏸️ Blocked
**Dependencies:** BE-001

#### Objective
Update Notion client to handle all new database operations.

#### Files to Update
```
src/lib/notion.ts
```

#### Functions to Add
```typescript
// Income Streams
export async function getIncomeStreams(): Promise<IncomeStream[]>
export async function getIncomeStream(id: string): Promise<IncomeStream>
export async function createIncomeStream(data: CreateIncomeStreamInput): Promise<IncomeStream>
export async function updateIncomeStream(id: string, data: UpdateIncomeStreamInput): Promise<void>

// Daily Discipline
export async function getDisciplineEntry(date: string): Promise<DailyDiscipline | null>
export async function createDisciplineEntry(data: CreateDisciplineInput): Promise<DailyDiscipline>
export async function updateDisciplineEntry(id: string, data: UpdateDisciplineInput): Promise<void>

// Updated Task functions
export async function getTasksWithIncomeStream(): Promise<Task[]>
```

#### Acceptance Criteria
- [ ] All new functions implemented
- [ ] Existing functions updated for new fields
- [ ] Error handling consistent
- [ ] Database IDs from environment variables
- [ ] Helper functions for property extraction

#### Output
- Updated `lib/notion.ts`

---

### BE-003: Create Income Streams API Routes
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-002

#### Objective
Create full CRUD API for income streams.

#### Endpoints
```
GET    /api/income-streams      — List all streams
GET    /api/income-streams/[id] — Get single stream
POST   /api/income-streams      — Create new stream
PATCH  /api/income-streams/[id] — Update stream
DELETE /api/income-streams/[id] — Archive stream (soft delete)
```

#### File Structure
```
src/app/api/income-streams/
├── route.ts           — GET (list), POST (create)
└── [id]/
    └── route.ts       — GET, PATCH, DELETE
```

#### Acceptance Criteria
- [ ] All endpoints working
- [ ] Proper error responses (400, 404, 500)
- [ ] Input validation
- [ ] TypeScript types enforced
- [ ] Authentication required

#### Output
- API routes in `app/api/income-streams/`

---

### BE-004: Create Discipline Tracking API Routes
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-002

#### Objective
Create API for daily discipline tracking.

#### Endpoints
```
GET   /api/discipline           — Get today's entry (or create if none)
GET   /api/discipline/[date]    — Get specific date
PATCH /api/discipline/[date]    — Update discipline entry
GET   /api/discipline/week      — Get current week's entries
```

#### Acceptance Criteria
- [ ] Auto-creates entry if none exists for today
- [ ] Date format: YYYY-MM-DD
- [ ] Calculates discipline score automatically
- [ ] Returns week summary for CEO Day

#### Output
- API routes in `app/api/discipline/`

---

### BE-005: Update Task API for New Fields
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-002

#### Objective
Update existing task API to handle revenue potential and income stream.

#### Changes Required
```
PATCH /api/tasks
  - Accept revenuePotential field
  - Accept incomeStreamId field

GET /api/tasks
  - Include revenuePotential in response
  - Include incomeStream relation (populated)
  - Add filter: ?revenueOnly=true (Direct Revenue tasks only)
```

#### Acceptance Criteria
- [ ] Tasks return new fields
- [ ] Can update revenue potential
- [ ] Can link/unlink income stream
- [ ] Filter by revenue tasks works
- [ ] Backward compatible (existing calls still work)

#### Output
- Updated `app/api/tasks/route.ts`

---

## Completed Tasks

| ID | Task | Completed | Output |
|----|------|-----------|--------|
| - | - | - | - |

---

## Handoff Checklist (to UI Team)

When all tasks complete, provide:

- [ ] API documentation with request/response examples
- [ ] TypeScript types exported for frontend use
- [ ] Error code reference
- [ ] Base URL and authentication requirements
- [ ] Postman/curl examples for testing

---

## API Documentation Template

```markdown
### Endpoint: [METHOD] /api/[path]

**Description:** [What it does]

**Authentication:** Required / Not Required

**Request:**
```json
{
  "field": "value"
}
```

**Response (200):**
```json
{
  "data": {}
}
```

**Errors:**
- 400: [Bad request reason]
- 401: [Unauthorized reason]
- 404: [Not found reason]
- 500: [Server error reason]
```

---

## Notes

_Space for backend-specific notes, decisions, edge cases_

