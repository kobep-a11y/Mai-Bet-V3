# Technical Architect — System Design

## Role
Own the technical vision. Define architecture, API contracts, and integration patterns. Make decisions that scale. Ensure code quality and maintainability.

## Current Phase: 1 — Foundation

---

## Architecture Philosophy

1. **Simple > Clever** — Prefer boring technology that works
2. **Type everything** — TypeScript everywhere, no `any`
3. **Fail fast, fail loud** — Errors should be obvious, not silent
4. **Stateless where possible** — Notion is the source of truth
5. **Mobile-first** — Design for phone, enhance for desktop

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   SMS Link      │   Web App       │   CEO Day Dashboard         │
│   (Mobile)      │   (Desktop)     │   (Desktop)                 │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         └─────────────────┼───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APPLICATION                         │
│                      (Vercel Edge Runtime)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  API Routes │  │  App Router │  │  Cron Jobs  │              │
│  │  /api/*     │  │  Pages      │  │  Scheduled  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │              SERVICE LAYER                     │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │ Notion  │ │Calendar │ │  SMS    │         │              │
│  │  │ Client  │ │ Client  │ │ Client  │         │              │
│  │  └────┬────┘ └────┬────┘ └────┬────┘         │              │
│  └───────┼───────────┼───────────┼──────────────┘              │
│          │           │           │                              │
└──────────┼───────────┼───────────┼──────────────────────────────┘
           │           │           │
           ▼           ▼           ▼
┌─────────────┐  ┌───────────┐  ┌─────────┐
│   NOTION    │  │  GOOGLE   │  │ TWILIO  │
│   (Data)    │  │ CALENDAR  │  │  (SMS)  │
└─────────────┘  └───────────┘  └─────────┘
```

---

## API Contract Definitions

### Tasks API

#### GET /api/tasks
Fetch tasks for current user.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| weekId | string | No | Filter by week relation |
| date | string (YYYY-MM-DD) | No | Filter by scheduled date |
| status | string | No | Filter by status |
| revenueOnly | boolean | No | Only Direct Revenue tasks |

**Response:**
```typescript
{
  success: boolean;
  data: Task[];
  meta: {
    total: number;
    filtered: number;
  }
}
```

#### PATCH /api/tasks
Update a single task.

**Request Body:**
```typescript
{
  id: string;          // Required
  status?: string;
  timeSpent?: string;
  blockerPresent?: boolean;
  blockerType?: string;
  taskOrder?: number;
  revenuePotential?: string;
  incomeStreamId?: string;
  orderChangedBy?: 'Human' | 'Agent';
  orderChangeReason?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: Task;
}
```

#### POST /api/tasks/reorder
Batch update task order.

**Request Body:**
```typescript
{
  tasks: Array<{
    id: string;
    taskOrder: number;
  }>;
  changedBy: 'Human' | 'Agent';
  reason?: string;
}
```

---

### Income Streams API

#### GET /api/income-streams
Fetch all income streams.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | Filter by status (default: Active,Building) |
| includeArchived | boolean | No | Include archived streams |

**Response:**
```typescript
{
  success: boolean;
  data: IncomeStream[];
}
```

#### POST /api/income-streams
Create new income stream.

**Request Body:**
```typescript
{
  streamName: string;    // Required
  type: 'Product' | 'Service' | 'Investment' | 'Employment';
  status?: 'Active' | 'Building' | 'Paused';
  monthlyTarget?: number;
  currentMonthly?: number;
  priority?: 'Primary' | 'Secondary' | 'Experimental';
}
```

#### PATCH /api/income-streams/:id
Update income stream.

#### DELETE /api/income-streams/:id
Archive income stream (soft delete).

---

### Discipline API

#### GET /api/discipline
Get today's discipline entry (creates if not exists).

**Response:**
```typescript
{
  success: boolean;
  data: {
    date: string;
    workoutDone: boolean;
    mealsOnPlan: boolean;
    stepsGoalHit: boolean;
    disciplineScore: number;
  }
}
```

#### PATCH /api/discipline/:date
Update discipline entry.

**Request Body:**
```typescript
{
  workoutDone?: boolean;
  mealsOnPlan?: boolean;
  stepsGoalHit?: boolean;
}
```

---

### Evaluation API

#### POST /api/evaluate
Run end-of-day evaluation (called by cron).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    snapshotId: string;
    executionStatus: string;
    authorityLevel: string;
    agentActions: string[];
  }
}
```

---

## Type Definitions

```typescript
// types/index.ts

export interface Task {
  id: string;
  taskName: string;
  taskOrder: number;
  priorityLevel: PriorityLevel;
  status: TaskStatus;
  timeSpent: TimeSpent | null;
  blockerPresent: boolean;
  blockerType: BlockerType | null;
  incomeStreamId: string | null;
  incomeStreamName: string | null;
  revenuePotential: RevenuePotential | null;
  scheduledDate: string | null;
  weekId: string | null;
  calendarEventId: string | null;
  orderChangedBy: 'Human' | 'Agent' | null;
  orderChangeReason: string | null;
  agentActionTaken: string | null;
  lastEvaluated: string | null;
}

export interface IncomeStream {
  id: string;
  streamName: string;
  type: 'Product' | 'Service' | 'Investment' | 'Employment';
  status: 'Active' | 'Building' | 'Paused' | 'Archived';
  monthlyTarget: number | null;
  currentMonthly: number | null;
  priority: 'Primary' | 'Secondary' | 'Experimental';
}

export interface DailyDiscipline {
  id: string;
  date: string;
  workoutDone: boolean;
  mealsOnPlan: boolean;
  stepsGoalHit: boolean;
  disciplineScore: number;
  linkedSnapshotId: string | null;
}

export interface DailySnapshot {
  id: string;
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  completionRate: number;
  highPriorityMissed: boolean;
  revenueTasksMissed: boolean;
  disciplineScore: number;
  executionStatus: 'On Track' | 'At Risk' | 'Off Track';
  authorityLevel: 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';
  agentNotes: string;
  calendarContext: string | null;
}

export type PriorityLevel =
  | 'Revenue'
  | 'Compounding'
  | 'Commitment'
  | 'Operations'
  | 'Optional';

export type TaskStatus =
  | 'Planned'
  | 'In Progress'
  | 'Completed'
  | 'Missed';

export type TimeSpent =
  | '0-15 Min'
  | '15-60 Min'
  | '1-3 Hrs'
  | '3+ Hrs';

export type BlockerType =
  | 'Scope'
  | 'Dependency'
  | 'Energy'
  | 'External';

export type RevenuePotential =
  | 'Direct Revenue'
  | 'Pipeline'
  | 'Infrastructure'
  | 'Maintenance';
```

---

## Database Schema Mapping

### Notion → TypeScript Field Mapping

| Notion Field | Notion Type | TypeScript Property | Notes |
|--------------|-------------|---------------------|-------|
| Task Name | Title | taskName: string | |
| Task Order | Number | taskOrder: number | |
| Priority Level | Select | priorityLevel: PriorityLevel | |
| Status | Select | status: TaskStatus | |
| Time Spent | Select | timeSpent: TimeSpent \| null | |
| Blocker Present | Checkbox | blockerPresent: boolean | |
| Blocker Type | Select | blockerType: BlockerType \| null | |
| Income Stream | Relation | incomeStreamId: string \| null | |
| Revenue Potential | Select | revenuePotential: RevenuePotential \| null | |
| Scheduled Date | Date | scheduledDate: string \| null | ISO format |
| Week | Relation | weekId: string \| null | |
| Calendar Event ID | Text | calendarEventId: string \| null | |
| Order Changed By | Select | orderChangedBy: 'Human' \| 'Agent' \| null | |
| Order Change Reason | Select | orderChangeReason: string \| null | |
| Agent Action Taken | Select | agentActionTaken: string \| null | |
| Last Evaluated | Date | lastEvaluated: string \| null | ISO format |

---

## Integration Patterns

### Notion Client Pattern
```typescript
// lib/notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Always handle rate limits
async function notionRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.code === 'rate_limited') {
      await sleep(error.headers['retry-after'] * 1000);
      return notionRequest(fn);
    }
    throw error;
  }
}
```

### Google Calendar Pattern
```typescript
// lib/google-calendar.ts
import { google } from 'googleapis';

// Use service account for cron jobs
// Use OAuth for user-initiated requests

export async function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}
```

### Error Handling Pattern
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
  }
}

// API route wrapper
export function withErrorHandling(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message }
        });
      } else {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
        });
      }
    }
  };
}
```

---

## Technical Decisions

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Framework | Next.js 14 | App Router, Edge Runtime, Vercel integration | Phase 0 |
| Database | Notion | User already uses it, free API, no migration needed | Phase 0 |
| Auth | NextAuth.js | Simple, supports Google OAuth, session handling | Phase 0 |
| SMS | Twilio | Industry standard, reliable, good docs | Phase 0 |
| Calendar | Google Calendar API | User's existing calendar, rich API | Phase 0 |
| Styling | Tailwind CSS | Fast development, mobile-first utilities | Phase 0 |
| Drag & Drop | DnD Kit | Modern, accessible, works with React 18 | Phase 0 |

---

## Security Considerations

### Authentication
- NextAuth.js with Google OAuth
- Session-based auth for web app
- Bearer token for cron endpoints
- Unique short-lived tokens for SMS links

### Data Access
- All Notion queries scoped to user's workspace
- Calendar access requires explicit OAuth consent
- No cross-user data leakage possible

### API Security
- CORS configured for production domain only
- Rate limiting on public endpoints
- CRON_SECRET validation on scheduled jobs

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Check-in page load | < 2s | Lighthouse, 4G throttle |
| API response time | < 500ms | P95 latency |
| Notion query time | < 1s | Average |
| Calendar fetch | < 2s | Week view |
| Daily evaluation | < 30s | Cron job duration |

---

## Notes

_Space for architectural decisions, trade-offs, technical debt tracking_

