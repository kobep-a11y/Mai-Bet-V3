# MAI Bets V3 - Airtable Schema Setup

This document describes how to set up your Airtable base for MAI Bets V3.

## Quick Start

1. **Create a new Airtable Base** called "MAI Bets V3"
2. **Create the 4 tables** described below
3. **Copy your Base ID** from the URL (starts with `app`)
4. **Add to your `.env.local`**:
   ```
   AIRTABLE_API_KEY=your_api_key_here
   AIRTABLE_BASE_ID=appXXXXXXXXXXXXX
   ```

---

## Table 1: Strategies

Stores your betting strategies configuration.

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| **Name** | Single line text | Strategy name (e.g., "Big Lead Fade") |
| **Description** | Long text | Detailed description of the strategy |
| **Trigger Mode** | Single select | Options: `sequential`, `parallel` |
| **Is Active** | Checkbox | Enable/disable the strategy |

### Single Select Options for "Trigger Mode":
- `sequential` - Triggers must fire in order
- `parallel` - Any trigger can fire independently

---

## Table 2: Triggers

Stores individual triggers linked to strategies.

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| **Name** | Single line text | Trigger name (e.g., "Entry at +10 Lead") |
| **Strategy ID** | Link to Strategies | Links to parent strategy |
| **Order Index** | Number | Order for sequential triggers (1, 2, 3...) |
| **Entry Conditions** | Long text | JSON array of conditions (see below) |
| **Close Conditions** | Long text | JSON array of conditions (see below) |
| **Win Requirement** | Single select | How to determine win/loss |
| **Is Active** | Checkbox | Enable/disable the trigger |

### Single Select Options for "Win Requirement":
- `team_wins` - Team must win the game
- `team_covers_spread` - Team must cover the spread
- `lead_maintained` - Lead maintained until close
- `total_over` - Game total goes over
- `total_under` - Game total goes under

### Condition JSON Format

Entry and Close Conditions use this JSON structure:

```json
[
  {
    "field": "current_lead",
    "operator": "greater_than_or_equals",
    "value": 10
  },
  {
    "field": "quarter",
    "operator": "equals",
    "value": 3
  }
]
```

#### Available Fields:
- `current_lead` - Current point lead for the team
- `halftime_lead` - Lead at halftime
- `quarter` - Current quarter (1-4)
- `spread_vs_lead` - How much lead exceeds spread
- `moneyline_home` - Home team moneyline
- `moneyline_away` - Away team moneyline
- `total_score` - Combined score
- `home_score` - Home team score
- `away_score` - Away team score

#### Available Operators:
- `equals` - Exactly equals value
- `not_equals` - Does not equal value
- `greater_than` - Greater than value
- `less_than` - Less than value
- `greater_than_or_equals` - Greater than or equal to
- `less_than_or_equals` - Less than or equal to
- `between` - Between value and value2
- `not_between` - Outside value and value2

#### Example: Entry when lead is 10+ in Q3

```json
[
  {"field": "current_lead", "operator": "greater_than_or_equals", "value": 10},
  {"field": "quarter", "operator": "equals", "value": 3}
]
```

#### Example: Close when lead drops below 5 or Q4 ends

```json
[
  {"field": "current_lead", "operator": "less_than", "value": 5}
]
```

---

## Table 3: Signals

Stores generated signals when triggers fire. **This table is auto-populated by the system.**

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| **Game ID** | Single line text | Event ID from webhook |
| **Strategy ID** | Link to Strategies | Which strategy triggered |
| **Trigger ID** | Link to Triggers | Which trigger fired |
| **Team** | Single select | `home` or `away` |
| **Entry Quarter** | Number | Quarter when signal entered |
| **Entry Lead** | Number | Lead at entry |
| **Entry Spread** | Number | Spread at entry |
| **Entry Moneyline** | Number | Moneyline at entry |
| **Entry Time** | Date & Time | When signal was created |
| **Close Quarter** | Number | Quarter when signal closed |
| **Close Lead** | Number | Lead at close |
| **Close Time** | Date & Time | When signal closed |
| **Status** | Single select | Signal status |
| **Result** | Single select | Win/loss result |
| **Notes** | Long text | Any additional notes |
| **Discord Sent** | Checkbox | Was Discord alert sent |
| **SMS Sent** | Checkbox | Was SMS alert sent |

### Single Select Options for "Team":
- `home`
- `away`

### Single Select Options for "Status":
- `pending`
- `active`
- `won`
- `lost`
- `closed`

### Single Select Options for "Result":
- `win`
- `loss`
- `push`

---

## Table 4: Historical Games

Stores completed game data for backtesting. **Auto-populated when games finish.**

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| **Event ID** | Single line text | Unique game identifier |
| **League** | Single line text | League name (NBA2K, etc.) |
| **Home Team** | Single line text | Home team name |
| **Away Team** | Single line text | Away team name |
| **Final Home Score** | Number | Final home team score |
| **Final Away Score** | Number | Final away team score |
| **Halftime Home Score** | Number | Home score at halftime |
| **Halftime Away Score** | Number | Away score at halftime |
| **Opening Spread Home** | Number | Opening spread for home team |
| **Opening ML Home** | Number | Opening moneyline home |
| **Opening ML Away** | Number | Opening moneyline away |
| **Opening Total** | Number | Opening over/under line |
| **Game Date** | Date | Date of the game |

---

## Example Strategy Setup

### Strategy: "Big Lead Fade"
Bet against teams with large leads in the 3rd quarter.

**Strategies Table:**
| Name | Description | Trigger Mode | Is Active |
|------|-------------|--------------|-----------|
| Big Lead Fade | Fade teams up 10+ in Q3 | sequential | ✓ |

**Triggers Table:**
| Name | Strategy ID | Order Index | Entry Conditions | Close Conditions | Win Requirement | Is Active |
|------|-------------|-------------|------------------|------------------|-----------------|-----------|
| Q3 Entry | Big Lead Fade | 1 | `[{"field":"current_lead","operator":"greater_than_or_equals","value":10},{"field":"quarter","operator":"equals","value":3}]` | `[{"field":"quarter","operator":"equals","value":4}]` | team_covers_spread | ✓ |

---

## Getting Your Credentials

### Airtable API Key
1. Go to https://airtable.com/account
2. Click "Generate API key" or use an existing one
3. Copy the key (starts with `pat` or `key`)

### Airtable Base ID
1. Go to https://airtable.com/api
2. Select your "MAI Bets V3" base
3. The Base ID is in the URL: `https://airtable.com/appXXXXXXXXXXXXX/api/docs`
4. Copy the part starting with `app`

---

## Troubleshooting

### "Strategy not found" or empty strategies
- Check that your Strategies table has records with "Is Active" checked
- Verify field names match exactly (case-sensitive)
- Test Airtable connection in Settings page

### Signals not being created
- Ensure Triggers are linked to Strategies
- Check Entry Conditions JSON is valid
- Verify triggers have "Is Active" checked

### Discord alerts not sending
- Test Discord webhook in Settings page
- Check DISCORD_WEBHOOK_URL in environment variables
- Ensure webhook URL is complete (includes token)

---

## Need Help?

Check the Settings page in MAI Bets V3 to test your Airtable and Discord connections.
