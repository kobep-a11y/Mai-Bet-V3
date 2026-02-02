# MAI Bets V3 — Delegation & Team Structure

## Project Overview

**Project:** MAI Bets V3
**Objective:** Complete sports betting signal system with full V2 feature parity
**Timeline:** 4-6 weeks
**Start Date:** January 29, 2026

### Success Criteria
- [x] Core infrastructure operational (Next.js, Airtable, webhooks)
- [x] Trigger engine evaluating conditions correctly
- [x] Signals generating and storing in Airtable
- [ ] Strategy Rules system preventing invalid triggers
- [ ] Win Requirements auto-calculating outcomes
- [ ] Previous trigger state tracking for sequential modes
- [ ] Message templates with placeholders working
- [ ] V2 feature parity achieved (85%+ roadmap completion)

---

## Organization Chart

```
                             ┌─────────────────┐
                             │      CEO        │
                             │   (You/Human)   │
                             └────────┬────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
            ┌────────▼────────┐ ┌─────▼─────┐ ┌───────▼───────┐
            │ Chief of Staff  │ │  Product  │ │   Technical   │
            │   (Orchestrator)│ │  Manager  │ │   Architect   │
            └────────┬────────┘ └───────────┘ └───────────────┘
                     │
     ┌───────────────┼───────────────┬───────────────┬───────────────┐
     │               │               │               │               │
┌────▼────┐    ┌─────▼─────┐   ┌─────▼──────┐  ┌─────▼─────┐  ┌─────▼─────┐
│ Backend │    │ Database  │   │Integration │  │  UI Team  │  │ QA Team   │
│  Team   │    │   Team    │   │   Team     │  │           │  │           │
└─────────┘    └───────────┘   └────────────┘  └───────────┘  └───────────┘
```

---

## Role Definitions

### 🎯 CEO (Human)
**Role:** Strategic decisions, approval gates, vision alignment

**Responsibilities:**
- Approve major decisions at gate reviews
- Provide context and clarify requirements
- Review completed phases
- Final sign-off on deliverables

**When to Escalate to CEO:**
- Scope changes exceeding 20% of original estimate
- Technical decisions that affect future scalability
- Production deployments and live system changes
- Breaking changes to N8N webhook or Airtable schema

---

### 📋 Chief of Staff (Orchestrator Agent)
**Role:** Coordination, task distribution, progress tracking

**Responsibilities:**
- Break down phases into team-specific tasks
- Track dependencies between teams
- Ensure clean handoffs
- Report progress to CEO
- Escalate blockers within 10 minutes

**Inputs:** CEO directives, phase requirements from roadmap
**Outputs:** Team task assignments, status reports, blocker alerts

**Status Dashboard Template:**
```
## Project Status — {{DATE}}

### Phase: {{CURRENT_PHASE}} ({{PHASE_PROGRESS}}%)

| Team | Current Task | Status | Blockers |
|------|--------------|--------|----------|
| Backend | Implement passesRules() | 🟢/🟡/🔴 | None |
| Database | Add Rules field to Strategies | 🟢/🟡/🔴 | None |
| Integration | Update N8N webhook | 🟢/🟡/🔴 | Waiting on N8N access |
| UI | Strategy builder (blocked) | ⏸️ | Backend BE-001 |
| QA | Testing rules system | 🟢/🟡/🔴 | None |

### Critical Path
1. DB-001: Add Rules field → BE-001: passesRules() → QA-001: Test rules
2. DB-002: Add WinRequirements → BE-002: outcome-service → QA-002: Test outcomes

### Risks
- N8N webhook changes require coordination with external workflow
- Airtable schema changes could break existing triggers

### CEO Attention Needed
- [ ] Approve DB schema changes before Backend starts
```

---

### 📱 Product Manager Agent
**Role:** User experience, feature specifications, acceptance criteria

**Responsibilities:**
- Write detailed feature specs for V2 parity features
- Define acceptance criteria matching V2 behavior
- Prioritize backlog using roadmap phases
- Ensure features solve the stated problem (V2 compatibility)

**Inputs:** V2 reference code, roadmap requirements, CEO vision
**Outputs:** Feature specs, user stories, acceptance criteria

