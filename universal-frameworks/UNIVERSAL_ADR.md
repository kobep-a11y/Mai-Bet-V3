# Universal Architecture Decision Record (ADR) Framework
### Document Why, Not Just What

---

## How to Use This Framework

1. **Create an ADR** when making significant technical decisions
2. **Number sequentially** — ADR-001, ADR-002, etc.
3. **Never delete** — Mark as superseded instead
4. **Review periodically** — Decisions may need revisiting

---

## When to Write an ADR

Write an ADR when:
- Choosing between multiple valid approaches
- Making a decision that's hard to reverse
- Adopting new technology/framework/library
- Changing architectural patterns
- Defining coding standards
- Making performance/scalability tradeoffs

---

# ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | {{TITLE}} | {{STATUS}} | {{DATE}} |
| ADR-002 | {{TITLE}} | {{STATUS}} | {{DATE}} |

---

# ADR Template

## ADR-{{NUMBER}}: {{TITLE}}

### Metadata
| Attribute | Value |
|-----------|-------|
| **Status** | Proposed / Accepted / Deprecated / Superseded |
| **Date** | {{YYYY-MM-DD}} |
| **Decision Makers** | {{NAMES}} |
| **Consulted** | {{STAKEHOLDERS}} |
| **Informed** | {{WHO_NEEDS_TO_KNOW}} |
| **Supersedes** | {{ADR_NUMBER_OR_NONE}} |
| **Superseded By** | {{ADR_NUMBER_OR_NONE}} |

---

### Context

**What is the issue we're facing?**

{{DESCRIBE_THE_PROBLEM_OR_SITUATION}}

**Why is this decision needed now?**

{{EXPLAIN_THE_TRIGGER_FOR_THIS_DECISION}}

**What constraints or requirements must we consider?**

- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}
- {{REQUIREMENT_1}}

**Relevant background information:**

{{TECHNICAL_CONTEXT_BUSINESS_CONTEXT_HISTORY}}

---

### Decision Drivers

What factors are most important in this decision?

| Priority | Driver | Weight |
|----------|--------|--------|
| 1 | {{DRIVER_1}} (e.g., Performance) | High |
| 2 | {{DRIVER_2}} (e.g., Developer Experience) | High |
| 3 | {{DRIVER_3}} (e.g., Cost) | Medium |
| 4 | {{DRIVER_4}} (e.g., Time to Market) | Medium |
| 5 | {{DRIVER_5}} (e.g., Familiarity) | Low |

---

### Options Considered

#### Option 1: {{OPTION_NAME}}

**Description:**
{{WHAT_IS_THIS_OPTION}}

**Pros:**
- ✅ {{PRO_1}}
- ✅ {{PRO_2}}

**Cons:**
- ❌ {{CON_1}}
- ❌ {{CON_2}}

**Effort:** Low / Medium / High
**Risk:** Low / Medium / High

---

#### Option 2: {{OPTION_NAME}}

**Description:**
{{WHAT_IS_THIS_OPTION}}

**Pros:**
- ✅ {{PRO_1}}
- ✅ {{PRO_2}}

**Cons:**
- ❌ {{CON_1}}
- ❌ {{CON_2}}

**Effort:** Low / Medium / High
**Risk:** Low / Medium / High

---

#### Option 3: {{OPTION_NAME}}

**Description:**
{{WHAT_IS_THIS_OPTION}}

**Pros:**
- ✅ {{PRO_1}}
- ✅ {{PRO_2}}

**Cons:**
- ❌ {{CON_1}}
- ❌ {{CON_2}}

**Effort:** Low / Medium / High
**Risk:** Low / Medium / High

---

### Options Comparison Matrix

