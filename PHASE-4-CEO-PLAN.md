# MAI Bets V3 - Phase 4 CEO Execution Plan

**Document Version:** 1.0
**Created:** January 28, 2026
**Status:** READY FOR EXECUTION

---

## Executive Summary

Phases 1-3 have established a complete betting signal platform with live game tracking, automated signal generation, Discord notifications, and analytics dashboards. Phase 4 focuses on **Advanced Automation & Monetization** - adding bankroll management, multi-user support, advanced notifications, and export capabilities.

---

## Phases 1-3 Verification Status

### Phase 1: Core Infrastructure ✅ COMPLETE

| Component | Status | Verification |
|-----------|--------|--------------|
| Next.js App Framework | ✅ | Running on Vercel |
| Airtable Integration | ✅ | REST API working (SDK bug fixed) |
| Game Store (in-memory) | ✅ | Live game state management |
| Type System | ✅ | Full TypeScript coverage |
| Tailwind UI | ✅ | Responsive design |

### Phase 2: Live Tracking & Signals ✅ COMPLETE

| Component | Status | Verification |
|-----------|--------|--------------|
| Webhook Handler | ✅ | `/api/webhook/game-update` |
| Live Game Dashboard | ✅ | Real-time updates |
| Two-Stage Signal System | ✅ | Entry → Close lifecycle |
| Strategy Builder | ✅ | 60+ conditions, AI builder |
| Discord Notifications | ✅ | Multi-template alerts |
| Historical Game Archival | ✅ | Auto-save on game end (REST API) |
| Active Game Cleanup | ✅ | Removes finished games |

### Phase 3: Analytics & Intelligence ✅ COMPLETE

| Component | Status | Verification |
|-----------|--------|--------------|
| Analytics Dashboard | ✅ | `/analytics` page live |
| Win Rate/ROI Calculations | ✅ | Displayed on dashboard |
| Strategy Performance Badges | ✅ | W-L record and ROI on cards |
| Signal Volume Charts | ✅ | Daily signal tracking |
| Player Service Backend | ✅ | REST API migrated |
| Player Leaderboard UI | ✅ | `/players` page |

---

## 🚨 CRITICAL: Players Table Setup Required

**The Players table must be created in Airtable with the exact schema below for player tracking to work.**

### Players Table Schema

| Field Name | Type | Description |
|------------|------|-------------|
| **Name** | Single line text | Player name (primary field, e.g., "KJMR") |
| **Team Name** | Single line text | e.g., "OKC Thunder" |
| **Full Team Name** | Single line text | e.g., "OKC Thunder (KJMR)" |
| **Games Played** | Number | Total games |
| **Wins** | Number | Total wins |
| **Losses** | Number | Total losses |
| **Win Rate** | Number | Win percentage |
| **Total Points For** | Number | Cumulative points scored |
| **Total Points Against** | Number | Cumulative points allowed |
| **Avg Points For** | Number | PPG |
| **Avg Points Against** | Number | Opponent PPG |
| **Avg Margin** | Number | Average win/loss margin |
| **Spread Wins** | Number | ATS wins |
| **Spread Losses** | Number | ATS losses |
| **Spread Pushes** | Number | ATS pushes |
| **Total Overs** | Number | Over hits |
| **Total Unders** | Number | Under hits |
| **Total Pushes** | Number | Total pushes |
| **ATS Win Rate** | Number | ATS percentage |
| **Over Rate** | Number | Over percentage |
| **Recent Form** | Long text | JSON array of last 10 W/L |
| **Streak Type** | Single select | Options: `W`, `L` |
| **Streak Count** | Number | Current streak length |
| **Last Game Date** | Date | Most recent game |
| **Is Active** | Checkbox | Currently playing |

### Verification Steps:

1. Create the "Players" table in your Airtable base
2. Add all fields with exact names (case-sensitive)
3. Set Streak Type single select options: `W` and `L`
4. Visit: `https://your-app.vercel.app/api/test-players`
5. Confirm all tests pass

---

## Complete Airtable Tables Reference

| Table | Status | Purpose |
|-------|--------|---------|
| **Active Games** | ✅ Exists | Live game state |
| **Historical Games** | ✅ Exists | Completed games archive |
| **Signals** | ✅ Exists | Signal lifecycle tracking |
| **Strategies** | ✅ Exists | Strategy definitions |
| **Triggers** | ✅ Exists | Linked trigger conditions |
| **Players** | ⚠️ CREATE | Player statistics |

---

## Verification Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/verify` | Full system health check |
| `/api/test-players` | Players table verification |
| `/api/test-historical` | Historical Games verification |

---

## Phase 4: Advanced Automation & Monetization

### Phase 4A: Bankroll Management (Priority: HIGH)

**Objective:** Track betting performance with actual monetary values.

| # | Task | Priority | Complexity | Status |
|---|------|----------|------------|--------|
| 4A.1 | Create Bankroll table in Airtable | High | Low | ⬜ |
| 4A.2 | Add unit size configuration | High | Low | ⬜ |
| 4A.3 | Track P/L per signal | High | Medium | ⬜ |
| 4A.4 | Daily/weekly/monthly P/L summaries | High | Medium | ⬜ |
| 4A.5 | Bankroll growth chart | Medium | Medium | ⬜ |
| 4A.6 | Kelly criterion bet sizing | Low | High | ⬜ |

**Bankroll Table Schema:**

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single line text | Transaction ID |
| Date | Date | Transaction date |
| Type | Single select | bet, win, loss, push, deposit, withdrawal |
| Amount | Currency | Dollar amount |
| Signal ID | Link to Signals | Related signal |
| Running Balance | Number | Balance after transaction |
| Notes | Long text | Optional notes |

