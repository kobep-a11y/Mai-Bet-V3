# Universal Delegation Framework
### A Reusable Structure for AI-Assisted Project Execution

---

## How to Use This Framework

1. **Copy this file** to your project folder
2. **Replace all `{{PLACEHOLDERS}}`** with your project specifics
3. **Remove teams you don't need** (or add custom ones)
4. **Customize task formats** to match your workflow
5. **Begin execution** with Phase 0 setup tasks

---

# {{PROJECT_NAME}} — Delegation & Team Structure

## Project Overview

**Project:** {{PROJECT_NAME}}
**Objective:** {{ONE_SENTENCE_GOAL}}
**Timeline:** {{ESTIMATED_WEEKS}} weeks
**Start Date:** {{START_DATE}}

### Success Criteria
- [ ] {{SUCCESS_METRIC_1}}
- [ ] {{SUCCESS_METRIC_2}}
- [ ] {{SUCCESS_METRIC_3}}

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
    ┌───────────────┼───────────────┬───────────────┐
    │               │               │               │
┌───▼───┐     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
│ Team  │     │   Team    │   │   Team    │   │    QA     │
│   A   │     │     B     │   │     C     │   │   Team    │
└───────┘     └───────────┘   └───────────┘   └───────────┘
```

**Customize the org chart** — Add or remove teams based on your project needs.

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
- Budget or resource allocation decisions
- Anything touching production/live systems

---

### 📋 Chief of Staff (Orchestrator Agent)
**Role:** Coordination, task distribution, progress tracking

**Responsibilities:**
- Break down phases into team-specific tasks
- Track dependencies between teams
- Ensure clean handoffs
- Report progress to CEO
- Escalate blockers within 10 minutes

**Inputs:** CEO directives, phase requirements
**Outputs:** Team task assignments, status reports, blocker alerts

**Status Dashboard Template:**
```
## Project Status — {{DATE}}

### Phase: {{CURRENT_PHASE}} ({{PHASE_PROGRESS}}%)

| Team | Current Task | Status | Blockers |
|------|--------------|--------|----------|
| {{TEAM_A}} | {{TASK}} | 🟢/🟡/🔴 | {{BLOCKER_OR_NONE}} |

### Critical Path
1. {{NEXT_CRITICAL_TASK}}
2. {{FOLLOWING_TASK}}

### Risks
- {{RISK_1}}

### CEO Attention Needed
- [ ] {{DECISION_NEEDED}}
```

---

### 📱 Product Manager Agent
**Role:** User experience, feature specifications, acceptance criteria

**Responsibilities:**
- Write detailed feature specs
- Define user flows and journeys
- Create acceptance criteria (testable, specific)
- Prioritize backlog using value/effort matrix
- Ensure features solve the stated problem

**Inputs:** Roadmap, user requirements, CEO vision
**Outputs:** Feature specs, user stories, acceptance criteria

**Feature Spec Template:**
```
## Feature: {{FEATURE_NAME}}
**Priority:** P0/P1/P2
**Phase:** {{PHASE_NUMBER}}
**Status:** Draft / In Review / Approved

### User Story
> As a {{USER_TYPE}}, I want to {{ACTION}} so that {{BENEFIT}}.

### Requirements
- [ ] {{REQUIREMENT_1}}
- [ ] {{REQUIREMENT_2}}

### User Flow
1. User does {{ACTION_1}}
2. System responds with {{RESPONSE_1}}
3. User sees {{RESULT}}

### Acceptance Criteria
- [ ] Given {{CONTEXT}}, when {{ACTION}}, then {{RESULT}}
- [ ] {{CRITERION_2}}

### Edge Cases
- What if {{EDGE_CASE_1}}? → {{HANDLING}}
- What if {{EDGE_CASE_2}}? → {{HANDLING}}

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

**Inputs:** Feature specs, technical requirements
**Outputs:** Architecture docs, API specs, technical decision records