**Feature Spec Template:**
```
## Feature: {{FEATURE_NAME}}
**Priority:** P0/P1/P2
**Phase:** {{PHASE_NUMBER}}
**V2 Reference:** {{V2_FILE_LOCATION}}
**Status:** Draft / In Review / Approved

### User Story
> As a betting system, I want to {{ACTION}} so that {{BENEFIT}}.

### Requirements
- [ ] {{REQUIREMENT_1}}
- [ ] {{REQUIREMENT_2}}

### V2 Behavior
{{DESCRIPTION_OF_HOW_V2_DOES_THIS}}

### Acceptance Criteria
- [ ] Given {{CONTEXT}}, when {{ACTION}}, then {{RESULT}}
- [ ] Behavior matches V2 reference code

### Edge Cases
- What if {{EDGE_CASE_1}}? → {{HANDLING}}

### Out of Scope
- {{EXPLICITLY_NOT_INCLUDED}}
```

---

### 🏗️ Technical Architect Agent
**Role:** System design, API contracts, technical decisions

**Responsibilities:**
- Design system architecture
- Define API contracts and data models
- Establish coding standards
- Make technology decisions (documented with rationale)
- Review implementations for quality

**Inputs:** Feature specs, technical requirements, V2 reference code
**Outputs:** Architecture docs, API specs, technical decision records

**Current Architecture:**
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   b365api   │────▶│       N8N        │────▶│  MAI Bets   │
│  (Source)   │     │   (Automation)   │     │  (Vercel)   │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                     │
                     ┌───────────────────────────────┼───────────────────┐
                     │                               │                   │
                     ▼                               ▼                   ▼
              ┌─────────────┐              ┌─────────────────┐    ┌──────────┐
              │  In-Memory  │              │    Airtable     │    │ Discord  │
              │ Live Games  │              │  (Strategies,   │    │(Alerts)  │
              │  (Real-time)│              │    Signals)     │    │          │
              └─────────────┘              └─────────────────┘    └──────────┘
```

---

### 💻 Backend Team
**Focus:** Core signal engine, strategy rules, trigger evaluation, outcome calculation

**Responsibilities:**
- Implement strategy rules system (passesRules)
- Create win requirements and auto-outcome logic
- Add previous trigger state tracking
- Build trigger history storage
- Implement message template formatting

**Tech Stack / Tools:**
- TypeScript, Next.js API routes
- Airtable REST API
- In-memory game store

**Inputs:** Feature specs, Airtable schema, V2 reference code
**Outputs:** Service files in `lib/`, API routes, TypeScript types

---

### 🗄️ Database Team
**Focus:** Airtable schema design and updates

**Responsibilities:**
- Add new fields to existing tables (Strategies, Signals)
- Create new tables (Timeline Snapshots)
- Update field types and validation rules
- Document schema changes
- Provide migration notes for existing data

**Tech Stack / Tools:**
- Airtable UI
- Airtable API for bulk updates

**Inputs:** Feature specs, data model requirements
**Outputs:** Updated Airtable schema, migration documentation, sample data

---

### 🔌 Integration Team
**Focus:** External services (N8N, Discord, future SMS)

**Responsibilities:**
- Update N8N webhook to include team names
- Implement Discord message templates
- Add SMS alerts (Phase 7)
- Maintain webhook contracts
- Test external integrations

**Tech Stack / Tools:**
- N8N workflow editor
- Discord webhook API
- Twilio API (future)

**Inputs:** API contracts, webhook specs, message templates
**Outputs:** Updated N8N workflows, Discord service enhancements, integration tests

---

### 🎨 UI Team
**Focus:** Dashboard, strategy builder, signal history visualization

**Responsibilities:**
- Build strategy builder/editor UI
- Create signal history timeline view
- Enhance analytics dashboard
- Improve mobile responsiveness
- Implement message template editor

**Tech Stack / Tools:**
- React, Next.js App Router
- Tailwind CSS
- TypeScript

**Inputs:** Feature specs, API endpoints, design mockups
**Outputs:** React components, pages, UI enhancements

---

### ✅ QA Team
**Focus:** Testing, validation, V2 parity verification

**Responsibilities:**
- Verify features match V2 behavior
- Test edge cases and error handling
- Validate against acceptance criteria
- Regression testing of existing features
- Sign off on completed work

**Inputs:** Acceptance criteria, V2 reference code, completed features
**Outputs:** Test results, bug reports, quality sign-off

**Bug Report Template:**
```
## BUG-{{NUMBER}}: {{TITLE}}
**Severity:** Critical / High / Medium / Low
**Found In:** {{FEATURE_OR_COMPONENT}}
**V2 Expected Behavior:** {{WHAT_V2_DOES}}
**V3 Actual Behavior:** {{WHAT_V3_DOES}}

