# V2 Lovable Strategy Builder → V3 Implementation Analysis

## Executive Summary

The V2 Lovable Strategy Builder UI is significantly more sophisticated than the current V3 implementation. This document outlines the gaps, conflicts, and implementation plan to bring V3 to feature parity with V2.

---

## Current V3 Implementation vs V2 Features

### 1. Builder Modes

**V2 Has:**
- **Manual Builder** - Create triggers with field dropdowns
- **AI Builder** - Describe strategy in plain English → auto-generates triggers
- **AI Discovery** - Analyzes historical data to find profitable betting patterns

**V3 Current:**
- Single manual mode with basic field selection
- No AI capabilities

**Gap:** Missing 2 of 3 builder modes (AI Builder, AI Discovery)

---

### 2. Condition Fields

**V2 Has (60+ fields organized by category):**

| Category | Fields |
|----------|--------|
| **Current Game** | Current Lead, Quarter, Home Score, Away Score, Game Time (Minutes + Seconds) |
| **Home Team Stats** | Win %, Points/Match, Games Played, Recent Wins (L5, L10) |
| **Away Team Stats** | Win %, Points/Match, Games Played, Recent Wins (L5, L10) |
| **Q1 Scores** | Q1 Home, Q1 Away, Q1 Lead |
| **Q2 Scores** | Q2 Home, Q2 Away, Q2 Lead |
| **Halftime** | Halftime Home, Halftime Away, Halftime Lead |
| **Q3 Scores** | Q3 Home, Q3 Away, Q3 Lead |
| **Q4 Scores** | Q4 Home, Q4 Away, Q4 Lead |
| **Odds** | Home Spread, Away Spread, Home ML, Away ML, Total, Leading Team Spread, Losing Team Spread |

**V3 Current:**
```typescript
const CONDITION_FIELDS = [
  { value: 'homeScore', label: 'Home Score' },
  { value: 'awayScore', label: 'Away Score' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'status', label: 'Game Status' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'Total' },
];
```

**Gap:** Only 6 fields vs 60+ fields. Missing quarter scores, halftime, team stats, most odds fields.

---

### 3. Entry vs Close Conditions

**V2 Has:**
- Separate **Entry Conditions** (when to enter a bet)
- Separate **Close Conditions** (when to close a bet)
- Toggle to enable/disable close conditions
- "Advanced Close Conditions" toggle

**V3 Current:**
- Single `entryOrClose` field on each trigger
- No separate sections in UI
- Basic toggle between entry/close

**Gap:** UI doesn't visually separate entry vs close. No advanced close conditions toggle.

---

### 4. Rules Section

**V2 Has:**
- **First Half Only** toggle
- **Second Half Only** toggle
- **Exclude Overtime** toggle
- **Custom Rules** with options:
  - Specific Quarter (dropdown Q1-Q4)
  - Stop At Time (minutes input)
  - Minimum Combined Score (number input)

**V3 Current:**
- No rules section
- No time-based restrictions
- No quarter restrictions

**Gap:** Entire rules system missing.

---

### 5. Win Requirements (for Backtesting)

**V2 Has:**
- **No win requirement** (just track signals)
- **Leading team at trigger time wins**
- **Home team wins**
- **Away team wins**
- **Final lead greater than or equal to** (value input)

**V3 Current:**
- No win requirement concept
- No backtesting capability

**Gap:** Entire backtesting/win requirement system missing.

---

### 6. Discord Message Template

**V2 Has:**
- Full template editor with variables
- Available variables:
  - `{home_team}`, `{away_team}`
  - `{home_score}`, `{away_score}`
  - `{current_lead}`, `{quarter}`
  - `{home_spread}`, `{away_spread}`
  - `{home_ml}`, `{away_ml}`
  - `{total}`, `{game_time}`
- **Live Preview** showing how message will render
- Syntax highlighting

**V3 Current:**
- Hardcoded Discord message format
- No user customization
- No template variables

**Gap:** No template builder. Discord messages are code-defined.

---

## Type System Changes Required

### Current Types (types/index.ts)

```typescript
export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: number | string | boolean;
  value2?: number | string;
}

export interface StrategyTrigger {
  id: string;
  strategyId: string;
  name: string;
  conditions: Condition[];
  order: number;
  entryOrClose: 'entry' | 'close';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerMode: 'sequential' | 'parallel';
  isActive: boolean;
  triggers: StrategyTrigger[];
  createdAt: string;
  updatedAt: string;
}
```

### Required Type Additions

```typescript
// New condition field categories
export interface ConditionFieldCategory {
  name: string;
  fields: ConditionField[];
}

export interface ConditionField {
  value: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  category: string;
}

// Rules system
export interface StrategyRules {
  firstHalfOnly: boolean;
  secondHalfOnly: boolean;
  excludeOvertime: boolean;
  specificQuarter?: 1 | 2 | 3 | 4;
  stopAtTime?: number; // minutes
  minimumCombinedScore?: number;
}

// Win requirements for backtesting
export type WinRequirement =
  | { type: 'none' }
  | { type: 'leading_team_wins' }
  | { type: 'home_team_wins' }
  | { type: 'away_team_wins' }
  | { type: 'final_lead_gte'; value: number };

// Discord template
export interface DiscordTemplate {
  template: string;
  variables: string[];
}

// Enhanced Strategy
export interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerMode: 'sequential' | 'parallel';
  isActive: boolean;

  // NEW: Separate entry/close triggers
  entryTriggers: StrategyTrigger[];
  closeTriggers: StrategyTrigger[];
  hasAdvancedClose: boolean;

  // NEW: Rules
  rules: StrategyRules;

  // NEW: Win requirement
  winRequirement: WinRequirement;

  // NEW: Discord template
  discordTemplate: DiscordTemplate;

  createdAt: string;
  updatedAt: string;
}
```

