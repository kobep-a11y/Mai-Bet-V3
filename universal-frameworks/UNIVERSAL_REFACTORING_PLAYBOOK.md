# Universal Refactoring Playbook
### Safe, Incremental Code Improvement

---

## How to Use This Playbook

1. **Identify the smell** — Know what you're fixing
2. **Plan the approach** — Small steps, not big rewrites
3. **Ensure safety net** — Tests before changes
4. **Execute incrementally** — Commit after each step
5. **Verify continuously** — Tests pass at every step

---

## Golden Rules of Refactoring

1. **Never refactor and change behavior simultaneously**
2. **Every commit should leave tests passing**
3. **If tests don't exist, write them first**
4. **Small steps are faster than big rewrites**
5. **Refactor with a clear goal, not "while I'm here"**

---

# Refactoring Session

## Session Metadata

**Date:** {{DATE}}
**Developer:** {{NAME}}
**Codebase Area:** {{AREA}}
**Goal:** {{WHAT_YOU_WANT_TO_IMPROVE}}
**Time Budget:** {{HOURS}}

---

## Pre-Refactoring Checklist

### Safety Net Verification
- [ ] All existing tests pass
- [ ] Test coverage for target code is ≥ {{PERCENTAGE}}%
- [ ] CI pipeline is green
- [ ] Working on a feature branch

### If Tests Are Insufficient
- [ ] Write characterization tests first (capture current behavior)
- [ ] Document untested edge cases
- [ ] Get test coverage to acceptable level

### Scope Definition
- [ ] Refactoring goal clearly defined
- [ ] Scope bounded (not "improve everything")
- [ ] Success criteria established
- [ ] Rollback plan identified

---

## Code Smell Identification

### Smell: {{SMELL_NAME}}

**Location:** `{{FILE_PATH}}`

**Description:**
{{WHAT_THE_PROBLEM_IS}}

**Why it matters:**
{{NEGATIVE_IMPACT_ON_CODEBASE}}

**Evidence:**
```{{LANGUAGE}}
{{CODE_EXAMPLE_SHOWING_SMELL}}
```

---

## Common Code Smells Reference

### Bloated Code
| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Long Method | Method > 20 lines | Extract Method |
| Large Class | Class > 200 lines | Extract Class |
| Long Parameter List | > 3 parameters | Introduce Parameter Object |
| Data Clumps | Same params everywhere | Extract Class |
| Primitive Obsession | Strings for everything | Introduce Value Object |

### Object-Orientation Issues
| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Feature Envy | Method uses other class's data | Move Method |
| Inappropriate Intimacy | Class knows too much about another | Move Method/Field |
| Refused Bequest | Subclass doesn't use parent methods | Replace Inheritance with Delegation |
| Lazy Class | Class does too little | Inline Class |

### Change Preventers
| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Divergent Change | One class changed for multiple reasons | Extract Class |
| Shotgun Surgery | One change requires many class edits | Move Method/Field |
| Parallel Inheritance | Adding subclass requires another | Fold Hierarchies |

### Dispensables
| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Duplicate Code | Same code in multiple places | Extract Method |
| Dead Code | Unreachable/unused code | Remove |
| Speculative Generality | Unused abstractions | Inline/Remove |
| Comments | Explaining bad code | Extract Method, Rename |

---

## Refactoring Catalog

### Extract Method

**When:** Code fragment that can be grouped

**Before:**
```{{LANGUAGE}}
{{BEFORE_CODE}}
```

**After:**
```{{LANGUAGE}}
{{AFTER_CODE}}
```

**Steps:**
1. Create new method with descriptive name
2. Copy code fragment to new method
3. Identify local variables → parameters
4. Identify modified variables → return value
5. Replace fragment with method call
6. Test

---

### Extract Class

**When:** Class does too many things

**Steps:**
1. Identify related fields/methods
2. Create new class
3. Move fields one at a time (test after each)
4. Move methods one at a time (test after each)
5. Review remaining class
6. Consider relationships between classes

---

### Rename (Variable/Method/Class)

**When:** Name doesn't reveal intent

**Steps:**
1. Find all references
2. Update declaration
3. Update all usages
4. Test
5. Commit

**IDE Support:** Use refactoring tools, don't search-replace

---

### Move Method

**When:** Method uses more features of another class

**Steps:**
1. Examine all features used by method
2. Check for overriding methods in subclasses
3. Declare method in target class
4. Copy code, adjust for new context
5. Compile target class
6. Delegate from source to target
7. Test
8. Remove source method
9. Replace all references
10. Test again

---