| Criterion | Weight | Option 1 | Option 2 | Option 3 |
|-----------|--------|----------|----------|----------|
| {{CRITERION_1}} | High | 🟢 | 🟡 | 🔴 |
| {{CRITERION_2}} | High | 🟡 | 🟢 | 🟡 |
| {{CRITERION_3}} | Medium | 🔴 | 🟡 | 🟢 |
| {{CRITERION_4}} | Low | 🟢 | 🟢 | 🟡 |
| **Overall** | — | {{SCORE}} | {{SCORE}} | {{SCORE}} |

🟢 = Strong fit | 🟡 = Acceptable | 🔴 = Poor fit

---

### Decision

**We will use: {{CHOSEN_OPTION}}**

**Rationale:**

{{EXPLAIN_WHY_THIS_OPTION_WAS_CHOSEN}}

**Key factors in this decision:**

1. {{FACTOR_1}}
2. {{FACTOR_2}}
3. {{FACTOR_3}}

**Why not the alternatives?**

- {{REJECTED_OPTION_1}}: {{WHY_NOT}}
- {{REJECTED_OPTION_2}}: {{WHY_NOT}}

---

### Consequences

#### Positive
- ✅ {{BENEFIT_1}}
- ✅ {{BENEFIT_2}}
- ✅ {{BENEFIT_3}}

#### Negative
- ❌ {{TRADEOFF_1}}
- ❌ {{TRADEOFF_2}}

#### Neutral
- ➖ {{NEUTRAL_IMPACT}}

#### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| {{RISK_1}} | Low/Med/High | Low/Med/High | {{MITIGATION}} |
| {{RISK_2}} | Low/Med/High | Low/Med/High | {{MITIGATION}} |

---

### Implementation

**Action items:**

| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
| {{TASK_1}} | {{WHO}} | {{DATE}} | Pending |
| {{TASK_2}} | {{WHO}} | {{DATE}} | Pending |

**Technical approach:**

{{BRIEF_DESCRIPTION_OF_HOW_TO_IMPLEMENT}}

**Migration path (if applicable):**

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

---

### Validation

**How will we know this decision was correct?**

- [ ] {{SUCCESS_METRIC_1}}
- [ ] {{SUCCESS_METRIC_2}}

**Review date:** {{DATE_TO_REVISIT}}

**Signals to reconsider:**

- If {{CONDITION}}, we should revisit this decision
- If {{METRIC}} exceeds {{THRESHOLD}}, reconsider

---

### Related Decisions

| ADR | Relationship |
|-----|--------------|
| ADR-{{N}} | {{DEPENDS_ON / ENABLES / CONFLICTS_WITH}} |

---

### References

- {{LINK_TO_DOCS}}
- {{LINK_TO_RESEARCH}}
- {{LINK_TO_DISCUSSION}}

---

### Discussion Log

| Date | Participant | Comment |
|------|-------------|---------|
| {{DATE}} | {{WHO}} | {{COMMENT}} |

---

## ADR Lifecycle

```
Proposed → Accepted → [Active]
                         ↓
                    Deprecated → Superseded by ADR-XXX
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Decision made, being implemented |
| **Deprecated** | No longer applies, but not replaced |
| **Superseded** | Replaced by newer ADR |

---

## Quick ADR Template

For smaller decisions:

```markdown
# ADR-{{N}}: {{TITLE}}
**Status:** {{STATUS}} | **Date:** {{DATE}}

## Context
{{WHY_DECISION_NEEDED}}

## Decision
We will {{DECISION}}.

## Consequences
- {{CONSEQUENCE_1}}
- {{CONSEQUENCE_2}}
```

---

## Common ADR Categories

### Technology Selection
- Framework choice
- Database selection
- Cloud provider
- Language/runtime

### Architecture Patterns
- Monolith vs microservices
- Event-driven vs request-response
- Sync vs async communication

### Development Practices
- Testing strategy
- Deployment approach
- Code organization
- API versioning

### Integration Decisions
- Third-party service selection
- API design approach
- Data format standards

---

*"The purpose of an ADR is not to justify a decision, but to ensure the next person understands it."*
