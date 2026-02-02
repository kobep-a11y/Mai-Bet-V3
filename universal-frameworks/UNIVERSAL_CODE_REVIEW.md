# Universal Code Review Framework
### Consistent, Thorough, Actionable Reviews

---

## How to Use This Framework

**As a Reviewer:**
1. Use the checklist to ensure thoroughness
2. Categorize feedback by severity
3. Be specific and actionable

**As an Author:**
1. Self-review using checklist before requesting
2. Provide context in the PR description
3. Respond to all feedback

---

# Code Review Request

## PR Metadata

**PR/MR:** #{{NUMBER}}
**Title:** {{PR_TITLE}}
**Author:** {{AUTHOR}}
**Reviewers:** {{REVIEWER_LIST}}
**Branch:** `{{FEATURE_BRANCH}}` → `{{TARGET_BRANCH}}`
**Created:** {{DATE}}
**Size:** {{LINES_CHANGED}} lines changed

---

## Author's Context

### What does this PR do?
{{CLEAR_DESCRIPTION_OF_CHANGES}}

### Why is this change needed?
{{BUSINESS_OR_TECHNICAL_RATIONALE}}

### Related Issues/Tickets
- Fixes #{{ISSUE_NUMBER}}
- Related to #{{RELATED_ISSUE}}

### Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test addition/modification
- [ ] Configuration change

### How should reviewers test this?
```bash
# Steps to test locally:
{{TEST_INSTRUCTIONS}}
```

### Screenshots/Demos (if applicable)
{{BEFORE_AFTER_SCREENSHOTS}}

### Checklist before requesting review
- [ ] Code compiles/runs without errors
- [ ] All tests pass
- [ ] I've tested the happy path
- [ ] I've tested edge cases
- [ ] I've updated documentation (if needed)
- [ ] I've added tests (if applicable)
- [ ] I've self-reviewed the diff

---

## Review Checklist

### 🔒 Security
- [ ] No secrets, keys, or credentials in code
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Authentication/authorization checks in place
- [ ] Sensitive data properly encrypted/hashed
- [ ] No security-sensitive information in logs
- [ ] Dependencies don't have known vulnerabilities

### 🎯 Correctness
- [ ] Code does what PR description claims
- [ ] Logic handles all expected cases
- [ ] Edge cases handled appropriately
- [ ] Error handling is comprehensive
- [ ] No obvious bugs or logic errors
- [ ] Null/undefined checks where needed
- [ ] Off-by-one errors checked
- [ ] Race conditions considered (if concurrent)

### 🏗️ Architecture & Design
- [ ] Follows existing patterns in codebase
- [ ] Single Responsibility Principle respected
- [ ] Appropriate separation of concerns
- [ ] No unnecessary coupling
- [ ] Dependencies injected appropriately
- [ ] Abstractions are at the right level
- [ ] No premature optimization
- [ ] No premature abstraction

### 📖 Readability & Maintainability
- [ ] Code is self-documenting
- [ ] Variable/function names are clear and descriptive
- [ ] Complex logic has explanatory comments
- [ ] No dead code or commented-out code
- [ ] Functions are reasonably sized (<50 lines guideline)
- [ ] Nesting depth is reasonable (<4 levels)
- [ ] Magic numbers/strings extracted to constants
- [ ] Consistent formatting (auto-formatter applied)

### ⚡ Performance
- [ ] No N+1 query problems
- [ ] Appropriate indexing considered
- [ ] No unnecessary database calls
- [ ] Large data sets handled efficiently
- [ ] Memory usage is reasonable
- [ ] No blocking operations on main thread
- [ ] Caching used where appropriate
- [ ] Pagination for large result sets

### 🧪 Testing
- [ ] Unit tests cover new/changed logic
- [ ] Edge cases are tested
- [ ] Error paths are tested
- [ ] Tests are readable and maintainable
- [ ] Tests don't depend on external services
- [ ] Test names describe the scenario
- [ ] No flaky tests introduced
- [ ] Integration tests where appropriate

### 📚 Documentation
- [ ] Public APIs are documented
- [ ] Complex algorithms are explained
- [ ] README updated (if needed)
- [ ] Changelog updated (if needed)
- [ ] Migration steps documented (if needed)
- [ ] API documentation updated (if endpoint changed)