### Replace Conditional with Polymorphism

**When:** Conditional that chooses behavior based on type

**Before:**
```{{LANGUAGE}}
switch(type) {
  case 'A': return handleA();
  case 'B': return handleB();
}
```

**After:**
```{{LANGUAGE}}
interface Handler { handle(); }
class AHandler implements Handler { handle() {...} }
class BHandler implements Handler { handle() {...} }
```

**Steps:**
1. Create inheritance structure
2. Move conditional branches to subclasses
3. Replace conditional with polymorphic call
4. Test after each move

---

### Introduce Parameter Object

**When:** Group of parameters that go together

**Before:**
```{{LANGUAGE}}
function report(startDate, endDate, userId, format)
```

**After:**
```{{LANGUAGE}}
function report(reportParams: ReportParams)
```

**Steps:**
1. Create class for parameter group
2. Add new parameter to method
3. Move one old parameter at a time to new object
4. Test after each move
5. Remove old parameters
6. Look for behavior to move to new class

---

## Refactoring Plan Template

### Goal
{{WHAT_YOU_WANT_THE_CODE_TO_LOOK_LIKE}}

### Current State
{{HOW_THE_CODE_CURRENTLY_LOOKS}}

### Step-by-Step Plan

| Step | Refactoring | Target | Risk | Test After |
|------|-------------|--------|------|------------|
| 1 | {{TECHNIQUE}} | {{LOCATION}} | Low | ✓ |
| 2 | {{TECHNIQUE}} | {{LOCATION}} | Low | ✓ |
| 3 | {{TECHNIQUE}} | {{LOCATION}} | Med | ✓ |

### Commit Strategy
- Commit after each step
- Message format: `refactor: {{WHAT_CHANGED}}`

---

## Refactoring Execution Log

| Step | Action | Time | Tests | Notes |
|------|--------|------|-------|-------|
| 1 | {{WHAT_YOU_DID}} | {{TIME}} | ✅/❌ | {{NOTES}} |
| 2 | {{WHAT_YOU_DID}} | {{TIME}} | ✅/❌ | {{NOTES}} |

---

## Before/After Comparison

### Before
```{{LANGUAGE}}
{{ORIGINAL_CODE}}
```

**Problems:**
- {{PROBLEM_1}}
- {{PROBLEM_2}}

### After
```{{LANGUAGE}}
{{REFACTORED_CODE}}
```

**Improvements:**
- {{IMPROVEMENT_1}}
- {{IMPROVEMENT_2}}

### Metrics
| Metric | Before | After |
|--------|--------|-------|
| Lines of Code | {{N}} | {{N}} |
| Cyclomatic Complexity | {{N}} | {{N}} |
| Test Coverage | {{%}} | {{%}} |
| Dependencies | {{N}} | {{N}} |

---

## Rollback Procedure

### If Tests Fail
1. `git stash` or `git checkout .` for current changes
2. `git bisect` to find breaking commit
3. Revert to last green commit
4. Analyze what went wrong

### If Deployed and Issues Found
1. Revert PR/merge
2. Document what broke
3. Plan smaller steps for retry

---

## Testing During Refactoring

### Characterization Tests
When no tests exist, capture current behavior:

```{{LANGUAGE}}
test('captures current behavior', () => {
  // This test documents what the code DOES
  // not necessarily what it SHOULD do
  const result = legacyFunction(input);
  expect(result).toBe({{ACTUAL_OUTPUT}});
});
```

### Approval Testing
For complex outputs:
1. Capture output to file
2. Review manually once
3. Subsequent runs compare to approved output

---

## Common Pitfalls

### ❌ Don't
- Refactor without tests
- Make behavioral changes during refactoring
- Refactor code you don't understand yet
- Go down rabbit holes ("while I'm here...")
- Refactor everything at once

### ✅ Do
- Write tests first if missing
- Keep changes purely structural
- Understand code before changing it
- Stay focused on original goal
- Small, incremental steps

---

## Definition of Done

Refactoring is complete when:

- [ ] Original goal achieved
- [ ] All tests pass
- [ ] No behavioral changes introduced
- [ ] Code is cleaner than before
- [ ] Technical debt reduced
- [ ] Changes committed with good messages
- [ ] PR ready for review (if applicable)

---

## Post-Refactoring Review

### What improved?
- {{IMPROVEMENT}}

### What didn't work?
- {{ISSUE}}

### Lessons for next time
- {{LESSON}}

### Follow-up tasks
- [ ] {{TASK}}

---

*"Make it work, make it right, make it fast — in that order." — Kent Beck*
