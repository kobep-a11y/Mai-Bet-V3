# Universal Debug Framework
### Systematic Troubleshooting Without Flailing

---

## How to Use This Framework

1. **Stop and document** before trying random fixes
2. **Follow the phases** in order — resist urge to jump ahead
3. **Log everything** — future you will thank present you
4. **Time-box** each investigation phase

---

# {{PROJECT_NAME}} — Debug Session

## Issue Metadata

**Issue ID:** {{BUG_ID_OR_TICKET}}
**Reported By:** {{WHO}}
**Reported Date:** {{DATE}}
**Severity:** Critical / High / Medium / Low
**Status:** Investigating / Root Cause Found / Fix In Progress / Resolved

---

## Phase 1: Symptom Documentation

### What's Happening?
{{DESCRIBE_THE_OBSERVABLE_BEHAVIOR}}

### What Should Happen?
{{DESCRIBE_THE_EXPECTED_BEHAVIOR}}

### Error Messages (Exact Text)
```
{{PASTE_EXACT_ERROR_MESSAGE}}
```

### Visual Evidence
- Screenshot: {{LINK_OR_PATH}}
- Screen recording: {{LINK_OR_PATH}}

### User Impact
- Who is affected: {{USER_SEGMENT}}
- Frequency: Always / Intermittent / Rare
- Workaround available: Yes / No — {{WORKAROUND_IF_YES}}

---

## Phase 2: Reproduction

### Environment Details
| Attribute | Value |
|-----------|-------|
| OS | {{OS_VERSION}} |
| Browser/Runtime | {{VERSION}} |
| App Version | {{VERSION}} |
| Environment | Local / Staging / Production |
| User Role/Permissions | {{ROLE}} |
| Feature Flags | {{RELEVANT_FLAGS}} |

### Reproduction Steps
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. **Observe:** {{WHAT_HAPPENS}}

### Reproduction Rate
- [ ] 100% reproducible
- [ ] Intermittent (~{{PERCENTAGE}}%)
- [ ] Unable to reproduce yet

### Minimal Reproduction Case
```
{{SMALLEST_CODE_OR_STEPS_THAT_TRIGGERS_BUG}}
```

### Works In / Fails In
| Environment | Works? | Notes |
|-------------|--------|-------|
| {{ENV_1}} | ✅ / ❌ | {{NOTES}} |
| {{ENV_2}} | ✅ / ❌ | {{NOTES}} |

---

## Phase 3: Information Gathering

### Relevant Logs
```
{{PASTE_RELEVANT_LOG_LINES}}
```

### Stack Trace
```
{{PASTE_STACK_TRACE}}
```

### Network Activity
| Request | Status | Notes |
|---------|--------|-------|
| {{ENDPOINT_1}} | {{STATUS}} | {{OBSERVATION}} |

### Database State
```sql
-- Query run:
{{QUERY}}

-- Result:
{{RESULT_OR_OBSERVATION}}
```

### Configuration Values
| Config | Value | Expected |
|--------|-------|----------|
| {{CONFIG_1}} | {{VALUE}} | {{EXPECTED}} |

### Recent Changes
- {{RECENT_DEPLOY_OR_CHANGE_1}}
- {{RECENT_DEPLOY_OR_CHANGE_2}}

**Last known working:** {{DATE_OR_VERSION}}

---

## Phase 4: Hypothesis Formation

### Hypothesis Log

| # | Hypothesis | Likelihood | Test Method | Result |
|---|-----------|------------|-------------|--------|
| 1 | {{HYPOTHESIS}} | High/Med/Low | {{HOW_TO_TEST}} | {{RESULT}} |
| 2 | {{HYPOTHESIS}} | High/Med/Low | {{HOW_TO_TEST}} | Pending |
| 3 | {{HYPOTHESIS}} | High/Med/Low | {{HOW_TO_TEST}} | Pending |

### Current Leading Hypothesis
> {{MOST_LIKELY_CAUSE_BASED_ON_EVIDENCE}}

### Evidence Supporting
- {{EVIDENCE_1}}
- {{EVIDENCE_2}}

### Evidence Against
- {{CONTRADICTING_EVIDENCE}}

---

## Phase 5: Isolation & Binary Search

### Isolation Strategy
Use binary search to narrow down the problem space.

#### Code Isolation
```
[Working Commit] ◄─────────────────────► [Broken Commit]
                        │
                   [Test Here]
```

**Bisect Results:**
| Commit | Works? | Notes |
|--------|--------|-------|
| {{COMMIT_1}} | ✅ | {{NOTES}} |
| {{COMMIT_2}} | ❌ | {{NOTES}} |
| **First Bad:** | {{COMMIT}} | {{WHAT_CHANGED}} |

#### Component Isolation
```
[ ] Disable Component A → Still broken? Y/N
[ ] Disable Component B → Still broken? Y/N
[ ] Disable Component C → Still broken? Y/N
```

**Isolated To:** {{COMPONENT_OR_AREA}}

#### Data Isolation
- [ ] Issue occurs with fresh data? Y/N
- [ ] Issue occurs with specific record? {{RECORD_ID}}
- [ ] Issue occurs with specific user? {{USER_ID}}

---

## Phase 6: Root Cause Analysis

### The Five Whys

1. **Why** did {{SYMPTOM}} happen?
   → Because {{IMMEDIATE_CAUSE}}