**Technical Decision Record Template:**
```
## TDR-{{NUMBER}}: {{DECISION_TITLE}}
**Date:** {{DATE}}
**Status:** Proposed / Accepted / Deprecated

### Context
{{WHY_THIS_DECISION_IS_NEEDED}}

### Options Considered
1. **{{OPTION_1}}** — {{PROS_CONS}}
2. **{{OPTION_2}}** — {{PROS_CONS}}

### Decision
We will use **{{CHOSEN_OPTION}}** because {{RATIONALE}}.

### Consequences
- Positive: {{BENEFIT}}
- Negative: {{TRADEOFF}}
- Neutral: {{OTHER_IMPACT}}
```

---

### 🎨 Team A: {{TEAM_A_NAME}}
**Focus:** {{TEAM_A_FOCUS}}

**Responsibilities:**
- {{RESPONSIBILITY_1}}
- {{RESPONSIBILITY_2}}
- {{RESPONSIBILITY_3}}

**Tech Stack / Tools:**
- {{TOOL_1}}
- {{TOOL_2}}

**Inputs:** {{WHAT_THEY_NEED}}
**Outputs:** {{WHAT_THEY_PRODUCE}}

---

### ⚙️ Team B: {{TEAM_B_NAME}}
**Focus:** {{TEAM_B_FOCUS}}

**Responsibilities:**
- {{RESPONSIBILITY_1}}
- {{RESPONSIBILITY_2}}
- {{RESPONSIBILITY_3}}

**Tech Stack / Tools:**
- {{TOOL_1}}
- {{TOOL_2}}

**Inputs:** {{WHAT_THEY_NEED}}
**Outputs:** {{WHAT_THEY_PRODUCE}}

---

### 🔌 Team C: {{TEAM_C_NAME}}
**Focus:** {{TEAM_C_FOCUS}}

**Responsibilities:**
- {{RESPONSIBILITY_1}}
- {{RESPONSIBILITY_2}}
- {{RESPONSIBILITY_3}}

**Tech Stack / Tools:**
- {{TOOL_1}}
- {{TOOL_2}}

**Inputs:** {{WHAT_THEY_NEED}}
**Outputs:** {{WHAT_THEY_PRODUCE}}

---

### ✅ QA Team
**Focus:** Testing, validation, quality assurance

**Responsibilities:**
- Verify features meet acceptance criteria
- Test edge cases and error handling
- Validate against non-functional requirements (performance, security)
- Document bugs with reproduction steps
- Sign off on completed work

**Inputs:** Acceptance criteria, completed features
**Outputs:** Test results, bug reports, quality sign-off

**Bug Report Template:**
```
## BUG-{{NUMBER}}: {{TITLE}}
**Severity:** Critical / High / Medium / Low
**Found In:** {{FEATURE_OR_COMPONENT}}
**Reporter:** {{TEAM}}

### Steps to Reproduce
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

### Expected Result
{{WHAT_SHOULD_HAPPEN}}

### Actual Result
{{WHAT_ACTUALLY_HAPPENS}}

### Evidence
{{SCREENSHOT_OR_LOG}}
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

### Objective
{{SINGLE_SENTENCE_CLEAR_GOAL}}

### Context
{{WHY_THIS_TASK_MATTERS}}

### Requirements
- [ ] {{SPECIFIC_REQUIREMENT_1}}
- [ ] {{SPECIFIC_REQUIREMENT_2}}

### Acceptance Criteria
- [ ] {{TESTABLE_CRITERION_1}}
- [ ] {{TESTABLE_CRITERION_2}}

### Inputs Available
- {{RESOURCE_1}}
- {{RESOURCE_2}}

### Expected Outputs
- {{DELIVERABLE_1}}
- {{DELIVERABLE_2}}

### Handoff To
- {{NEXT_TEAM_OR_PERSON}}
```

---

### Status Report Format
Teams report progress using this structure:

