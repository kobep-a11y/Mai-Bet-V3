# Universal Prompt Engineering Framework
### Standards for AI-Assisted Development

---

## How to Use This Framework

1. **Select prompt template** based on task type
2. **Provide structured context** for better results
3. **Iterate with feedback loops**
4. **Verify outputs** against acceptance criteria

---

## Prompt Engineering Principles

1. **Be specific** — Vague prompts get vague answers
2. **Provide context** — AI can't read your mind or codebase
3. **Show examples** — Demonstrate what you want
4. **Define constraints** — Specify what NOT to do
5. **Request format** — Specify output structure
6. **Iterate** — First output is rarely final

---

## Context Provision Template

For any coding task, provide:

```markdown
## Project Context
- Language/Framework: {{LANGUAGE_FRAMEWORK}}
- Project type: {{WEB_APP_CLI_LIBRARY_ETC}}
- Key dependencies: {{MAJOR_LIBRARIES}}
- Coding style: {{STYLE_GUIDE_REFERENCE}}

## Current State
- File being modified: {{FILE_PATH}}
- Function/component: {{RELEVANT_CODE}}
- Related files: {{DEPENDENCIES}}

## Task
{{WHAT_YOU_WANT_DONE}}

## Constraints
- Must: {{REQUIREMENTS}}
- Must not: {{PROHIBITIONS}}
- Style: {{STYLE_PREFERENCES}}

## Examples (if applicable)
{{SIMILAR_CODE_OR_PATTERN}}

## Expected Output
{{FORMAT_AND_DELIVERABLES}}
```

---

## Prompt Templates by Task Type

### 1. Code Generation

```markdown
Generate a {{LANGUAGE}} {{WHAT}} that:

**Requirements:**
- {{REQUIREMENT_1}}
- {{REQUIREMENT_2}}
- {{REQUIREMENT_3}}

**Input:** {{DESCRIBE_INPUT}}
**Output:** {{DESCRIBE_OUTPUT}}

**Constraints:**
- Use {{LIBRARY/PATTERN}}
- Follow {{STYLE_GUIDE}}
- No dependencies on {{AVOID}}

**Example usage:**
```{{LANGUAGE}}
{{EXAMPLE_OF_HOW_CODE_WILL_BE_USED}}
```

**Similar code in this project:**
```{{LANGUAGE}}
{{EXISTING_PATTERN_TO_FOLLOW}}
```
```

---

### 2. Code Review

```markdown
Review this {{LANGUAGE}} code for:

**Code:**
```{{LANGUAGE}}
{{CODE_TO_REVIEW}}
```

**Focus areas:**
- [ ] Security vulnerabilities
- [ ] Performance issues
- [ ] Readability/maintainability
- [ ] Error handling
- [ ] Edge cases
- [ ] {{SPECIFIC_CONCERN}}

**Project context:**
- This code {{WHAT_IT_DOES}}
- It's called by {{CALLERS}}
- It depends on {{DEPENDENCIES}}

**Please provide:**
1. Critical issues (must fix)
2. Suggestions (should consider)
3. Nitpicks (optional)
```

---

### 3. Debugging Assistance

```markdown
Help me debug this issue:

**Error/Symptom:**
```
{{ERROR_MESSAGE_OR_DESCRIPTION}}
```

**Code causing the issue:**
```{{LANGUAGE}}
{{RELEVANT_CODE}}
```

**What I expected:**
{{EXPECTED_BEHAVIOR}}

**What actually happens:**
{{ACTUAL_BEHAVIOR}}

**What I've already tried:**
- {{ATTEMPT_1}}
- {{ATTEMPT_2}}

**Environment:**
- {{LANGUAGE}} version: {{VERSION}}
- OS: {{OS}}
- Relevant packages: {{VERSIONS}}

**Questions I have:**
1. {{QUESTION}}
```

---

### 4. Explanation Request

```markdown
Explain this {{CODE/CONCEPT}}:

```{{LANGUAGE}}
{{CODE_TO_EXPLAIN}}
```

**My current understanding:**
{{WHAT_I_THINK_IT_DOES}}

**What confuses me:**
{{SPECIFIC_CONFUSION}}

**Please explain:**
1. What it does (high level)
2. How it works (step by step)
3. Why it's written this way
4. Potential issues or edge cases

**My experience level:** {{BEGINNER/INTERMEDIATE/ADVANCED}}
```

---

### 5. Refactoring Request

```markdown
Refactor this code to improve {{GOAL}}:

**Current code:**
```{{LANGUAGE}}
{{CURRENT_CODE}}
```

**Problems with current code:**
- {{PROBLEM_1}}
- {{PROBLEM_2}}

**Desired outcome:**
- {{IMPROVEMENT_1}}
- {{IMPROVEMENT_2}}

**Constraints:**
- Maintain same external interface
- No new dependencies
- Must pass existing tests
- {{SPECIFIC_CONSTRAINT}}

**Patterns used in this codebase:**
```{{LANGUAGE}}
{{EXAMPLE_OF_PREFERRED_PATTERN}}
```
```

---

### 6. Test Generation

```markdown
Generate tests for this {{LANGUAGE}} code:

**Code to test:**
```{{LANGUAGE}}
{{CODE}}
```

**Testing framework:** {{JEST/PYTEST/ETC}}

**Test coverage needed:**
- [ ] Happy path
- [ ] Edge cases
- [ ] Error handling
- [ ] {{SPECIFIC_SCENARIO}}

**Edge cases to consider:**
- {{EDGE_CASE_1}}
- {{EDGE_CASE_2}}

**Mocking requirements:**
- {{WHAT_TO_MOCK}}

**Existing test style:**
```{{LANGUAGE}}
{{EXAMPLE_TEST}}
```
```