### Steps to Reproduce
1. {{STEP_1}}
2. {{STEP_2}}

### Expected Result (V2 Behavior)
{{WHAT_SHOULD_HAPPEN}}

### Actual Result (V3 Behavior)
{{WHAT_ACTUALLY_HAPPENS}}

### Evidence
{{LOGS_OR_SCREENSHOTS}}
```

---

## Communication Protocols

### Task Assignment Format
Every task given to a team follows this structure:

```markdown
## Task: {{TASK_ID}}
**Team:** {{TEAM_NAME}}
**Priority:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
**Phase:** {{PHASE_NUMBER}}
**Estimated Effort:** {{HOURS_OR_DAYS}}
**Dependencies:** {{PREREQUISITE_TASKS_OR_NONE}}
**V2 Reference:** {{FILE_AND_LINE_NUMBERS}}

### Objective
{{SINGLE_SENTENCE_CLEAR_GOAL}}

### Context
{{WHY_THIS_TASK_MATTERS}}
{{V2_HOW_IT_WORKED}}

### Requirements
- [ ] {{SPECIFIC_REQUIREMENT_1}}
- [ ] {{SPECIFIC_REQUIREMENT_2}}

### Acceptance Criteria
- [ ] {{TESTABLE_CRITERION_1}}
- [ ] Behavior matches V2 reference code

### Inputs Available
- V2 reference: {{FILE_PATH}}
- Current implementation: {{FILE_PATH}}
- Airtable schema: {{TABLE_NAMES}}

### Expected Outputs
- {{DELIVERABLE_1}} (e.g., new service file)
- {{DELIVERABLE_2}} (e.g., updated types)

