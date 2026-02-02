# Universal Incident Response Framework
### Structured Response to Production Issues

---

## How to Use This Framework

1. **Detect** — Know something is wrong
2. **Triage** — Assess severity
3. **Respond** — Take immediate action
4. **Communicate** — Keep stakeholders informed
5. **Resolve** — Fix the issue
6. **Learn** — Prevent recurrence

---

## Severity Definitions

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **SEV-1** | Complete outage, all users affected | Immediate | Site down, data breach |
| **SEV-2** | Major feature broken, many users affected | <15 min | Payments failing, auth broken |
| **SEV-3** | Minor feature broken, some users affected | <1 hour | Search slow, feature bug |
| **SEV-4** | Cosmetic/minor, few users notice | <1 day | UI glitch, typo |

---

## Incident Roles

| Role | Responsibility | Who |
|------|----------------|-----|
| **Incident Commander (IC)** | Overall coordination, decisions | {{PRIMARY_ON_CALL}} |
| **Technical Lead** | Drives technical investigation | {{SENIOR_ENGINEER}} |
| **Communications Lead** | Updates stakeholders | {{COMMS_PERSON}} |
| **Scribe** | Documents timeline | {{ASSIGNED_PERSON}} |

---

# Active Incident

## Incident Metadata

**Incident ID:** INC-{{NUMBER}}
**Title:** {{SHORT_DESCRIPTION}}
**Severity:** SEV-{{1/2/3/4}}
**Status:** Detected / Investigating / Mitigating / Resolved
**Started:** {{TIMESTAMP}}
**Resolved:** {{TIMESTAMP_OR_ONGOING}}
**Duration:** {{DURATION}}

**Incident Commander:** {{NAME}}
**Technical Lead:** {{NAME}}
**Communications Lead:** {{NAME}}

---

## Detection

**How was it detected?**
- [ ] Monitoring/alerting
- [ ] Customer report
- [ ] Internal user report
- [ ] Automated test
- [ ] Other: {{SPECIFY}}

**Alert/Report Details:**
```
{{ALERT_OR_REPORT_CONTENT}}
```

**Initial Impact Assessment:**
- Users affected: {{NUMBER_OR_PERCENTAGE}}
- Features affected: {{LIST}}
- Revenue impact: {{ESTIMATE_OR_UNKNOWN}}

---

## Timeline

| Time | Action | Who | Notes |
|------|--------|-----|-------|
| {{TIME}} | Incident detected | {{WHO}} | {{NOTES}} |
| {{TIME}} | IC assigned | {{WHO}} | |
| {{TIME}} | {{ACTION}} | {{WHO}} | {{NOTES}} |
| {{TIME}} | Mitigation deployed | {{WHO}} | {{NOTES}} |
| {{TIME}} | Incident resolved | {{WHO}} | |

---

## Technical Investigation

### Symptoms
{{WHAT_IS_OBSERVABLY_WRONG}}

### Affected Systems
- [ ] {{SYSTEM_1}}
- [ ] {{SYSTEM_2}}
- [ ] {{SYSTEM_3}}

### Hypotheses

| # | Hypothesis | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {{HYPOTHESIS}} | Testing/Confirmed/Ruled Out | {{EVIDENCE}} |
| 2 | {{HYPOTHESIS}} | | |

### Investigation Log
```
{{TIME}} - {{ACTION}} - {{RESULT}}
{{TIME}} - {{ACTION}} - {{RESULT}}
```

### Root Cause (Once Identified)
{{DESCRIPTION_OF_ROOT_CAUSE}}

**Contributing Factors:**
- {{FACTOR_1}}
- {{FACTOR_2}}

---

## Mitigation & Resolution

### Immediate Mitigation
**Action taken:** {{WHAT_WAS_DONE}}
**Effect:** {{IMPACT_ON_SYMPTOMS}}
**Deployed at:** {{TIME}}

### Permanent Fix
**Solution:** {{DESCRIPTION}}
**PR/Commit:** {{LINK}}
**Deployed at:** {{TIME}}
**Verified by:** {{WHO}}

### Rollback (If Performed)
**What was rolled back:** {{COMPONENT}}
**Rolled back to:** {{VERSION}}
**Time:** {{TIMESTAMP}}

---

## Communication Log

### Internal Updates

| Time | Channel | Message |
|------|---------|---------|
| {{TIME}} | {{SLACK_EMAIL}} | {{SUMMARY}} |

### External Updates (If Customer-Facing)

| Time | Channel | Message |
|------|---------|---------|
| {{TIME}} | Status page | {{MESSAGE}} |
| {{TIME}} | Email | {{MESSAGE}} |

### Status Page Updates

**Initial Post:**
```
We are currently investigating {{BRIEF_DESCRIPTION}}.
We will provide updates as we learn more.
```

**During Investigation:**
```
We have identified the issue affecting {{FEATURE}}.
Our team is working on a fix.
Estimated resolution: {{TIME_OR_UNKNOWN}}
```

**Resolution:**
```
The issue affecting {{FEATURE}} has been resolved.
All systems are operating normally.
We apologize for any inconvenience.
```

---

## Post-Incident

### Immediate Actions