```markdown
## Status: {{TASK_ID}}
**Team:** {{TEAM_NAME}}
**Status:** Not Started / In Progress / Blocked / Complete
**Progress:** {{PERCENTAGE}}%
**Updated:** {{TIMESTAMP}}

### Completed
- {{WHAT_IS_DONE}}

### In Progress
- {{WHAT_IS_BEING_WORKED_ON}}

### Blockers
- **Blocker:** {{DESCRIPTION}}
- **Impact:** {{WHAT_IT_PREVENTS}}
- **Needed From:** {{WHO_CAN_RESOLVE}}

### Next Steps
- {{IMMEDIATE_NEXT_ACTION}}
```

---

### Escalation Protocol

| Condition | Action | Escalate To | Response Time |
|-----------|--------|-------------|---------------|
| Blocked > 10 min | Report blocker | Chief of Staff | Immediate |
| Scope unclear | Ask for clarification | Product Manager | 1 hour |
| Technical decision needed | Document options | Technical Architect | 2 hours |
| Requires CEO approval | Gate review request | CEO | 4 hours |
| Critical bug in production | Stop and alert | CEO + All Teams | Immediate |

---

## Phase Structure Template

### Phase 0: Setup & Foundation
**Duration:** {{DAYS}}
**Goal:** Environment ready, team aligned, dependencies resolved

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| P0-001 | {{SETUP_TASK_1}} | {{TEAM}} | P0 | None |
| P0-002 | {{SETUP_TASK_2}} | {{TEAM}} | P0 | None |

**Exit Criteria:**
- [ ] {{WHAT_MUST_BE_TRUE_TO_PROCEED}}
- [ ] CEO approval to begin Phase 1

---

### Phase 1: {{PHASE_1_NAME}}
**Duration:** {{DAYS}}
**Goal:** {{PHASE_1_GOAL}}

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| P1-001 | {{TASK}} | {{TEAM}} | P0 | {{DEPS}} |
| P1-002 | {{TASK}} | {{TEAM}} | P1 | {{DEPS}} |

**Exit Criteria:**
- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] QA sign-off
- [ ] CEO approval to proceed

---

### Phase 2: {{PHASE_2_NAME}}
**Duration:** {{DAYS}}
**Goal:** {{PHASE_2_GOAL}}

**Tasks:**
| ID | Task | Team | Priority | Dependencies |
|----|------|------|----------|--------------|
| P2-001 | {{TASK}} | {{TEAM}} | P0 | {{DEPS}} |

**Exit Criteria:**
- [ ] {{CRITERION}}
- [ ] QA sign-off
- [ ] CEO approval

---

## Dependency Graph Template

```
{{TASK_A}} (No dependencies)
   │
   ├──► {{TASK_B}} (Depends on A)
   │       │
   │       └──► {{TASK_D}} (Depends on B)
   │
   └──► {{TASK_C}} (Depends on A)
           │
           └──► {{TASK_E}} (Depends on C and D)
                   │
                   └──► {{FINAL_TASK}}
```

**Critical Path:** A → B → D → E → Final
**Parallel Work:** C can run alongside B

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

### Rule 7: Time-Box Research
If investigating something, set a time limit. Report findings at the limit, even if incomplete.

---

## Approval Gates

**CEO Review Required Before:**
- [ ] Phase transitions
- [ ] Production deployments
- [ ] External service integrations going live
- [ ] User-facing changes
- [ ] Scope changes > 20%
- [ ] Budget decisions

