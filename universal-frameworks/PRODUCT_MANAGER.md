# Product Manager — Feature Ownership

## Role
Define what gets built and why. Own feature specifications, user stories, and acceptance criteria. Bridge between CEO vision and engineering execution.

## Current Phase: 1 — Foundation

---

## Product Philosophy

1. **User value first** — Every feature must solve a real problem
2. **Minimum viable scope** — Ship small, learn fast
3. **Metrics-driven** — If we can't measure it, we can't improve it
4. **Edge cases matter** — Think through failure modes
5. **Document decisions** — Future you will thank present you

---

## Active Tasks

### PM-001: Income Streams Feature Spec
**Priority:** P0
**Status:** 🔵 In Progress
**Deliverable:** `specs/INCOME_STREAMS.md`

#### User Story
> As a user, I want to categorize my tasks by income stream so I can see which revenue sources are getting attention and which are being neglected.

#### Feature Requirements

**Core Functionality:**
- Create, edit, archive income streams
- Link tasks to income streams
- View tasks grouped by income stream
- Dashboard showing income stream activity

**Data Model:**
```
Income Stream:
  - Stream Name (title) - Required
  - Type (select): Product | Service | Investment | Employment
  - Status (select): Active | Building | Paused | Archived
  - Monthly Target (number) - Optional
  - Current Monthly (number) - Optional
  - Priority (select): Primary | Secondary | Experimental
```

**User Flows:**
1. **Add Income Stream:** Settings → Income Streams → Add New → Fill form → Save
2. **Link Task:** Task Detail → Income Stream dropdown → Select → Auto-save
3. **View by Stream:** Dashboard → Filter by Income Stream → See tasks

**Acceptance Criteria:**
- [ ] User can create income stream with all fields
- [ ] User can edit existing income stream
- [ ] User can archive (soft delete) income stream
- [ ] Tasks can be linked to one income stream
- [ ] Dashboard shows task count per income stream
- [ ] Archived streams hidden by default, viewable with toggle

**Edge Cases:**
- What if income stream is archived but has active tasks? → Show warning, don't auto-unlink
- What if user creates duplicate name? → Allow it (user's choice)
- What if income stream deleted? → Soft delete only, tasks retain link to archived stream

---

### PM-002: Revenue Potential Feature Spec
**Priority:** P0
**Status:** 🔵 In Progress
**Deliverable:** `specs/REVENUE_POTENTIAL.md`

#### User Story
> As a user, I want to classify tasks by their revenue potential so the system can flag when I'm not working on revenue-generating activities.

#### Feature Requirements

**Revenue Potential Categories:**
| Category | Definition | Color |
|----------|------------|-------|
| Direct Revenue | Task directly generates income (sales call, invoice, delivery) | Green |
| Pipeline | Task moves a deal forward (proposal, follow-up, demo) | Blue |
| Infrastructure | Task enables future revenue (systems, processes, hiring) | Yellow |
| Maintenance | Task prevents loss but doesn't grow (admin, compliance, support) | Gray |

**Auto-Flag Logic:**
```
IF user plans tasks for a day
AND count(tasks WHERE revenue_potential = "Direct Revenue") == 0
THEN show warning banner: "⚠️ No revenue-generating tasks planned"
```

**Escalation Rules:**
- 1 day without Direct Revenue: Warning banner (dismissible)
- 2 consecutive days: Status changes to "At Risk"
- 3+ consecutive days: Agent escalates in CEO Day review

**Acceptance Criteria:**
- [ ] All tasks have Revenue Potential field (nullable for old tasks)
- [ ] Field appears in task creation/edit form
- [ ] Badge displays in task list with color coding
- [ ] Warning banner shows when no Direct Revenue tasks planned
- [ ] Banner is dismissible but reappears next day if still no revenue tasks
- [ ] Agent notes include revenue task count in daily evaluation

---

### PM-003: Daily Discipline Feature Spec
**Priority:** P1
**Status:** ⏸️ Blocked
**Blocked By:** PM-001, PM-002 (focus on revenue features first)
**Deliverable:** `specs/DAILY_DISCIPLINE.md`

#### User Story
> As a user, I want to track my daily health habits (workout, meals, steps) so I can see the correlation between physical discipline and work execution.

#### Feature Requirements

**Discipline Checkboxes:**
- Workout Done (checkbox)
- Meals On Plan (checkbox)
- Steps Goal Hit (checkbox)

**Discipline Score:**
- Formula: Sum of checked items (0-3)
- Display: Visual indicator (0 = red, 1-2 = yellow, 3 = green)

**Integration with Daily Check-In:**
- Appears at bottom of check-in screen
- Quick tap to toggle
- Persists to Daily Discipline database
- Links to Daily Snapshot

**Acceptance Criteria:**
- [ ] Three checkboxes appear in daily check-in
- [ ] Score calculates correctly (0-3)
- [ ] Score displays with color coding
- [ ] Data saves to Daily Discipline database
- [ ] CEO Day shows weekly discipline average
- [ ] Trend visible over time (improving/declining)

---

### PM-004: SMS Check-In Flow Spec
**Priority:** P1
**Status:** ⏸️ Blocked
**Blocked By:** Phase 2 start
**Deliverable:** `specs/SMS_CHECKIN.md`

#### User Story
> As a user, I want to receive an SMS at 8:30 PM with a link to check in on my day's tasks, so I can complete the check-in in under 60 seconds on my phone.

#### Feature Requirements

**SMS Content:**
```
Time to check in 📋
[unique-short-link]
```

**Check-In Page (Mobile-Optimized):**
1. Header: Today's date, task count
2. Task list with status dropdowns
3. Conditional fields based on status
4. Discipline checkboxes
5. Submit button

**Performance Requirements:**
- Page load: < 2 seconds on 4G
- Check-in completion: < 60 seconds average
- Link valid for: 4 hours (expires at midnight)

**Tracking:**
- Link opened timestamp
- Check-in completed timestamp
- Time to complete
- Incomplete check-ins flagged

---

## Feature Backlog (Phase 2+)

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Calendar Read | 3 | P0 | See Google Calendar events in planning view |
| Calendar Write | 3 | P1 | Create calendar blocks from tasks |
| CEO Day Dashboard | 5 | P0 | Weekly review and planning interface |
| Agent Auto-Adjust | 4 | P1 | Agent reorders tasks based on patterns |
| Multi-User Onboarding | 6 | P0 | Self-serve setup for new users |

---

## Metrics to Track

### User Engagement
- Daily check-in completion rate
- Time to complete check-in
- SMS open rate
- Web app session duration

### System Effectiveness
- Revenue tasks planned per week
- Revenue tasks completed per week
- Days without revenue tasks (target: 0)
- Discipline score trend
- Agent intervention frequency

### User Outcomes (Self-Reported)
- Perceived focus improvement
- Revenue attribution to system
- Time saved on planning

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| - | - | - | - |

---

## Notes

_Space for product thinking, user feedback, feature ideas_