### 🔧 Operations
- [ ] Appropriate logging added
- [ ] Metrics/monitoring considered
- [ ] Feature flags used for risky changes
- [ ] Backward compatibility maintained
- [ ] Database migrations are reversible
- [ ] No breaking changes to APIs (or versioned)

---

## Feedback Severity Levels

Use these labels to categorize feedback:

### 🔴 Blocker
**Must be fixed before merge.**
- Security vulnerabilities
- Data loss risks
- Breaking changes
- Critical bugs

### 🟡 Suggestion
**Should be fixed, but can discuss.**
- Performance improvements
- Code organization
- Better approaches
- Missing tests

### 🟢 Nitpick
**Take it or leave it.**
- Style preferences
- Minor naming tweaks
- Optional improvements

### 💬 Question
**Need clarification to continue review.**
- "Why was this approach chosen?"
- "What happens if X?"

### 👍 Praise
**Positive feedback matters too!**
- "Great use of pattern here"
- "This is really clean"

---

## Review Feedback Template

When leaving feedback, use this structure:

```markdown
**[SEVERITY]** {{CATEGORY}}

**Location:** `{{file_path}}:{{line_number}}`

**Issue:**
{{WHAT_THE_PROBLEM_IS}}

**Suggestion:**
{{HOW_TO_FIX_IT}}

**Why:**
{{RATIONALE_OR_REFERENCE}}
```

### Example Feedback

```markdown
**[🟡 Suggestion]** Performance

**Location:** `src/services/UserService.js:45`

**Issue:**
This query runs inside a loop, causing N+1 database calls.

**Suggestion:**
Batch the IDs and use a single `WHERE id IN (...)` query before the loop.

**Why:**
With 100 users, this would make 100 DB calls instead of 1.
```

---

## Review Response Template

When responding to feedback:

```markdown
**Status:** ✅ Fixed / 🔄 Will address separately / 💬 Let's discuss

**Response:**
{{YOUR_RESPONSE}}

**Commit:** {{COMMIT_SHA_IF_FIXED}}
```

---

## Approval Criteria

### Ready to Approve When:
- [ ] All 🔴 Blockers resolved
- [ ] All 🟡 Suggestions addressed or discussed
- [ ] Tests pass in CI
- [ ] No unresolved conversations
- [ ] Documentation complete

### Approval Types
| Type | Meaning |
|------|---------|
| ✅ Approved | Ready to merge |
| 🟡 Approved with suggestions | Merge after addressing minor items |
| 🔄 Request changes | Must address before re-review |
| 💬 Comment | FYI only, not blocking |

---

## Review Metrics to Track

### Per Review
- Time from request to first review
- Number of review rounds
- Types of issues found

### Aggregate
- Average review turnaround time
- Common issue categories
- Code review coverage

---

## Anti-Patterns to Avoid

### As Reviewer
- ❌ Rubber-stamping without reading
- ❌ Being overly critical on style
- ❌ Blocking on nitpicks
- ❌ Not explaining why something is wrong
- ❌ Rewriting code in comments

### As Author
- ❌ Submitting huge PRs (>500 lines)
- ❌ Not providing context
- ❌ Getting defensive about feedback
- ❌ Ignoring feedback without discussion
- ❌ Not testing before requesting review

---

## PR Size Guidelines

| Size | Lines | Review Time | Risk |
|------|-------|-------------|------|
| XS | <50 | 15 min | Low |
| S | 50-200 | 30 min | Low |
| M | 200-400 | 1 hour | Medium |
| L | 400-800 | 2 hours | High |
| XL | >800 | Split it | Very High |

**Guideline:** If a PR is >400 lines, consider splitting it.

---

## Special Review Types

### Security-Sensitive Changes
Additional reviewers: {{SECURITY_TEAM}}
Extra checklist:
- [ ] Threat modeling completed
- [ ] Security team signed off

### Database Migrations
Additional reviewers: {{DBA}}
Extra checklist:
- [ ] Migration tested on production-like data
- [ ] Rollback tested
- [ ] Performance impact assessed

### API Changes
Additional reviewers: {{API_OWNERS}}
Extra checklist:
- [ ] Backward compatibility verified
- [ ] API documentation updated
- [ ] Client impact assessed

---

## Post-Merge Checklist

- [ ] Feature flag enabled (if applicable)
- [ ] Monitoring in place
- [ ] Team notified of change
- [ ] Documentation published
- [ ] Related tickets closed

---

*"Code reviews are about improving code quality and sharing knowledge, not proving who's smarter."*
