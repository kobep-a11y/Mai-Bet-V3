# Universal Context Handoff Framework
### Preserve Continuity Across Sessions, Agents & Team Members

---

## How to Use This Framework

1. **Update at session end** — Capture state before closing
2. **Update at handoff** — When passing work to another person/agent
3. **Update at blockers** — When stopping due to impediment
4. **Review at session start** — Orient yourself before diving in

---

# {{PROJECT_NAME}} — Context Handoff

## Session Metadata

**Last Updated:** {{TIMESTAMP}}
**Updated By:** {{PERSON_OR_AGENT}}
**Session Duration:** {{TIME_SPENT}}
**Next Expected Session:** {{DATE_TIME}}

---

## Current State Snapshot

### Overall Status
```
Progress: [████████░░░░░░░░░░░░] 40%
Phase: {{CURRENT_PHASE}}
Health: 🟢 On Track / 🟡 At Risk / 🔴 Blocked
```

### What's Working
- {{FUNCTIONING_COMPONENT_1}}
- {{FUNCTIONING_COMPONENT_2}}

### What's Broken/Incomplete
- {{BROKEN_THING_1}} — {{BRIEF_DESCRIPTION}}
- {{INCOMPLETE_THING_1}} — {{WHAT_REMAINS}}

### What Changed This Session
- {{CHANGE_1}}
- {{CHANGE_2}}
- {{CHANGE_3}}

---

## Active Work Context

### Current Task
**Task ID:** {{TASK_ID}}
**Description:** {{WHAT_YOU_WERE_DOING}}
**Status:** Not Started / In Progress / Blocked / Ready for Review

### Files Currently Being Modified
| File | Status | Notes |
|------|--------|-------|
| {{FILE_PATH_1}} | Modified | {{WHAT_CHANGED}} |
| {{FILE_PATH_2}} | Created | {{PURPOSE}} |
| {{FILE_PATH_3}} | Investigating | {{WHY}} |

### Uncommitted Changes
```
{{GIT_STATUS_OUTPUT_OR_DESCRIPTION}}
```

### Terminal/Environment State
- Working directory: {{PATH}}
- Active processes: {{RUNNING_SERVICES}}
- Environment variables set: {{RELEVANT_ENV_VARS}}

---

## Mental Model

### Current Understanding of the Problem
{{DESCRIBE_YOUR_MENTAL_MODEL_OF_THE_SYSTEM_OR_PROBLEM}}

### Key Insight Discovered This Session
> {{IMPORTANT_REALIZATION_THAT_SHOULDNT_BE_LOST}}

### Assumptions Being Made
- {{ASSUMPTION_1}} — {{WHY_ASSUMING_THIS}}
- {{ASSUMPTION_2}} — {{NEEDS_VERIFICATION_Y_N}}

### System Diagram (If Helpful)
```
{{ASCII_DIAGRAM_OF_RELEVANT_ARCHITECTURE}}
```

---

## Debugging Context (If Applicable)

### Symptom Being Investigated
{{DESCRIBE_THE_BUG_OR_ISSUE}}

### Hypotheses
| # | Hypothesis | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {{HYPOTHESIS_1}} | Tested/Disproven | {{RESULT}} |
| 2 | {{HYPOTHESIS_2}} | Testing | {{CURRENT_FINDINGS}} |
| 3 | {{HYPOTHESIS_3}} | Untested | — |

### Things Already Tried
- [ ] {{ATTEMPTED_FIX_1}} — Result: {{OUTCOME}}
- [ ] {{ATTEMPTED_FIX_2}} — Result: {{OUTCOME}}

### Things Ruled Out
- {{RULED_OUT_1}} — Because: {{EVIDENCE}}

---

## Known Gotchas & Landmines

### Discovered This Session
- ⚠️ {{GOTCHA_1}} — {{HOW_TO_AVOID}}
- ⚠️ {{GOTCHA_2}} — {{WORKAROUND}}

### Carried Forward from Previous Sessions
- ⚠️ {{EXISTING_GOTCHA}} — Still relevant

---

## Open Questions

### Needs Research
- [ ] {{QUESTION_1}} — Priority: High/Medium/Low
- [ ] {{QUESTION_2}} — Blocked by: {{DEPENDENCY}}

### Needs Clarification from Stakeholder
- [ ] {{QUESTION_FOR_CEO_OR_PM}}
- [ ] {{AMBIGUOUS_REQUIREMENT}}

### Needs Testing/Verification
- [ ] {{THEORY_TO_VERIFY}}

---

## Immediate Next Actions

### If Resuming This Work
1. {{FIRST_THING_TO_DO}}
2. {{SECOND_THING_TO_DO}}
3. {{THIRD_THING_TO_DO}}

### Before Doing Anything Else
- [ ] {{CRITICAL_PREREQ}} — Don't skip this!

### Commands to Run
```bash
# To restore context:
{{COMMAND_1}}

# To verify state:
{{COMMAND_2}}

# To continue work:
{{COMMAND_3}}
```

---

## Dependencies & Blockers

### Waiting On
| Item | Owner | Expected | Impact if Delayed |
|------|-------|----------|-------------------|
| {{DEPENDENCY_1}} | {{WHO}} | {{WHEN}} | {{IMPACT}} |

### Blocking Others
| Item | Who's Blocked | Mitigation |
|------|---------------|------------|
| {{MY_DELIVERABLE}} | {{TEAM}} | {{INTERIM_SOLUTION}} |

---

## Resources & References

### Documentation Consulted
- {{DOC_LINK_1}} — {{RELEVANCE}}
- {{DOC_LINK_2}} — {{RELEVANCE}}

### Relevant Code Locations
- `{{PATH_1}}` — {{WHAT_IT_DOES}}
- `{{PATH_2}}` — {{WHY_IT_MATTERS}}

### External Resources
- {{URL_1}} — {{DESCRIPTION}}

---

## Communication Log

### Decisions Made This Session
| Decision | Rationale | Made By |
|----------|-----------|---------|
| {{DECISION_1}} | {{WHY}} | {{WHO}} |

### Questions Asked & Answers Received
- Q: {{QUESTION}}
  A: {{ANSWER}} (from {{WHO}})

### Commitments Made
- Promised {{DELIVERABLE}} to {{PERSON}} by {{DATE}}

---

## Session Notes

### Raw Notes/Thoughts
```
{{UNSTRUCTURED_NOTES_FROM_SESSION}}
```

### Things to Remember
- {{IMPORTANT_DETAIL_1}}
- {{IMPORTANT_DETAIL_2}}

---

## Handoff Checklist

Before handing off, verify:

- [ ] All file changes described above
- [ ] Current task status accurately reflects reality
- [ ] Blockers documented with enough detail to action
- [ ] Next steps are clear and actionable
- [ ] No uncommitted work that could be lost
- [ ] Environment state documented if non-standard
- [ ] Gotchas section updated with new discoveries

---

## Quick Resume Template

Copy this for rapid handoffs:

```markdown
## Quick Context — {{PROJECT}} — {{DATE}}

**Currently:** {{ONE_SENTENCE_STATE}}
**Blocked by:** {{BLOCKER_OR_NONE}}
**Next action:** {{IMMEDIATE_NEXT_STEP}}

**Don't forget:**
- {{CRITICAL_REMINDER}}

**Files touched:**
- {{FILE_1}}
- {{FILE_2}}
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{DATE}} | {{AUTHOR}} | Initial handoff |

---

*Context is expensive to rebuild. Invest 5 minutes saving it, save 30 minutes recovering it.*
