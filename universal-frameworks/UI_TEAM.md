# UI Team — Frontend Development

## Role
Build React components, implement responsive layouts, handle client-side state, create seamless user experience.

## Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- DnD Kit (drag and drop)

## Current Phase: 1 — Foundation

---

## Design System

### Colors (from Tailwind config)
```css
navy: #1E2761        /* Primary dark */
ice-blue: #CADCFC    /* Secondary light */
accent-teal: #028090 /* Primary accent */
accent-green: #10B981 /* Success */
accent-orange: #F97316 /* Warning */
light-gray: #F5F5F5  /* Background */
```

### Priority Badge Colors
```css
.priority-revenue { @apply bg-green-100 text-green-800; }      /* 💰 Revenue */
.priority-compounding { @apply bg-pink-100 text-pink-800; }    /* 📈 Compounding */
.priority-commitment { @apply bg-orange-100 text-orange-800; } /* 🤝 Commitment */
.priority-operations { @apply bg-red-100 text-red-800; }       /* ⚙️ Operations */
.priority-optional { @apply bg-yellow-100 text-yellow-800; }   /* ❓ Optional */
```

### Revenue Potential Badge Colors
```css
.revenue-direct { @apply bg-green-500 text-white; }      /* 💵 Direct */
.revenue-pipeline { @apply bg-blue-100 text-blue-800; }  /* 🔄 Pipeline */
.revenue-infra { @apply bg-yellow-100 text-yellow-800; } /* 🏗️ Infrastructure */
.revenue-maint { @apply bg-gray-100 text-gray-600; }     /* 🔧 Maintenance */
```

---

## Active Tasks

### UI-001: Create Income Stream Selector Component
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-003 (Income Streams API)

#### Objective
Create dropdown component to select income stream when adding/editing tasks.

#### Component Specification
```typescript
interface IncomeStreamSelectorProps {
  value: string | null
  onChange: (streamId: string | null) => void
  disabled?: boolean
}

// Features:
// - Fetch streams from API on mount
// - Show stream name + status badge
// - Allow clearing selection
// - Loading state while fetching
// - Error state if API fails
```

#### Visual Design
```
┌─────────────────────────────────┐
│ Income Stream          ▼       │
├─────────────────────────────────┤
│ 💰 MAI Bets          [Active]  │
│ ☀️ Solar Sales       [Active]  │
│ 🛡️ Life Insurance   [Active]  │
│ 🤖 AI Automations   [Building] │
│ 📈 Trading          [Active]  │
│ 🎬 Content          [Building] │
├─────────────────────────────────┤
│ ✕ Clear selection              │
└─────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] Fetches streams from /api/income-streams
- [ ] Shows loading spinner while fetching
- [ ] Displays stream name and status
- [ ] Handles selection and clear
- [ ] Works in TaskRow and task creation forms
- [ ] Mobile-friendly (full-width on small screens)

#### Output
- `components/IncomeStreamSelector.tsx`

---

### UI-002: Create Revenue Potential Badge Component
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-005 (Updated Task API)

#### Objective
Create badge component to display revenue potential classification.

#### Component Specification
```typescript
interface RevenuePotentialBadgeProps {
  potential: RevenuePotential | null
  size?: 'sm' | 'md'
}

