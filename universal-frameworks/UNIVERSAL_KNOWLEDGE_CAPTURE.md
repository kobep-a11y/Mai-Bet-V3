# Universal Knowledge Capture Framework
### Build Institutional Memory, Prevent Knowledge Loss

---

## How to Use This Framework

1. **Capture continuously** — Don't wait for "later"
2. **Use templates** for consistent formatting
3. **Review regularly** — Keep knowledge current
4. **Make discoverable** — Knowledge unused is knowledge lost

---

## Knowledge Categories

| Category | What | When to Capture |
|----------|------|-----------------|
| **TIL (Today I Learned)** | New discoveries | Immediately |
| **Gotchas** | Traps and pitfalls | When you hit them |
| **Runbooks** | How-to procedures | After doing twice |
| **Decisions** | Why we chose X | When deciding |
| **Onboarding** | What newbies need | Continuously |
| **FAQ** | Repeated questions | After third time asked |
| **Post-mortems** | What went wrong | After incidents |

---

# {{PROJECT_NAME}} — Knowledge Base

## Quick Links
- [TIL Log](#til-log)
- [Gotchas](#gotchas)
- [Runbooks](#runbooks)
- [FAQ](#faq)
- [Tribal Knowledge](#tribal-knowledge)

---

## TIL Log

### Template
```markdown
### {{DATE}} — {{TOPIC}}
**Context:** {{WHY_I_WAS_LOOKING}}
**Discovery:** {{WHAT_I_LEARNED}}
**Useful for:** {{FUTURE_SCENARIOS}}
**Source:** {{HOW_I_FOUND_OUT}}
```

### Recent TILs

#### {{DATE}} — {{TOPIC}}
**Context:** {{WHAT_YOU_WERE_DOING}}
**Discovery:** {{THE_INSIGHT}}
**Useful for:** {{WHEN_THIS_HELPS}}
**Source:** {{DOCUMENTATION_COWORKER_EXPERIMENT}}

---

## Gotchas

### Template
```markdown
### ⚠️ {{GOTCHA_NAME}}
**Area:** {{COMPONENT_FEATURE_AREA}}
**What happens:** {{THE_TRAP}}
**Why it happens:** {{ROOT_CAUSE}}
**How to avoid:** {{PREVENTION}}
**If you hit it:** {{RECOVERY_STEPS}}
**Discovered:** {{DATE}} by {{WHO}}
```

### Known Gotchas

#### ⚠️ {{GOTCHA_NAME}}
**Area:** {{AREA}}
**What happens:**
{{DESCRIPTION_OF_THE_PROBLEM}}

**Why it happens:**
{{EXPLANATION}}

**How to avoid:**
```{{LANGUAGE}}
// Do this
{{CORRECT_CODE}}

// Not this
{{INCORRECT_CODE}}
```

**If you hit it:**
1. {{STEP_1}}
2. {{STEP_2}}

**Discovered:** {{DATE}} by {{WHO}}

---

## Runbooks

### Template
```markdown
### {{RUNBOOK_NAME}}
**Purpose:** {{WHAT_THIS_ACCOMPLISHES}}
**When to use:** {{TRIGGER_CONDITIONS}}
**Time required:** {{ESTIMATE}}
**Prerequisites:** {{WHAT_YOU_NEED_FIRST}}

#### Steps
1. {{STEP_1}}
   ```bash
   {{COMMAND_IF_APPLICABLE}}
   ```
   Expected: {{EXPECTED_OUTCOME}}

2. {{STEP_2}}
   ...

#### Verification
- [ ] {{HOW_TO_VERIFY_SUCCESS}}

#### Troubleshooting
- If {{PROBLEM}}, then {{SOLUTION}}

#### Rollback
{{HOW_TO_UNDO_IF_NEEDED}}

**Last updated:** {{DATE}}
**Author:** {{WHO}}
```

### Runbook Index

| Name | Purpose | Last Verified |
|------|---------|---------------|
| [{{RUNBOOK_1}}](#{{link}}) | {{PURPOSE}} | {{DATE}} |
| [{{RUNBOOK_2}}](#{{link}}) | {{PURPOSE}} | {{DATE}} |

---

## FAQ

### Template
```markdown
### Q: {{QUESTION}}
**Asked by:** {{WHO_OR_HOW_OFTEN}}
**Category:** {{CATEGORY}}

**A:** {{ANSWER}}

**More info:** {{LINK_OR_REFERENCE}}
```

### Frequently Asked Questions

#### Development

**Q: How do I set up the local environment?**
See [Development Setup Runbook](#development-setup)

**Q: {{QUESTION}}**
{{ANSWER}}

#### Operations

**Q: {{QUESTION}}**
{{ANSWER}}

#### Architecture

**Q: Why did we choose {{TECHNOLOGY}}?**
See [ADR-{{NUMBER}}](#adr-link)

---

## Tribal Knowledge

### What Is Tribal Knowledge?
Information that exists only in people's heads, not written down.

### Extraction Template
```markdown
### {{TOPIC}}
**Held by:** {{WHO_KNOWS_THIS}}
**Criticality:** High / Medium / Low
**Risk if lost:** {{WHAT_BREAKS}}

**The Knowledge:**
{{DOCUMENT_THE_INFORMATION}}

**How to verify:**
{{HOW_TO_CONFIRM_ACCURACY}}

**Extracted:** {{DATE}}
**Verified by:** {{SUBJECT_EXPERT}}
```

### Tribal Knowledge Inventory

| Knowledge | Holder(s) | Criticality | Documented? |
|-----------|-----------|-------------|-------------|
| {{TOPIC}} | {{WHO}} | High/Med/Low | Yes/No/Partial |
| How to deploy to prod | DevOps team | High | No |
| Why auth uses X pattern | {{PERSON}} | Medium | Partial |

### At-Risk Knowledge
Knowledge held by only one person:

| Knowledge | Single Holder | Action |
|-----------|---------------|--------|
| {{TOPIC}} | {{PERSON}} | Schedule documentation |

---

## Onboarding Guide

### First Day Essentials
- [ ] {{ESSENTIAL_1}}
- [ ] {{ESSENTIAL_2}}
- [ ] {{ESSENTIAL_3}}

### First Week Goals
- [ ] {{GOAL_1}}
- [ ] {{GOAL_2}}

### Key Concepts to Understand
1. **{{CONCEPT_1}}:** {{EXPLANATION}}
2. **{{CONCEPT_2}}:** {{EXPLANATION}}

### Common Newbie Mistakes
| Mistake | Why It Happens | What to Do Instead |
|---------|----------------|-------------------|
| {{MISTAKE}} | {{REASON}} | {{CORRECT_APPROACH}} |

### Who to Ask About What
| Topic | Go-To Person | Backup |
|-------|--------------|--------|
| {{TOPIC}} | {{PERSON}} | {{BACKUP}} |

---

## Knowledge Capture Triggers

Capture knowledge when:

- [ ] You spend >30 min figuring something out
- [ ] You explain the same thing 3+ times
- [ ] You hit an undocumented gotcha
- [ ] You make a non-obvious decision
- [ ] Someone asks "how does X work?"
- [ ] You debug something tricky
- [ ] You onboard a new team member
- [ ] An incident occurs
- [ ] You learn something from a vendor/library

---

## Knowledge Maintenance

### Review Schedule
| Type | Review Frequency | Responsibility |
|------|------------------|----------------|
| Runbooks | Quarterly | {{TEAM}} |
| Gotchas | When hit | Anyone |
| FAQ | Monthly | {{PERSON}} |
| Onboarding | Each new hire | New hire + buddy |

### Staleness Check
```markdown
### Knowledge Item: {{NAME}}
**Last verified:** {{DATE}}
**Still accurate?** Yes / No / Partial

**Updates needed:**
- {{UPDATE_1}}
- {{UPDATE_2}}

**Verified by:** {{WHO}}
**Date:** {{DATE}}
```

---

## Knowledge Discoverability

### Search Tips
- Use consistent tags: `#deployment`, `#authentication`, `#database`
- Cross-reference related documents
- Maintain index pages

### When You Can't Find Something
1. Search the knowledge base
2. Search Slack/chat history
3. Check git commit messages
4. Ask in #{{HELP_CHANNEL}}
5. **Document what you learn**

---

## Post-Incident Learning

### Template
```markdown
## Incident: {{INCIDENT_NAME}}
**Date:** {{DATE}}
**Severity:** {{SEVERITY}}
**Duration:** {{DURATION}}

### What Happened
{{TIMELINE_OF_EVENTS}}

### Root Cause
{{ACTUAL_CAUSE}}

### What We Learned
1. {{LESSON_1}}
2. {{LESSON_2}}

### Action Items
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| {{ACTION}} | {{WHO}} | {{DATE}} | {{STATUS}} |

### Changes to Knowledge Base
- Added gotcha: {{LINK}}
- Updated runbook: {{LINK}}
- New FAQ entry: {{LINK}}
```

---

## Contribution Guidelines

### Good Knowledge Entries
- ✅ Specific and actionable
- ✅ Include context (when/why)
- ✅ Provide examples
- ✅ Link to related items
- ✅ Have a clear title

### Bad Knowledge Entries
- ❌ Too vague to be useful
- ❌ Already documented elsewhere
- ❌ Outdated without notice
- ❌ Missing context
- ❌ Impossible to find

---

## Metrics

### Knowledge Health
| Metric | Target | Current |
|--------|--------|---------|
| Runbooks with recent verification | 100% | {{%}} |
| Single-holder tribal knowledge | 0 | {{N}} |
| Time to onboard (days) | {{TARGET}} | {{ACTUAL}} |
| Gotchas documented | All known | {{%}} |

---

*"The best time to document was when you learned it. The second best time is now."*
