# Universal Frameworks Collection
### Standardized Templates for AI-Assisted Development

---

## Overview

This collection provides reusable markdown frameworks for common development workflows. Each framework is designed to:

- Improve consistency across projects
- Enable efficient AI-assisted development
- Capture institutional knowledge
- Reduce decision fatigue with proven templates

---

## Quick Start

1. **Copy the entire folder** to your project root as `.frameworks/` or `docs/frameworks/`
2. **Customize** the templates with your project specifics
3. **Reference** them in your AI prompts for context
4. **Update** as your practices evolve

---

## Framework Index

| Framework | Purpose | Use When |
|-----------|---------|----------|
| [Delegation Framework](./UNIVERSAL_DELEGATION_FRAMEWORK.md) | Project orchestration with AI agents | Starting multi-phase projects |
| [Context Handoff](./UNIVERSAL_CONTEXT_HANDOFF.md) | Preserve state between sessions | Ending work sessions, handoffs |
| [Debug Framework](./UNIVERSAL_DEBUG_FRAMEWORK.md) | Systematic troubleshooting | Investigating bugs |
| [Code Review](./UNIVERSAL_CODE_REVIEW.md) | Consistent review standards | PRs and code reviews |
| [ADR (Architecture Decisions)](./UNIVERSAL_ADR.md) | Document technical decisions | Making architectural choices |
| [Refactoring Playbook](./UNIVERSAL_REFACTORING_PLAYBOOK.md) | Safe code improvement | Improving existing code |
| [Testing Strategy](./UNIVERSAL_TESTING_STRATEGY.md) | Test planning & standards | Defining test approach |
| [Error Handling](./UNIVERSAL_ERROR_HANDLING.md) | Consistent error patterns | Implementing error handling |
| [Prompt Engineering](./UNIVERSAL_PROMPT_ENGINEERING.md) | AI interaction standards | Working with AI assistants |
| [Knowledge Capture](./UNIVERSAL_KNOWLEDGE_CAPTURE.md) | Institutional memory | Documenting learnings |
| [Incident Response](./UNIVERSAL_INCIDENT_RESPONSE.md) | Production issue handling | Responding to outages |
| [API Contract](./UNIVERSAL_API_CONTRACT.md) | API design & documentation | Building APIs |
| [Migration Playbook](./UNIVERSAL_MIGRATION_PLAYBOOK.md) | Safe database/system changes | Running migrations |

---

## Recommended Project Structure

```
{{PROJECT}}/
├── .frameworks/                    # Or docs/frameworks/
│   ├── README.md                   # This file
│   ├── UNIVERSAL_DELEGATION_FRAMEWORK.md
│   ├── UNIVERSAL_CONTEXT_HANDOFF.md
│   ├── UNIVERSAL_DEBUG_FRAMEWORK.md
│   ├── UNIVERSAL_CODE_REVIEW.md
│   ├── UNIVERSAL_ADR.md
│   ├── UNIVERSAL_REFACTORING_PLAYBOOK.md
│   ├── UNIVERSAL_TESTING_STRATEGY.md
│   ├── UNIVERSAL_ERROR_HANDLING.md
│   ├── UNIVERSAL_PROMPT_ENGINEERING.md
│   ├── UNIVERSAL_KNOWLEDGE_CAPTURE.md
│   ├── UNIVERSAL_INCIDENT_RESPONSE.md
│   ├── UNIVERSAL_API_CONTRACT.md
│   └── UNIVERSAL_MIGRATION_PLAYBOOK.md
├── docs/
│   ├── decisions/                  # Filled ADRs
│   ├── runbooks/                   # Operational runbooks
│   └── knowledge/                  # TILs, gotchas, FAQs
├── .context/                       # Context handoffs
│   └── LATEST_HANDOFF.md
└── src/
    └── ...
```

---

## How to Use with AI Assistants

### Provide Context
When starting a session, reference relevant frameworks:

```
"I'm debugging an issue. Please follow the approach in our
UNIVERSAL_DEBUG_FRAMEWORK.md and help me work through it systematically."
```

### Capture Output
Ask AI to format output using framework templates:

```
"Please document this technical decision using our ADR template
from UNIVERSAL_ADR.md"
```

### End Sessions Properly
Create context handoffs:

```
"Before we end, please create a context handoff document
using UNIVERSAL_CONTEXT_HANDOFF.md so I can pick up where we left off."
```

---

## Framework Categories

### 🎯 Project Management
- **Delegation Framework** — Orchestrate multi-team AI projects
- **Context Handoff** — Preserve session continuity

### 🔧 Development
- **Debug Framework** — Systematic troubleshooting
- **Code Review** — Consistent review standards
- **Refactoring Playbook** — Safe code improvement
- **Testing Strategy** — Test planning

### 🏗️ Architecture
- **ADR** — Document decisions
- **API Contract** — API design standards
- **Error Handling** — Error patterns

### 📚 Knowledge
- **Knowledge Capture** — Build institutional memory
- **Prompt Engineering** — AI interaction standards

### 🚨 Operations
- **Incident Response** — Handle production issues
- **Migration Playbook** — Safe migrations

---

## Customization Guide

Each framework uses `{{PLACEHOLDERS}}` for project-specific values. Replace these with:

1. **Project-specific values** — Names, URLs, team members
2. **Your standards** — Coding style, review criteria
3. **Your tools** — CI/CD, monitoring, communication channels
4. **Your processes** — Approval flows, escalation paths

### Example Customization

Before:
```markdown
**Slack Channel:** #{{TEAM_CHANNEL}}
**Escalate to:** {{ON_CALL_ENGINEER}}
```

After:
```markdown
**Slack Channel:** #platform-team
**Escalate to:** See PagerDuty rotation
```

---

## Maintenance

### Regular Reviews
| Framework | Review Frequency | Owner |
|-----------|------------------|-------|
| Delegation | Per project | Project lead |
| Runbooks | Quarterly | DevOps |
| ADRs | When revisiting decisions | Tech lead |
| All others | Semi-annually | Team |

### Version Control
- Commit frameworks with your codebase
- Track changes in git history
- Consider a CHANGELOG for major updates

---

## Contributing

### Adding New Frameworks
1. Follow the existing format
2. Include clear purpose statement
3. Use `{{PLACEHOLDERS}}` for customizable values
4. Add to this README index

### Improving Existing
1. Make changes in a branch
2. Document what changed and why
3. Get team review

---

## Credits

These frameworks synthesize best practices from:
- Software engineering literature
- Industry experience
- AI-assisted development patterns

---

*"Good frameworks free you to focus on the work that matters."*