### Phase 4B: Multi-User Support (Priority: MEDIUM)

**Objective:** Support multiple users with their own strategies and bankrolls.

| # | Task | Priority | Complexity | Status |
|---|------|----------|------------|--------|
| 4B.1 | Add user authentication (NextAuth) | High | High | ⬜ |
| 4B.2 | Link strategies to users | High | Medium | ⬜ |
| 4B.3 | User-specific dashboards | High | Medium | ⬜ |
| 4B.4 | Shared vs private strategies | Medium | Medium | ⬜ |
| 4B.5 | User preferences storage | Low | Low | ⬜ |

### Phase 4C: Advanced Notifications (Priority: MEDIUM)

**Objective:** Expand notification channels beyond Discord.

| # | Task | Priority | Complexity | Status |
|---|------|----------|------------|--------|
| 4C.1 | SMS notifications (Twilio) | High | Medium | ⬜ |
| 4C.2 | Email alerts (SendGrid/Resend) | Medium | Medium | ⬜ |
| 4C.3 | Push notifications (web) | Low | High | ⬜ |
| 4C.4 | Notification preferences per user | Medium | Low | ⬜ |
| 4C.5 | Quiet hours configuration | Low | Low | ⬜ |

### Phase 4D: Export & Reporting (Priority: LOW)

**Objective:** Allow data export for external analysis.

| # | Task | Priority | Complexity | Status |
|---|------|----------|------------|--------|
| 4D.1 | Export signals to CSV | High | Low | ⬜ |
| 4D.2 | Export historical games to CSV | Medium | Low | ⬜ |
| 4D.3 | Generate PDF reports | Medium | High | ⬜ |
| 4D.4 | Scheduled email reports | Low | Medium | ⬜ |
| 4D.5 | API access for external tools | Low | Medium | ⬜ |

### Phase 4E: Multiple Data Providers (Priority: LOW)

**Objective:** Support additional sports/leagues beyond NBA2K.

| # | Task | Priority | Complexity | Status |
|---|------|----------|------------|--------|
| 4E.1 | Abstract game provider interface | High | High | ⬜ |
| 4E.2 | Support additional NBA2K sources | Medium | Medium | ⬜ |
| 4E.3 | Add esports providers | Low | High | ⬜ |
| 4E.4 | Traditional sports integration | Low | High | ⬜ |

---

## Phase 4 Execution Timeline

### Week 1-2: Foundation & Bankroll

**Days 1-3:**
- [ ] Create Players table in Airtable (manual)
- [ ] Run `/api/verify` to confirm all systems
- [ ] Run `/api/test-players` to confirm player tracking
- [ ] Verify end-to-end flow with live game

**Days 4-7:**
- [ ] Design Bankroll table schema
- [ ] Create Bankroll table in Airtable
- [ ] Build bankroll service
- [ ] Add unit size configuration

**Days 8-14:**
- [ ] Implement P/L tracking on signal resolution
- [ ] Build bankroll dashboard UI
- [ ] Add bankroll growth chart
- [ ] Test with simulated bets

### Week 3-4: Notifications & Polish

**Days 15-21:**
- [ ] Integrate Twilio for SMS
- [ ] Build notification preferences UI
- [ ] Add email integration (optional)
- [ ] Test notification reliability

**Days 22-28:**
- [ ] CSV export functionality
- [ ] Performance optimizations
- [ ] Mobile responsiveness audit
- [ ] Documentation updates

---

## Success Metrics for Phase 4

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bankroll tracking accuracy | 100% | All bets logged correctly |
| SMS delivery rate | >95% | Twilio dashboard |
| Export functionality | Working | CSV downloads successfully |
| Page load time | <2s | Vercel analytics |
| System uptime | >99% | Vercel status |

---

## Technical Requirements

### New Dependencies (Phase 4)

```json
{
  "next-auth": "^4.x",      // Authentication (4B)
  "twilio": "^4.x",          // SMS notifications (4C)
  "@sendgrid/mail": "^7.x",  // Email notifications (4C)
  "papaparse": "^5.x",       // CSV export (4D)
  "jspdf": "^2.x"            // PDF reports (4D)
}
```

### New Environment Variables

```env
# Phase 4B - Authentication
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app

# Phase 4C - Notifications
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your-key
```

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SMS costs escalate | Medium | Medium | Rate limiting, user caps |
| Auth complexity | High | Medium | Use NextAuth templates |
| Multi-user data isolation | High | Low | Strict filtering by userId |
| Export performance | Low | Medium | Pagination, background jobs |

---

## Immediate Next Steps

1. **CREATE PLAYERS TABLE** in Airtable using schema above
2. Run verification at `/api/test-players`
3. Run full system check at `/api/verify`
4. Test with a live game to verify end-to-end flow
5. Begin Phase 4A.1 (Bankroll table design)

---

## Quick Reference: All Endpoints

### Pages
- `/` - Live Games Dashboard
- `/signals` - Signal Tracking
- `/strategies` - Strategy Builder
- `/players` - Player Leaderboard
- `/analytics` - Performance Analytics
- `/settings` - Configuration

### API Endpoints
- `POST /api/webhook/game-update` - Receive game data
- `GET /api/verify` - System health check
- `GET /api/test-players` - Players table test
- `GET /api/test-historical` - Historical Games test
- `GET /api/signals` - List signals
- `GET /api/strategies` - List strategies
- `GET /api/players` - List players
- `GET /api/analytics` - Analytics data
- `POST /api/discord/test` - Test Discord webhook

---

**Document End**

*Phase 4 builds on the solid foundation of Phases 1-3 to add professional-grade features for bankroll management, multi-user support, and advanced notifications. The modular approach allows each feature to be developed and deployed independently.*