---

### 7. Documentation Writing

```markdown
Write documentation for:

**Code/API:**
```{{LANGUAGE}}
{{CODE_OR_API}}
```

**Documentation type:**
- [ ] README
- [ ] API reference
- [ ] Tutorial
- [ ] Inline comments
- [ ] JSDoc/docstrings

**Audience:**
- Experience level: {{LEVEL}}
- Will use this for: {{USE_CASE}}

**Include:**
- [ ] Description
- [ ] Parameters
- [ ] Return values
- [ ] Examples
- [ ] Error cases
- [ ] {{SPECIFIC_SECTION}}

**Tone:** {{FORMAL/CASUAL/TECHNICAL}}
```

---

### 8. Architecture/Design

```markdown
Help me design a {{WHAT}}:

**Requirements:**
- {{FUNCTIONAL_REQ_1}}
- {{FUNCTIONAL_REQ_2}}

**Non-functional requirements:**
- Scale: {{EXPECTED_SCALE}}
- Performance: {{REQUIREMENTS}}
- Availability: {{REQUIREMENTS}}

**Constraints:**
- Must integrate with: {{EXISTING_SYSTEMS}}
- Technology preferences: {{PREFERENCES}}
- Team expertise: {{SKILLS}}

**Current system (if applicable):**
{{DESCRIPTION_OF_CURRENT_STATE}}

**Please provide:**
1. High-level architecture
2. Component breakdown
3. Data flow
4. Key technical decisions and tradeoffs
5. Potential issues to watch for
```

---

## Output Format Specifications

### Request Specific Formats

```markdown
**Output format:**
- Language: {{LANGUAGE}}
- Style: Follow {{STYLE_GUIDE}}
- Comments: {{MINIMAL/VERBOSE/NONE}}
- Structure: {{SINGLE_FILE/MULTIPLE_FILES}}

**Do not include:**
- Explanations outside code blocks
- Placeholder comments like "// implement here"
- Incomplete implementations
```

### Common Format Requests

| Request | Gets You |
|---------|----------|
| "Reply with only code" | No explanations |
| "Use markdown code blocks" | Formatted, copyable code |
| "Return as JSON" | Structured data |
| "Provide as diff" | Git-style changes |
| "Show before and after" | Side-by-side comparison |

---

## Iteration Patterns

### Refinement Prompt
```markdown
The previous output {{WAS_CLOSE_BUT}}:

**What worked:**
- {{GOOD_PART}}

**What needs changing:**
- {{ISSUE_1}}: {{HOW_TO_FIX}}
- {{ISSUE_2}}: {{HOW_TO_FIX}}

**Additional context:**
{{NEW_INFORMATION}}

Please revise with these changes.
```

### Expansion Prompt
```markdown
This is good. Now also:
- Add {{FEATURE}}
- Handle {{EDGE_CASE}}
- Include {{ADDITIONAL_REQUIREMENT}}

Keep everything else the same.
```

### Constraint Tightening
```markdown
This works but:
- It's too {{VERBOSE/SLOW/COMPLEX}}
- It doesn't follow our {{PATTERN/STYLE}}
- It uses {{THING_TO_AVOID}}

Please revise to {{SPECIFIC_CONSTRAINT}}.
```

---

## Verification Checklist

After receiving AI output:

- [ ] Code compiles/parses
- [ ] Logic matches requirements
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] Style matches codebase
- [ ] No hallucinated APIs/methods
- [ ] No security vulnerabilities
- [ ] Tests pass (if applicable)

---

## Anti-Patterns to Avoid

### ❌ Bad Prompts

```markdown
# Too vague
"Write a function to process data"

# No context
"Fix this bug" (no code shown)

# Asking to guess
"What's wrong with my code?" (no code)

# Conflicting requirements
"Make it fast but also readable but also short"
```

### ✅ Good Prompts

```markdown
# Specific
"Write a TypeScript function that validates email addresses using regex, returns boolean, handles empty strings"

# With context
"This Express middleware is returning 500 errors. Here's the code: [code]. The error is: [error]"

# Complete information
"Here's the code, here's what it should do, here's what it actually does, here's what I've tried"

# Clear priorities
"Prioritize readability over performance. This runs once per day, not in a hot path."
```

---

## Context Window Management

### For Large Codebases

```markdown
**Relevant code only:**
I'm working on {{SPECIFIC_FEATURE}}.

**Files involved:**
1. {{FILE_1}} - {{ROLE}}
2. {{FILE_2}} - {{ROLE}}

**Key interfaces:**
```{{LANGUAGE}}
{{INTERFACE_DEFINITIONS}}
```

**You don't need to see:**
- Test files
- Configuration
- Unrelated modules

**Summary of what's not shown:**
{{BRIEF_DESCRIPTION}}
```

### For Long Conversations

```markdown
**Recap of our conversation:**
1. We're building {{WHAT}}
2. We decided to {{KEY_DECISION}}
3. Current status: {{STATUS}}

**Now I need help with:**
{{CURRENT_TASK}}
```

---

## Prompt Library

Keep a library of effective prompts for your team:

```markdown
## Prompt: {{NAME}}
**Use when:** {{SITUATION}}
**Template:**
[template here]

**Example:**
[filled example]

**Notes:**
[tips for best results]
```

---

*"A well-crafted prompt is like a well-written function signature — it communicates intent clearly and reduces ambiguity."*