2. **Why** did {{IMMEDIATE_CAUSE}} happen?
   → Because {{DEEPER_CAUSE}}

3. **Why** did {{DEEPER_CAUSE}} happen?
   → Because {{EVEN_DEEPER}}

4. **Why** did {{EVEN_DEEPER}} happen?
   → Because {{SYSTEMIC_CAUSE}}

5. **Why** did {{SYSTEMIC_CAUSE}} happen?
   → Because {{ROOT_CAUSE}}

### Root Cause Statement
> {{CLEAR_STATEMENT_OF_ROOT_CAUSE}}

### Contributing Factors
- {{FACTOR_1}}
- {{FACTOR_2}}

### Category
- [ ] Code defect
- [ ] Configuration error
- [ ] Data corruption
- [ ] Infrastructure issue
- [ ] Third-party dependency
- [ ] Race condition
- [ ] Resource exhaustion
- [ ] User error (needs UX fix)

---

## Phase 7: Fix Implementation

### Proposed Fix
{{DESCRIBE_THE_FIX}}

### Fix Location
- File: `{{FILE_PATH}}`
- Function/Method: `{{FUNCTION_NAME}}`
- Line(s): {{LINE_NUMBERS}}

### Code Change
```{{LANGUAGE}}
// Before:
{{OLD_CODE}}

// After:
{{NEW_CODE}}
```

### Fix Verification Checklist
- [ ] Fix addresses root cause (not just symptom)
- [ ] Original reproduction steps no longer reproduce
- [ ] No regression in related functionality
- [ ] Edge cases considered and tested
- [ ] Fix works in all affected environments

### Test Cases Added
- [ ] Unit test: {{TEST_NAME}}
- [ ] Integration test: {{TEST_NAME}}
- [ ] Manual test documented

---

## Phase 8: Prevention

### Why Wasn't This Caught?
{{EXPLAIN_WHY_TESTS_MONITORING_REVIEW_MISSED_THIS}}

### Prevention Measures
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add test for {{SCENARIO}} | {{WHO}} | {{DATE}} | Pending |
| Add monitoring for {{METRIC}} | {{WHO}} | {{DATE}} | Pending |
| Update docs for {{GOTCHA}} | {{WHO}} | {{DATE}} | Pending |

### Similar Issues to Check
- {{SIMILAR_PATTERN_1}} — Could this happen elsewhere?
- {{SIMILAR_PATTERN_2}} — Audit needed?

---

## Investigation Timeline

| Time | Action | Result |
|------|--------|--------|
| {{TIME}} | {{WHAT_YOU_TRIED}} | {{OUTCOME}} |
| {{TIME}} | {{WHAT_YOU_TRIED}} | {{OUTCOME}} |
| {{TIME}} | {{WHAT_YOU_TRIED}} | {{OUTCOME}} |

**Total Investigation Time:** {{HOURS}}

---

## Things Tried (Didn't Work)

Document these so you don't repeat them:

- [ ] {{ATTEMPTED_FIX_1}} — Why it didn't work: {{REASON}}
- [ ] {{ATTEMPTED_FIX_2}} — Why it didn't work: {{REASON}}

---

## Things Ruled Out

- {{RULED_OUT_CAUSE_1}} — Evidence: {{WHY_NOT_THIS}}
- {{RULED_OUT_CAUSE_2}} — Evidence: {{WHY_NOT_THIS}}

---

## Debug Commands & Queries

### Useful Commands
```bash
# {{PURPOSE_1}}
{{COMMAND_1}}

# {{PURPOSE_2}}
{{COMMAND_2}}
```

### Useful Queries
```sql
-- {{PURPOSE}}
{{QUERY}}
```

### Useful API Calls
```bash
# {{PURPOSE}}
curl {{API_CALL}}
```

---

## Escalation Points

| If This | Then | Contact |
|---------|------|---------|
| > 2 hours, no progress | Escalate | {{SENIOR_DEV}} |
| Infrastructure suspected | Escalate | {{DEVOPS}} |
| Data corruption | Escalate | {{DBA}} |
| Security implications | Escalate | {{SECURITY}} |

---

## Resolution Summary

### Status: {{RESOLVED/UNRESOLVED}}

### Resolution
{{BRIEF_DESCRIPTION_OF_FIX}}

### Deployed To
- [ ] Development
- [ ] Staging
- [ ] Production

### Verified By
{{WHO_VERIFIED}} on {{DATE}}

### Time to Resolution
- First reported: {{DATE}}
- Root cause found: {{DATE}}
- Fix deployed: {{DATE}}
- Total: {{DURATION}}

---

## Lessons Learned

### What Went Well
- {{WHAT_HELPED}}

### What Could Improve
- {{WHAT_SLOWED_US_DOWN}}

### Process Improvements
- {{SUGGESTION_FOR_FUTURE}}

---

## Quick Debug Checklist

For rapid triage, work through this list:

- [ ] Can I reproduce it?
- [ ] What changed recently?
- [ ] What do the logs say?
- [ ] Is it environment-specific?
- [ ] Is it data-specific?
- [ ] Is it user-specific?
- [ ] Is it timing-related?
- [ ] Have I seen this pattern before?

---

*"Debugging is like being the detective in a crime movie where you're also the murderer." — Filipe Fortes*