---

## Airtable Schema Changes

### Current Strategies Table Fields
- Name
- Description
- Trigger Mode
- Is Active

### Required New Fields
- Rules (JSON string)
- Win Requirement Type
- Win Requirement Value
- Discord Template
- Has Advanced Close (checkbox)

### Current Triggers Table Fields
- Name
- Strategy (link)
- Conditions (JSON string)
- Order
- Entry Or Close

### Required Changes
- No changes needed (entry/close separation is UI-only)

---

## Implementation Plan

### Phase 1: Enhanced Condition Fields (1-2 hours)
1. Create comprehensive `CONDITION_FIELDS` array with all 60+ fields
2. Organize by category for dropdown grouping
3. Update condition selector UI with grouped options

### Phase 2: Separate Entry/Close UI (1 hour)
1. Split strategies page into Entry Conditions section and Close Conditions section
2. Add "Advanced Close Conditions" toggle
3. Update form state management

### Phase 3: Rules Section (1-2 hours)
1. Add Rules accordion/section to strategy form
2. Implement toggle controls for First Half Only, Second Half Only, Exclude Overtime
3. Add Custom Rules sub-section with inputs

### Phase 4: Win Requirements (1 hour)
1. Add Win Requirements section
2. Radio button selection for requirement type
3. Conditional input for "Final lead ≥" value

### Phase 5: Discord Template Builder (2-3 hours)
1. Create template editor component with syntax highlighting
2. Add variable insertion buttons
3. Implement live preview renderer
4. Save template to Airtable

### Phase 6: AI Discovery (3-4 hours)
1. Create pattern analysis algorithm
2. Query historical games from Airtable
3. Identify correlations (e.g., "When halftime lead > 8, home team wins 72% of time")
4. Present discovered patterns with confidence scores
5. "Create Strategy from Pattern" button

### Phase 7: AI Builder (2-3 hours)
1. Integrate with Claude API (or use prompt-based approach)
2. Parse natural language descriptions
3. Generate condition configurations
4. Preview generated triggers before saving

---

## UI Component Structure

```
app/strategies/page.tsx
├── StrategyBuilderTabs
│   ├── ManualBuilder
│   │   ├── BasicInfo (Name, Description)
│   │   ├── EntryConditions
│   │   │   └── ConditionEditor (grouped fields)
│   │   ├── CloseConditions (collapsible)
│   │   │   └── ConditionEditor
│   │   ├── RulesSection
│   │   │   ├── HalfToggles
│   │   │   └── CustomRules
│   │   ├── WinRequirements
│   │   └── DiscordTemplate
│   │       ├── TemplateEditor
│   │       ├── VariableButtons
│   │       └── LivePreview
│   ├── AIBuilder
│   │   ├── NaturalLanguageInput
│   │   ├── GeneratedPreview
│   │   └── ConfirmButton
│   └── AIDiscovery
│       ├── AnalysisFilters
│       ├── DiscoveredPatterns
│       └── CreateFromPattern
└── StrategyList
    └── StrategyCard (active/inactive toggle)
```

---

## Estimated Total Time

| Phase | Time |
|-------|------|
| Phase 1: Condition Fields | 1-2 hours |
| Phase 2: Entry/Close UI | 1 hour |
| Phase 3: Rules Section | 1-2 hours |
| Phase 4: Win Requirements | 1 hour |
| Phase 5: Discord Template | 2-3 hours |
| Phase 6: AI Discovery | 3-4 hours |
| Phase 7: AI Builder | 2-3 hours |
| **Total** | **11-16 hours** |

---

## Recommended Implementation Order

1. **Phase 1-4 first** (core Manual Builder features) - ~4-6 hours
2. **Phase 5** (Discord templates) - ~2-3 hours
3. **Phase 6-7 last** (AI features) - ~5-7 hours

This order allows you to have a fully functional V2-equivalent Manual Builder quickly, then add the polish (Discord) and AI features.

---

## Conflicts with Current Implementation

| Current V3 | Conflict | Resolution |
|------------|----------|------------|
| Single `triggers[]` array | V2 separates entry/close | Split into `entryTriggers[]` and `closeTriggers[]` |
| 6 condition fields | V2 has 60+ | Expand `CONDITION_FIELDS` constant |
| No rules | V2 has rules | Add `rules` object to Strategy type |
| No win requirements | V2 has win requirements | Add `winRequirement` field |
| Hardcoded Discord format | V2 has templates | Add `discordTemplate` field |
| No AI features | V2 has AI Builder/Discovery | Add new builder modes with AI integration |

---

## Next Steps

1. Review this analysis
2. Confirm priority order (Manual features first vs AI features first)
3. Begin Phase 1 implementation with expanded condition fields