### Handoff To
- {{NEXT_TEAM_OR_PERSON}}
```

---

### Escalation Protocol

| Condition | Action | Escalate To | Response Time |
|-----------|--------|-------------|---------------|
| Blocked > 10 min | Report blocker | Chief of Staff | Immediate |
| V2 behavior unclear | Ask for clarification | Product Manager | 1 hour |
| Technical decision needed | Document options | Technical Architect | 2 hours |
| Schema change needed | Gate review request | CEO | 4 hours |
| Production issue | Stop and alert | CEO + All Teams | Immediate |

---

## Phase Structure

### Phase 0: Foundation ✅
**Duration:** Complete
**Goal:** Environment ready, team aligned, dependencies resolved

**Completed Tasks:**
- [x] Next.js 14 app with TypeScript
- [x] Airtable integration (REST API)
- [x] Webhook endpoint operational
- [x] Trigger engine with condition evaluation
- [x] Signal creation and Discord alerts
- [x] Historical game and player stats tracking

**Status:** ~70% complete per roadmap

---

### Phase 1: Strategy Rules System
**Duration:** 3 hours
**Goal:** Implement pre-conditions that block strategies from running

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| DB-001 | Add Rules field to Strategies table | Database | P0 | None |
| BE-001 | Implement passesRules() function | Backend | P0 | DB-001 |
| BE-001a | Add Rule type to types/index.ts | Backend | P0 | None |
| BE-001b | Update strategy-service to parse rules | Backend | P0 | DB-001 |
| BE-001c | Call passesRules() in webhook handler | Backend | P0 | BE-001 |
| QA-001 | Test strategy rules block correctly | QA | P0 | BE-001 |

**Exit Criteria:**
- [ ] Rules field exists in Airtable Strategies table
- [ ] passesRules() correctly blocks based on first_half_only, stop_at, etc.
- [ ] Tests pass matching V2 behavior
- [ ] QA sign-off
- [ ] CEO approval to proceed

---

### Phase 2: Win Requirements & Auto-Outcome
**Duration:** 4 hours
**Goal:** Automatic win/loss calculation when games end

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| DB-002 | Add WinRequirements to Strategies | Database | P0 | None |
| BE-002 | Create lib/outcome-service.ts | Backend | P0 | DB-002 |
| BE-002a | Add WinRequirement type | Backend | P0 | None |
| BE-002b | Implement evaluateOutcome() | Backend | P0 | BE-002a |
| BE-002c | Create /api/cron/calculate-outcomes | Backend | P0 | BE-002b |
| BE-002d | Store winRequirements in signals | Backend | P0 | DB-002 |
| QA-002 | Verify auto-outcome matches V2 | QA | P0 | BE-002 |

**Exit Criteria:**
- [ ] WinRequirements field in Strategies
- [ ] Auto-outcome calculates leading_team_wins correctly
- [ ] Cron endpoint processes finished games
- [ ] Tests match V2 behavior
- [ ] QA sign-off
- [ ] CEO approval

---

### Phase 3: Previous Trigger State Tracking
**Duration:** 3 hours
**Goal:** Track state from previous triggers for sequential mode

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| BE-003a | Add TriggerSnapshot interface | Backend | P0 | None |
| BE-003b | Store trigger snapshots in signals | Backend | P0 | BE-003a |
| BE-003c | Add prev_leader_* fields to context | Backend | P0 | BE-003b |
| BE-003d | Calculate prev_leader fields | Backend | P0 | BE-003c |
| QA-003 | Test sequential triggers with prev_leader | QA | P0 | BE-003 |

**Exit Criteria:**
- [ ] Trigger snapshots stored correctly
- [ ] prev_leader_still_leads field works
- [ ] Sequential triggers evaluate correctly
- [ ] QA sign-off
- [ ] CEO approval

---

### Phase 4: Trigger History Storage
**Duration:** 2 hours
**Goal:** Store complete history of all triggers that fired

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| BE-004a | Add TriggerHistoryEntry type | Backend | P1 | None |
| BE-004b | Build trigger history in signal creation | Backend | P1 | BE-004a |
| BE-004c | Store trigger history in signal snapshot | Backend | P1 | BE-004b |
| UI-004 | Display trigger timeline in UI (optional) | UI | P2 | BE-004 |
| QA-004 | Verify trigger history storage | QA | P1 | BE-004 |

**Exit Criteria:**
- [ ] Trigger history array stores all fired triggers
- [ ] Discord alerts show trigger timeline (optional)
- [ ] QA sign-off

---

### Phase 5: Message Templates
**Duration:** 2 hours
**Goal:** Customizable message templates with placeholders

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| DB-005 | Add messageTemplate field to Strategies | Database | P1 | None |
| BE-005a | Create formatMessageTemplate() function | Backend | P1 | DB-005 |
| BE-005b | Update Discord service to use templates | Backend | P1 | BE-005a |
| INT-005 | Test Discord templates end-to-end | Integration | P1 | BE-005 |
| QA-005 | Verify template placeholders work | QA | P1 | BE-005 |

**Exit Criteria:**
- [ ] Message templates with 20+ placeholders
- [ ] Discord messages use templates
- [ ] QA sign-off

---

### Phase 6: Timeline Snapshots (Medium Priority)
**Duration:** 4 hours
**Goal:** Capture game start snapshots for backtesting

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| DB-006 | Create Timeline Snapshots table | Database | P2 | None |
| BE-006a | Create lib/timeline-service.ts | Backend | P2 | DB-006 |
| BE-006b | Capture snapshot at game start | Backend | P2 | BE-006a |
| BE-006c | Add backfill logic for late odds | Backend | P2 | BE-006b |
| QA-006 | Test timeline snapshot capture | QA | P2 | BE-006 |

**Exit Criteria:**
- [ ] Snapshots captured at game start
- [ ] Backfill works for late odds
- [ ] QA sign-off

---

### Phase 7: SMS Alerts (Low Priority)
**Duration:** 4 hours
**Goal:** Send SMS in addition to Discord alerts

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| DB-007 | Create SMS Recipients table | Database | P3 | None |
| DB-007a | Create SMS Subscriptions table | Database | P3 | None |
| BE-007 | Create lib/sms-service.ts | Backend | P3 | DB-007 |
| INT-007 | Integrate Twilio API | Integration | P3 | BE-007 |
| INT-007a | Add SMS to signal alerts | Integration | P3 | INT-007 |
| QA-007 | Test SMS delivery | QA | P3 | INT-007 |

**Exit Criteria:**
- [ ] SMS sends on signal creation
- [ ] Subscription management works
- [ ] QA sign-off

---

### Phase 8: AI Features (Low Priority)
**Duration:** 10+ hours
**Goal:** AI-powered strategy builder and discovery

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| BE-008a | Create lib/ai/strategy-builder.ts | Backend | P3 | Phase 1-3 complete |
| BE-008b | Create lib/ai/strategy-discovery.ts | Backend | P3 | Phase 1-3 complete |
| BE-008c | Add /api/ai/build-strategy endpoint | Backend | P3 | BE-008a |
| BE-008d | Add /api/ai/discover endpoint | Backend | P3 | BE-008b |
| UI-008 | Create AI features UI | UI | P3 | BE-008 |
| QA-008 | Test AI features | QA | P3 | UI-008 |

**Exit Criteria:**
- [ ] AI strategy builder works
- [ ] AI discovery finds patterns
- [ ] CEO sign-off

---

## Dependency Graph

```
Phase 1: Strategy Rules
  DB-001 (Database) → BE-001 (Backend) → QA-001 (QA)
                             ↓