**Gate Review Format:**
```markdown
## Gate Review: Phase {{N}} → Phase {{N+1}}
**Date:** {{DATE}}
**Presented By:** Chief of Staff

### Phase {{N}} Summary
- **Goal:** {{WHAT_WE_SET_OUT_TO_DO}}
- **Result:** {{WHAT_WE_ACHIEVED}}
- **Variance:** {{ANY_DIFFERENCES}}

### Deliverables Completed
- [x] {{DELIVERABLE_1}}
- [x] {{DELIVERABLE_2}}

### Quality Validation
- [x] QA sign-off received
- [x] All acceptance criteria met
- [x] No critical bugs open

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

## Project File Structure

```
{{PROJECT_FOLDER}}/
├── DELEGATION.md              # This file (customized)
├── ROADMAP.md                 # Project timeline and milestones
├── docs/
│   ├── ARCHITECTURE.md        # System design
│   ├── API_CONTRACTS.md       # API specifications
│   ├── DECISIONS.md           # Technical decision records
│   └── GLOSSARY.md            # Project terminology
├── teams/
│   ├── CHIEF_OF_STAFF.md      # Orchestrator status & tasks
│   ├── PRODUCT_MANAGER.md     # Feature specs
│   ├── TECHNICAL_ARCHITECT.md # Technical docs
│   ├── {{TEAM_A}}.md          # Team A tasks
│   ├── {{TEAM_B}}.md          # Team B tasks
│   ├── {{TEAM_C}}.md          # Team C tasks
│   └── QA_TEAM.md             # Testing tasks
├── specs/
│   ├── {{FEATURE_1}}.md       # Feature spec
│   ├── {{FEATURE_2}}.md       # Feature spec
│   └── ...
├── status/
│   ├── PHASE_0_COMPLETE.md    # Phase completion records
│   ├── PHASE_1_COMPLETE.md
│   └── ...
└── src/                       # Actual project code/assets
    └── {{PROJECT_FILES}}
```

---

## Common Team Configurations

### Software Development Project
| Team | Focus |
|------|-------|
| Chief of Staff | Orchestration |
| Product Manager | Features & UX |
| Technical Architect | System Design |
| Frontend Team | UI/UX Implementation |
| Backend Team | API & Business Logic |
| Database Team | Data Layer |
| DevOps Team | Infrastructure |
| QA Team | Testing |

### Content/Marketing Project
| Team | Focus |
|------|-------|
| Chief of Staff | Orchestration |
| Strategy Lead | Goals & Audience |
| Content Team | Writing & Creation |
| Design Team | Visual Assets |
| Distribution Team | Publishing & Promotion |
| Analytics Team | Measurement |
| QA Team | Review & Approval |

### Operations/Process Project
| Team | Focus |
|------|-------|
| Chief of Staff | Orchestration |
| Process Analyst | Current State & Gaps |
| Solution Designer | New Process Design |
| Implementation Team | Rollout |
| Training Team | Documentation & Training |
| QA Team | Validation |

### Research Project
| Team | Focus |
|------|-------|
| Chief of Staff | Orchestration |
| Research Lead | Questions & Methodology |
| Data Collection Team | Gathering Information |
| Analysis Team | Processing & Insights |
| Synthesis Team | Conclusions & Recommendations |
| QA Team | Fact-Checking |

---

## Quick Start Checklist

### Before Kickoff
- [ ] Copy this framework to project folder
- [ ] Replace all {{PLACEHOLDERS}}
- [ ] Remove unused teams
- [ ] Define Phase 0 tasks
- [ ] Identify critical path

### Phase 0 (Every Project)
- [ ] Create team files
- [ ] Document initial requirements
- [ ] Set up project infrastructure
- [ ] Verify all team inputs available
- [ ] CEO kickoff approval

### During Execution
- [ ] Daily status updates from Chief of Staff
- [ ] Blockers escalated within 10 minutes
- [ ] Gate reviews at phase transitions
- [ ] Decisions documented as they happen

### Project Close
- [ ] All acceptance criteria verified
- [ ] Documentation complete
- [ ] Lessons learned captured
- [ ] Final CEO sign-off

---

## Principles

> **"Every team owns their domain. Every handoff is clean. Every output is tested."**

1. **Clarity over speed** — Take time to understand before building
2. **Small batches** — Deliver incrementally, get feedback early
3. **Single responsibility** — One team, one focus, one task at a time
4. **Explicit over implicit** — Write it down, don't assume
5. **Escalate early** — A 10-minute blocker becomes a 10-hour blocker if hidden

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | {{DATE}} | Initial framework |

---

*Framework created for enterprise-level project delegation with AI agent teams.*