- [ ] Verify all systems nominal
- [ ] Clear incident channel
- [ ] Update status page to resolved
- [ ] Schedule post-mortem
- [ ] Notify stakeholders of resolution

### Post-Mortem Scheduled
**Date:** {{DATE}}
**Attendees:** {{LIST}}

---

## Communication Templates

### SEV-1 Initial Notification
```
🔴 SEV-1 INCIDENT: {{TITLE}}

Impact: {{WHAT_IS_AFFECTED}}
Status: Investigating
IC: {{NAME}}
War room: {{LINK}}

Updates will be posted every {{15}} minutes.
```

### SEV-2 Initial Notification
```
🟠 SEV-2 INCIDENT: {{TITLE}}

Impact: {{WHAT_IS_AFFECTED}}
Status: Investigating
IC: {{NAME}}

Updates to follow.
```

### Status Update
```
📋 UPDATE: {{INCIDENT_ID}} - {{TITLE}}

Current status: {{STATUS}}
What we know: {{FINDINGS}}
Next steps: {{ACTIONS}}
ETA: {{ESTIMATE_OR_TBD}}
```

### Resolution Notification
```
✅ RESOLVED: {{INCIDENT_ID}} - {{TITLE}}

Duration: {{DURATION}}
Resolution: {{WHAT_FIXED_IT}}
Impact: {{FINAL_IMPACT_ASSESSMENT}}

Post-mortem scheduled for {{DATE}}.
```

---

## On-Call Procedures

### When Paged

1. **Acknowledge** alert within 5 minutes
2. **Assess** severity using definitions above
3. **Escalate** if SEV-1 or SEV-2
4. **Investigate** following runbooks
5. **Communicate** status within 15 minutes
6. **Document** everything in timeline

### Escalation Path

| Condition | Escalate To | Method |
|-----------|-------------|--------|
| SEV-1 or SEV-2 | Engineering Manager | Phone call |
| Cannot resolve in 30 min | Senior engineer | Slack/Phone |
| Customer data affected | Security team | Immediate |
| Legal/PR implications | Leadership | Immediate |

### War Room Setup (SEV-1/2)

1. Create incident Slack channel: `#inc-{{DATE}}-{{BRIEF_NAME}}`
2. Start video call (optional but recommended)
3. Assign roles (IC, Tech Lead, Comms, Scribe)
4. Begin timeline documentation
5. Post in #incidents with channel link

---

## Post-Mortem Template

### Incident: {{TITLE}}
**Date:** {{DATE}}
**Duration:** {{DURATION}}
**Severity:** SEV-{{N}}
**Author:** {{WHO}}

### Summary
{{2-3_SENTENCE_SUMMARY}}

### Impact
- Users affected: {{NUMBER}}
- Duration: {{TIME}}
- Revenue impact: {{AMOUNT_OR_NONE}}
- Support tickets: {{NUMBER}}

### Timeline
{{COPY_FROM_INCIDENT_TIMELINE}}

### Root Cause
{{DETAILED_EXPLANATION}}

### Contributing Factors
1. {{FACTOR_1}}
2. {{FACTOR_2}}

### What Went Well
- {{POSITIVE_1}}
- {{POSITIVE_2}}

### What Could Be Improved
- {{IMPROVEMENT_1}}
- {{IMPROVEMENT_2}}

### Lessons Learned
1. {{LESSON_1}}
2. {{LESSON_2}}

### Action Items

| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| {{ACTION}} | {{WHO}} | P0/P1/P2 | {{DATE}} | Open |

### Follow-Up Reviews
- [ ] 30-day check on action items: {{DATE}}
- [ ] 90-day effectiveness review: {{DATE}}

---

## Blameless Culture

### Principles

1. **Focus on systems, not individuals** — "How did the system allow this?"
2. **Assume good intentions** — People make mistakes; systems should prevent impact
3. **Learn, don't punish** — Goal is prevention, not blame
4. **Share openly** — Hiding incidents prevents learning

### Post-Mortem Questions to Ask

- What conditions allowed this to happen?
- What would have prevented this?
- What would have helped us detect this sooner?
- What would have helped us resolve this faster?
- What similar issues might exist?

### Questions NOT to Ask

- Who caused this?
- Why didn't you...?
- Whose fault is this?

---

## Incident Metrics

### Track Over Time

| Metric | Definition | Target |
|--------|------------|--------|
| MTTR | Mean time to resolve | <{{HOURS}} |
| MTTD | Mean time to detect | <{{MINUTES}} |
| Incident frequency | Incidents per month | <{{NUMBER}} |
| SEV-1 count | Critical incidents | 0 |
| Action item completion | % completed on time | 100% |

### Monthly Review

- Total incidents by severity
- Top incident categories
- Repeat incidents (same root cause)
- Action item status
- On-call burden

---

## Runbook Quick Links

| Scenario | Runbook |
|----------|---------|
| Database not responding | [DB Recovery](#) |
| High CPU/memory | [Resource Exhaustion](#) |
| API errors spiking | [API Debugging](#) |
| Deployment failed | [Rollback Procedure](#) |
| {{COMMON_SCENARIO}} | [{{RUNBOOK}}](#) |

---

*"Every incident is an opportunity to make the system more resilient."*