// Features:
// - Color-coded by type
// - Icon prefix
// - Compact for table view
```

#### Visual Design
```
[💵 Direct]     — Green background
[🔄 Pipeline]   — Blue background
[🏗️ Infra]     — Yellow background
[🔧 Maint]      — Gray background
```

#### Acceptance Criteria
- [ ] Correct colors for each type
- [ ] Shows nothing if null
- [ ] Two sizes (sm for tables, md for detail views)
- [ ] Accessible (proper contrast)

#### Output
- `components/RevenuePotentialBadge.tsx`

---

### UI-003: Add Discipline Checkboxes to Check-In
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-004 (Discipline API)

#### Objective
Add quick discipline tracking to daily check-in page.

#### Component Specification
```typescript
interface DisciplineCheckboxesProps {
  date: string
  initialData?: DailyDiscipline
  onUpdate: (data: DailyDiscipline) => void
}
```

#### Visual Design
```
┌─────────────────────────────────────────────┐
│ Today's Discipline                    2/3   │
├─────────────────────────────────────────────┤
│ [✓] Workout Done                            │
│ [✓] Meals On Plan                           │
│ [ ] Steps Goal Hit                          │
└─────────────────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] Fetches today's discipline on mount
- [ ] Creates entry if none exists
- [ ] Updates immediately on check/uncheck
- [ ] Shows score (0/3, 1/3, etc.)
- [ ] Visual feedback on update (green flash)
- [ ] Positioned above task table

#### Output
- `components/DisciplineCheckboxes.tsx`

---

### UI-004: Update Task Row with New Fields
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** BE-005

#### Objective
Update TaskRow component to display income stream and revenue potential.

#### Changes Required
```
Current columns:
[Drag] [#] [Task Name] [Priority] [Status] [Time] [Blocker] [Type]

New columns:
[Drag] [#] [Task Name] [Stream] [Revenue] [Priority] [Status] [Time] [Blocker] [Type]
```

#### Visual Design
```
| ≡ | 1 | Build landing page | MAI Bets | 💵 Direct | Revenue | Completed | 1-3 hrs | - | - |
```

#### Acceptance Criteria
- [ ] Income stream displayed (name only, truncated if long)
- [ ] Revenue potential badge shown
- [ ] Columns properly sized
- [ ] Mobile view hides less important columns
- [ ] Still draggable
- [ ] No layout breaking

#### Output
- Updated `components/TaskRow.tsx`

---

### UI-005: Revenue Alert Banner Component
**Priority:** P1
**Status:** 🔵 Ready to Start (can build structure, wire up later)
**Dependencies:** None (can mock data)

#### Objective
Create warning banner when no revenue tasks are planned.

#### Component Specification
```typescript
interface RevenueAlertBannerProps {
  show: boolean
  daysWithoutRevenue: number
  onDismiss?: () => void
}
```

#### Visual Design
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ No revenue-generating tasks planned for today               │
│    You've had 0 "Direct Revenue" tasks for 2 days.   [Plan Now]│
└─────────────────────────────────────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] Yellow/orange warning style
- [ ] Shows days count if > 1
- [ ] "Plan Now" button scrolls to task input
- [ ] Dismissible (but reappears next day)
- [ ] Prominent but not annoying

#### Output
- `components/RevenueAlertBanner.tsx`

---

## Completed Tasks

| ID | Task | Completed | Output |
|----|------|-----------|--------|
| - | - | - | - |

---

## Component Library

### Existing Components
- `TaskRow.tsx` — Single task in table
- `TaskTable.tsx` — Full task table with DnD
- `Header.tsx` — App header
- `StatusBanner.tsx` — Execution status display

### New Components (This Phase)
- `IncomeStreamSelector.tsx`
- `RevenuePotentialBadge.tsx`
- `DisciplineCheckboxes.tsx`
- `RevenueAlertBanner.tsx`

---

## Mobile Considerations

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
```

### Mobile Priorities
1. **Daily Check-In** — Must work perfectly on phone
2. **Discipline Checkboxes** — Large tap targets
3. **Task Table** — Horizontal scroll OK, but status column always visible
4. **Income Stream** — Can be hidden on mobile, shown in detail view

---

## Handoff Checklist (to QA Team)

When all tasks complete, provide:

- [ ] All components render without errors
- [ ] Props documented with TypeScript
- [ ] Storybook examples (if applicable)
- [ ] Mobile screenshots
- [ ] Accessibility notes (ARIA labels, focus states)

---

## Notes

_Space for UI-specific notes, design decisions, edge cases_

