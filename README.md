# MAI Bets V3

Real-time sports betting signal system with strategy automation.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   b365api   │────▶│       N8N        │────▶│  MAI Bets   │
│  (Source)   │     │   (Automation)   │     │  (Vercel)   │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
             ┌─────────────┐              ┌─────────────────┐              ┌─────────────┐
             │  In-Memory  │              │    Airtable     │              │   Discord   │
             │ Live Games  │              │  (Strategies,   │              │  (Alerts)   │
             │  (Real-time)│              │    Signals)     │              │             │
             └─────────────┘              └─────────────────┘              └─────────────┘
```

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (connected to GitHub)
- Airtable account with API key
- Discord webhook URL

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
cd mai-bets-v3
git init
git add .
git commit -m "Initial commit - MAI Bets V3"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/mai-bets-v3.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your `mai-bets-v3` repository
4. **Add Environment Variables** (from `.env.example`):
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `DISCORD_WEBHOOK_URL`
   - `WEBHOOK_SECRET` (optional)
5. Click "Deploy"

### Step 3: Set Up Airtable

Follow the **AIRTABLE-SCHEMA.md** guide to create your tables:
1. Create "MAI Bets V3" base
2. Create 4 tables: Strategies, Triggers, Signals, Historical Games
3. Copy your Base ID from the URL

### Step 4: Configure N8N

Update your N8N workflow to send webhooks to:
```
POST https://your-app.vercel.app/api/webhook/game-update
```

**Payload format:**
```json
{
  "event_id": "12345",
  "league": "NBA2K",
  "home_team": "Lakers",
  "away_team": "Celtics",
  "home_score": 45,
  "away_score": 42,
  "quarter": 2,
  "time_remaining": "5:30",
  "status": "live",
  "odds": {
    "spread_home": -3.5,
    "spread_away": 3.5,
    "moneyline_home": -150,
    "moneyline_away": 130,
    "total_line": 185.5
  }
}
```

If using `WEBHOOK_SECRET`, add header:
```
Authorization: Bearer your_secret_token
```

---

## 📁 Project Structure

```
mai-bets-v3/
├── app/
│   ├── api/
│   │   ├── games/route.ts          # Live games API
│   │   ├── signals/route.ts        # Signals API
│   │   ├── strategies/route.ts     # Strategies API
│   │   └── webhook/
│   │       ├── game-update/route.ts  # N8N webhook
│   │       └── test-discord/route.ts # Discord test
│   ├── analytics/page.tsx          # Analytics (Phase 2)
│   ├── settings/page.tsx           # Settings & testing
│   ├── signals/page.tsx            # Signals dashboard
│   ├── strategies/page.tsx         # Strategies view
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Live Games dashboard
├── components/
│   ├── GameCard.tsx
│   └── Navigation.tsx
├── lib/
│   ├── airtable.ts                 # Airtable integration
│   ├── discord.ts                  # Discord webhooks
│   ├── game-store.ts               # In-memory game store
│   └── strategy-engine.ts          # Strategy evaluation
├── types/
│   └── index.ts                    # TypeScript types
├── .env.example
├── AIRTABLE-SCHEMA.md              # Airtable setup guide
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

### Webhook (for N8N)
- `POST /api/webhook/game-update` - Single game update
- `PUT /api/webhook/game-update` - Batch update multiple games
- `GET /api/webhook/game-update` - Health check

### Games
- `GET /api/games` - All games
- `GET /api/games?filter=live` - Live games only
- `GET /api/games?action=stats` - Game statistics
- `GET /api/games?action=demo` - Add demo game

### Strategies
- `GET /api/strategies` - All active strategies
- `GET /api/strategies?id=xxx` - Specific strategy
- `GET /api/strategies?action=test` - Test Airtable connection

### Signals
- `GET /api/signals` - Active signals
- `GET /api/signals?filter=today` - Today's signals
- `GET /api/signals?start=DATE&end=DATE` - Date range

### Discord
- `POST /api/webhook/test-discord` - Send test message

---

## 🎯 Strategy Configuration

Strategies are configured in Airtable. See **AIRTABLE-SCHEMA.md** for details.

### Trigger Modes
- **Sequential**: Triggers fire in order (1 → 2 → 3)
- **Parallel**: Any trigger can fire independently

### Condition Fields
- `current_lead` - Current point differential
- `halftime_lead` - Lead at halftime
- `quarter` - Current quarter (1-4)
- `spread_vs_lead` - Lead minus spread
- `moneyline_home/away` - Current moneylines
- `total_score` - Combined score

### Win Requirements
- `team_wins` - Team wins outright
- `team_covers_spread` - Covers the spread
- `lead_maintained` - Lead held until close

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_API_KEY` | Yes | Airtable API key |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID |
| `DISCORD_WEBHOOK_URL` | Yes | Discord webhook URL |
| `WEBHOOK_SECRET` | No | Auth token for N8N |

---

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Live games dashboard
- [x] Webhook endpoint for N8N
- [x] Airtable integration
- [x] Discord alerts
- [x] Strategy evaluation engine

### Phase 2 (Next)
- [ ] Analytics dashboard
- [ ] Backtesting against historical data
- [ ] Strategy builder UI

### Phase 3 (Future)
- [ ] SMS alerts via Twilio
- [ ] Mobile-responsive enhancements
- [ ] API rate limiting

---

## 🆘 Troubleshooting

### Games not appearing
1. Check N8N is sending to correct webhook URL
2. Verify webhook payload format
3. Test with "Add Demo" button

### Strategies not loading
1. Test Airtable connection in Settings
2. Verify table names match exactly
3. Check "Is Active" is checked

### Discord not working
1. Test Discord in Settings
2. Verify webhook URL is complete
3. Check Discord channel permissions

---

## 📄 License

MIT License - Built for MAI Bets