Phase 2: Win Requirements
  DB-002 (Database) → BE-002 (Backend) → QA-002 (QA)
                             ↓
Phase 3: Previous Trigger State
  BE-003 (Backend) → QA-003 (QA)
       ↓
Phase 4: Trigger History
  BE-004 (Backend) → QA-004 (QA)
       ↓
Phase 5: Message Templates
  DB-005 (Database) → BE-005 (Backend) → INT-005 (Integration) → QA-005 (QA)

Parallel Tracks:
Phase 6: Timeline Snapshots (independent)
Phase 7: SMS Alerts (independent)
Phase 8: AI Features (requires Phases 1-3)
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 (10 hours total for V2 parity)

---

## Execution Rules

### Rule 1: Single Focus
Each agent works on ONE task at a time. Complete it before starting another.

### Rule 2: Clean Handoffs
Before marking complete:
- All acceptance criteria verified
- Output documented
- Next team notified and unblocked

### Rule 3: Blockers Escalate Fast
If blocked for >10 minutes of real work, escalate immediately. Don't spin.

### Rule 4: No Assumptions
Requirements unclear? Ask. Don't guess and build the wrong thing.

### Rule 5: Test Before Handoff
Every output verified working before passing downstream.

### Rule 6: Document Decisions
Any non-obvious choice gets documented with rationale for future reference.

### Rule 7: V2 Reference Required
Always compare V3 implementation to V2 reference code for correctness.

---

## Approval Gates

**CEO Review Required Before:**
- [ ] Phase transitions
- [ ] Airtable schema changes
- [ ] N8N webhook modifications
- [ ] Production deployments
- [ ] Scope changes > 20%

**Gate Review Format:**
```markdown
## Gate Review: Phase {{N}} → Phase {{N+1}}
**Date:** {{DATE}}
**Presented By:** Chief of Staff

### Phase {{N}} Summary
- **Goal:** {{WHAT_WE_SET_OUT_TO_DO}}
- **Result:** {{WHAT_WE_ACHIEVED}}
- **V2 Parity:** {{COMPARISON_TO_V2}}

### Deliverables Completed
- [x] {{DELIVERABLE_1}}
- [x] {{DELIVERABLE_2}}

### Quality Validation
- [x] QA sign-off received
- [x] All acceptance criteria met
- [x] Behavior matches V2 reference
- [x] No regressions in existing features

### Phase {{N+1}} Preview
- **Goal:** {{NEXT_PHASE_GOAL}}
- **Key Risks:** {{RISKS}}
- **Dependencies:** {{WHAT_WE_NEED}}

### Recommendation
Proceed to Phase {{N+1}}? Yes / No (with conditions)

### CEO Decision
- [ ] Approved
- [ ] Approved with changes: {{CHANGES}}
- [ ] Not approved: {{REASON}}
```

---

## V2 Reference Files

All V2 code available at:
```
/sessions/eloquent-wonderful-dijkstra/v2-framework/game-pulse-keeper-main/supabase/functions/
```

**Key Files:**
- `game-update/index.ts` - Main webhook (1700+ lines)
  - Lines 789-838: passesRules() implementation
  - Lines 1314-1358: evaluateSingleCondition() with prev_leader fields
  - Lines 1476-1550: createSignal() with trigger history
- `auto-outcome/index.ts` - Outcome calculation
- `ai-strategy-builder/index.ts` - AI builder
- `send-sms/index.ts` - SMS service

---

## Principles

> **"V2 parity first. Every feature matches reference code. Every handoff is clean."**

1. **V2 Compatibility** — Match V2 behavior exactly before adding enhancements
2. **Small batches** — Deliver incrementally, get feedback early
3. **Single responsibility** — One team, one focus, one task at a time
4. **Explicit over implicit** — Write it down, don't assume
5. **Escalate early** — A 10-minute blocker becomes a 10-hour blocker if hidden

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 29, 2026 | Initial framework customized for MAI Bets V3 |

---

*Framework customized for MAI Bets V3 sports betting signal system with V2 feature parity focus.*
