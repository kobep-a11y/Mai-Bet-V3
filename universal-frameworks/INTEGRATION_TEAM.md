# Integration Team — External Services

## Role
Connect and manage all external service integrations: Google Calendar, Twilio SMS, OAuth flows.

## Tech Stack
- Google Calendar API (googleapis)
- Twilio API
- OAuth 2.0
- NextAuth.js

## Current Phase: 1 — Foundation

---

## Service Overview

| Service | Purpose | Phase |
|---------|---------|-------|
| Google Calendar | Read/write calendar events | 1-3 |
| Twilio | SMS notifications | 2 |
| Notion | Database (handled by Database Team) | 1 |

---

## Active Tasks

### INT-001: Set Up Google Calendar OAuth
**Priority:** P1
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Configure Google OAuth to request Calendar read/write permissions.

#### Steps
1. Create Google Cloud Project (or use existing)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs
5. Update NextAuth configuration

#### OAuth Scopes Required
```
openid
email
profile
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
```

#### NextAuth Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

#### Acceptance Criteria
- [ ] Google Cloud project configured
- [ ] Calendar API enabled
- [ ] OAuth credentials created
- [ ] Redirect URIs set (localhost + production)
- [ ] NextAuth updated with new scopes
- [ ] Can sign in and get calendar access token
- [ ] Token stored in session

#### Output
- Updated NextAuth config
- Environment variables documented
- Test: successful OAuth flow

---

### INT-002: Build Calendar Fetch Service
**Priority:** P1
**Status:** ⏸️ Blocked
**Dependencies:** INT-001

#### Objective
Create service to read user's calendar events.

#### Functions Required
```typescript
// lib/google-calendar.ts

// Get events for a specific day
async function getDayEvents(
  accessToken: string,
  date: Date
): Promise<CalendarEvent[]>

// Get events for a date range (week view)
async function getWeekEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]>

// Calculate available time blocks
function getAvailableSlots(
  events: CalendarEvent[],
  workingHours: { start: number, end: number }
): TimeSlot[]

// Generate calendar context summary for agent
function generateCalendarContext(events: CalendarEvent[]): string
```

#### CalendarEvent Type
```typescript
interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: string // ISO datetime
  end: string   // ISO datetime
  allDay: boolean
  location?: string
  meetingLink?: string
}

interface TimeSlot {
  start: string
  end: string
  durationMinutes: number
}
```

#### Acceptance Criteria
- [ ] Can fetch today's events
- [ ] Can fetch week's events
- [ ] Handles all-day events correctly
- [ ] Calculates available slots
- [ ] Generates readable context summary
- [ ] Handles token refresh (via NextAuth)
- [ ] Error handling for expired tokens

#### Output
- `lib/google-calendar.ts` (updated)
- API route: `GET /api/calendar`
- API route: `GET /api/calendar/available`

---

### INT-003: Set Up Twilio Account Structure
**Priority:** P1
**Status:** 🔵 Ready to Start
**Dependencies:** None

#### Objective
Prepare Twilio infrastructure for SMS notifications.

#### Steps
1. Create Twilio account (or use existing)
2. Get Account SID and Auth Token
3. Purchase phone number
4. Configure messaging service (optional but recommended)
5. Set up webhook URL for incoming messages

#### Configuration Required
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxx (optional)
```

#### Acceptance Criteria
- [ ] Twilio account active
- [ ] Phone number purchased
- [ ] Can send test SMS via API
- [ ] Webhook endpoint planned
- [ ] Environment variables documented

#### Output
- Twilio credentials in env
- Test SMS sent successfully
- Documentation for webhook setup

---

### INT-004: Build Calendar Event Creation Service
**Priority:** P2
**Status:** ⏸️ Blocked
**Dependencies:** INT-002

#### Objective
Create service to add task blocks to user's calendar.

#### Functions Required
```typescript
// Create a calendar event for a task
async function createTaskEvent(
  accessToken: string,
  task: Task,
  scheduledTime: { start: Date, end: Date }
): Promise<string> // Returns event ID

// Update an existing task event
async function updateTaskEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<void>

// Delete a task event
async function deleteTaskEvent(
  accessToken: string,
  eventId: string
): Promise<void>
```

#### Event Format
```
Title: [Task Name]
Description:
  Priority: [Priority Level]
  Income Stream: [Stream Name]
  Revenue Potential: [Type]
  ---
  Created by Executive Agent System

Color: Based on priority
  - Revenue: Green (#10B981)
  - Compounding: Pink
  - Commitment: Orange
  - Operations: Red
  - Optional: Yellow
```

#### Acceptance Criteria
- [ ] Can create event from task
- [ ] Event includes task metadata
- [ ] Can update event times
- [ ] Can delete event
- [ ] Stores event ID on task (via Notion)
- [ ] Handles conflicts gracefully

#### Output
- Updated `lib/google-calendar.ts`
- API route: `POST /api/calendar/events`
- API route: `PATCH /api/calendar/events/[id]`
- API route: `DELETE /api/calendar/events/[id]`

---

## Phase 2 Tasks (Preview)

### INT-005: Build SMS Send Service
**Priority:** P0 (Phase 2)
**Status:** 📋 Planned

```typescript
async function sendCheckInReminder(
  phoneNumber: string,
  checkInUrl: string
): Promise<void>

async function sendWeeklySummary(
  phoneNumber: string,
  summary: WeeklySummary
): Promise<void>
```

### INT-006: Build SMS Webhook Handler
**Priority:** P0 (Phase 2)
**Status:** 📋 Planned

```
POST /api/sms/webhook
- Receive incoming SMS
- Parse commands (if any)
- Log delivery status
```

---

## Completed Tasks

| ID | Task | Completed | Output |
|----|------|-----------|--------|
| - | - | - | - |

---

## Service Credentials Reference

| Service | Credential | Status |
|---------|------------|--------|
| Google | GOOGLE_CLIENT_ID | ✅ Have |
| Google | GOOGLE_CLIENT_SECRET | ⏳ Need |
| Twilio | TWILIO_ACCOUNT_SID | ⏳ Need |
| Twilio | TWILIO_AUTH_TOKEN | ⏳ Need |
| Twilio | TWILIO_PHONE_NUMBER | ⏳ Need |

---

## Error Handling

### Google Calendar Errors
| Error | Cause | Resolution |
|-------|-------|------------|
| 401 | Token expired | Redirect to re-auth |
| 403 | Insufficient scope | Re-request permissions |
| 404 | Event not found | Clear event ID from task |
| 429 | Rate limited | Exponential backoff |

### Twilio Errors
| Error | Cause | Resolution |
|-------|-------|------------|
| 21211 | Invalid phone | Validate before saving |
| 21608 | Unverified number | Verify in Twilio |
| 21614 | Invalid to number | Format validation |

---

## Notes

_Space for integration-specific notes, API quirks, rate limits_

