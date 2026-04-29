# Alcohol Monitoring Shared Package

## What this package is

A shared TypeScript library imported by both the web dashboard
(alcohol-monitoring-web) and the mobile app (alcohol-monitoring-mobile).
Contains all API client functions, TypeScript interfaces, constants, and
utility functions that both apps need. No React or React Native dependencies
— pure TypeScript only so it works in both environments.

This package is the single source of truth for:

- How the apps communicate with the backend API
- TypeScript types for every entity in the system
- Business logic like compliance status calculation and BAC formatting
- Shared constants like event types, roles, and status colors

---

## Tech stack

- **Language**: TypeScript (strict mode, all entity interfaces readonly)
- **Build tool**: tsup — outputs CJS (dist/index.js) + ESM (dist/index.mjs) + declarations (dist/index.d.ts)
- **No framework dependencies** — works with Next.js and React Native
- **Local development**: npm link into web and mobile repos
- **Package name**: @alcohol-monitoring/shared

---

## Project structure

```
src/
  api/
    client.ts         — base fetch wrapper with auth token injection
    subjects.ts       — all GET (read) functions + subject/officer/org writes
    readings.ts       — POST reading (write only)
    events.ts         — POST event + batch (write only)
    auth.ts           — Cognito auth helper functions
  types/
    index.ts          — all TypeScript interfaces and types
  constants/
    index.ts          — event types, roles, device statuses, colors, thresholds
  utils/
    date.ts           — date formatting helpers
    compliance.ts     — status derivation, BAC visibility, reading results
    bac.ts            — BAC formatting and color coding
    map.ts            — GeoJSON conversion for Mapbox (points + trail line)
  index.ts            — barrel export (all public API)
dist/                 — compiled output (gitignored)
```

---

## Backend API

The backend runs at:

- Web: NEXT_PUBLIC_API_URL
- Mobile: EXPO_PUBLIC_API_URL

All protected endpoints require an Authorization: Bearer <token> header
with a valid Cognito JWT. The API client handles this via an injected
getToken function — see src/api/client.ts.

### Endpoints this package calls

**Write — src/api/readings.ts**

- POST /v1/readings → CreateReadingResponse { id: number, recorded_at: string }

**Write — src/api/events.ts**

- POST /v1/events → CreateEventResponse { id: string }
- POST /v1/events/batch → BatchEventResponse { count: number, ids: string[] }

**Read — src/api/subjects.ts**

- GET /v1/subjects/:id/readings?start=&end=&limit= → ReadingsListResponse { readings, count, has_more }
- GET /v1/subjects/:id/readings/latest → Reading | null
- GET /v1/subjects/:id/events?start=&end=&event_type= → EventsListResponse { events, count }
- GET /v1/subjects/:id/summary → SubjectSummary
- GET /v1/officers/:id/subjects → Subject[]
- GET /v1/map/subjects?officer_id= → MapSubject[]

**Management — src/api/subjects.ts**

- POST /v1/subjects → Subject
- POST /v1/officers → Officer
- PATCH /v1/subjects/:id/status → Subject
- GET /v1/orgs/:id/settings → OrgSettings
- PUT /v1/orgs/:id/settings → OrgSettings

---

## TypeScript types

All types are in src/types/index.ts and exported from the package root.
All entity interfaces are readonly. Optional fields use `field?: type`
(not `field: type | null`).

### Literal types

```typescript
Role = "subject" | "officer" | "supervisor" | "org_admin" | "system_admin"
ProgramStatus = "active" | "completed" | "revoked" | "suspended"
DeviceStatus = "in_stock" | "active" | "in_repair" | "decommissioned"
SubjectStatus = "compliant" | "attention" | "violation" | "offline"
GpsFixStatus = "acquired" | "searching" | "lost"
TransmissionPath = "ble" | "wifi" | "cellular"
ReadingResult = "pass" | "fail" | "no_data"
EventType = "tamper_ir_detected" | "tamper_ir_cleared" | "wrist_on" | "wrist_off"
           | "battery_low" | "battery_critical" | "battery_charging" | "battery_full"
           | "device_paired" | "device_unpaired" | "reading_missed"
           | "geofence_enter" | "geofence_exit" | "curfew_violation" | "manual_check_in"
```

### Database entities

- **Organization** — id, name, address?, city?, state?, zip?, phone?, email?, is_active, timestamps
- **Account** — id, cognito_sub, email, role (Role), org_id, first_name, last_name, phone?, is_active, timestamps
- **Officer** — id, account_id, org_id, badge_number?, department?, timestamps
- **Subject** — id, account_id, org_id, program_status (ProgramStatus), enrolled_at, program_end_at?, case_number?, notes?, timestamps
- **OfficerSubjectAssignment** — id, officer_id, subject_id, assigned_at, unassigned_at?, is_active
- **Device** — id, serial_number, model, firmware_version?, org_id, status (DeviceStatus), timestamps
- **DeviceAssignment** — id, device_id, subject_id, assigned_at, unassigned_at?, is_active
- **Reading** — id (number), subjectId, deviceId, bac?, skinTempC?, motionMg?, batteryPercent?, wristOn, gpsLat?, gpsLng?, gpsFixStatus? (GpsFixStatus), gpsAccuracyM?, transmissionPath? (TransmissionPath), recordedAt, receivedAt
- **Event** — id (string), subjectId, deviceId?, eventType (EventType), metadata?, recordedAt, receivedAt
- **OrgSettings** — id, org_id, bac_threshold, reading_interval_mins, wrist_off_alert_mins, geofence_enabled, curfew_enabled, timestamps
- **SubjectAchievement** — id, subject_id, achievement_type, achieved_at, created_at
- **SubjectStreak** — id, subject_id, streak_type, current_count, longest_count, last_updated_at, created_at

### Naming convention: camelCase for Reading and Event

Reading and Event use camelCase field names (subjectId, recordedAt, bac,
batteryPercent, etc.) because these types are consumed directly by the
frontend. All other entity types (Organization, Account, Officer, Subject,
Device, OrgSettings, etc.) and all API payloads/responses use snake_case
to match the backend API contract.

### Important: Subject vs Account split

Subject and Officer do not store name/email/phone directly. Those fields
live on the Account entity. Subject and Officer reference Account via
account_id. Composite types like MapSubject and SubjectSummary include a
`Pick<Account, "first_name" | "last_name" | "email" | "phone">` to provide
display name data alongside the Subject record.

### Composite / view types

**SubjectStatus** — derived from latest reading data:

- "compliant" — BAC below threshold, wrist on, battery > 20%, reading within last hour
- "attention" — missed reading OR battery <= 20% OR wrist off > 15 min
- "violation" — BAC above threshold OR tamper event in last hour
- "offline" — no reading in last 2 hours

**MapSubject** — what the fleet map renders per pin:

- subject: Subject
- account: Pick<Account, "first_name" | "last_name" | "email" | "phone">
- latest_reading: Reading | null
- status: SubjectStatus

**SubjectSummary** — what the subject detail / mobile home screen shows:

- subject + account (same as MapSubject)
- streak: { current, longest }
- latest_reading: Reading | null
- program: { status, enrolled_at, program_end_at?, days_remaining }
- last_7_days: { reading_count, event_count, violation_count, missed_readings }

### API response types

- **CreateReadingResponse** — { id: number, recorded_at: string }
- **CreateEventResponse** — { id: string }
- **BatchEventResponse** — { count: number, ids: string[] }
- **ReadingsListResponse** — { readings: Reading[], count: number, has_more: boolean }
- **EventsListResponse** — { events: Event[], count: number }

### API request / payload types

- **CreateReadingPayload** — subject_id, device_id, ethanol_bac?, skin_temp_c?, motion_mg?, battery_pct?, wrist_on, gps_lat?, gps_lng?, gps_fix_status?, gps_accuracy_m?, transmission_path?, recorded_at
- **CreateEventPayload** — subject_id, device_id?, event_type, metadata?, recorded_at
- **CreateSubjectPayload** — account_id, org_id, case_number?, notes?, program_end_at?
- **CreateOfficerPayload** — account_id, org_id, badge_number?, department?
- **UpdateSubjectStatusPayload** — program_status (ProgramStatus)
- **DateRangeParams** — start?, end?
- **EventFilterParams** — extends DateRangeParams + event_type?

### Error types

- **ValidationErrorDetail** — { field, message }
- **ApiErrorResponse** — { error, details?: ValidationErrorDetail[] }

---

## Constants

All in src/constants/index.ts:

```typescript
EVENT_TYPES — EventType[] of all 15 valid event type strings
SUBJECT_STATUS_COLORS — {
  compliant: "#1D9E75",
  attention: "#BA7517",
  violation: "#E05A38",
  offline:   "#888780"
}
ROLES — {
  SUBJECT: "subject",
  OFFICER: "officer",
  SUPERVISOR: "supervisor",
  ORG_ADMIN: "org_admin",
  SYSTEM_ADMIN: "system_admin"
}
DEVICE_STATUSES — {
  IN_STOCK: "in_stock",
  ACTIVE: "active",
  IN_REPAIR: "in_repair",
  DECOMMISSIONED: "decommissioned"
}
BAC_DEFAULT_THRESHOLD — 0.02
READING_INTERVAL_MINS — 30
WRIST_OFF_ALERT_MINS  — 15
```

---

## API client architecture

src/api/client.ts exports an initializer that accepts a getToken function:

```typescript
initApiClient({
  getToken: () => string | null | Promise<string | null>,
  baseUrl: string,
  onUnauthorized?: () => void
});
```

getToken supports both sync and async — sync for web (localStorage),
async for mobile (SecureStore returns a Promise).

This is called once at app startup — differently in Next.js vs React Native:

Web (Next.js):

```typescript
initApiClient({
  getToken: () => localStorage.getItem("cognito_token"),
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
});
```

Mobile (Expo):

```typescript
initApiClient({
  getToken: () => SecureStore.getItemAsync("cognito_token"),
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});
```

After init, all API functions automatically include the auth header.

### Exported error classes

Callers can import and catch these:

- **ApiError** — { message, statusCode } — thrown for non-OK HTTP responses
- **ValidationError** extends ApiError — { message, fields: ValidationErrorDetail[] } — thrown for 400 with details
- **NetworkError** — { message } — thrown when fetch itself fails (no network, DNS, etc.)

### Error handling by status code

- 401 — calls onUnauthorized callback, throws ApiError("Unauthorized", 401)
- 404 — returns null (not found is not an error)
- 400 — throws ValidationError with field details if present
- 500+ — throws ApiError("An unexpected server error occurred", statusCode). Raw server error messages are never exposed to callers.
- Other non-OK — throws ApiError with the error field from the response body
- 204 — returns null
- Network failure — throws NetworkError

Never catch errors inside the API functions — let callers handle them.

### API functions reference

**src/api/subjects.ts (reads)**

```typescript
getSubjectReadings(subjectId, start?, end?, limit?) → ReadingsListResponse
getLatestReading(subjectId) → Reading | null
getSubjectEvents(subjectId, options?: EventFilterParams) → EventsListResponse
getSubjectSummary(subjectId) → SubjectSummary
getAllSubjectsForOfficer(officerId) → Subject[]
getMapSubjects(officerId) → MapSubject[]
```

**src/api/subjects.ts (writes)**

```typescript
createSubject(payload: CreateSubjectPayload) → Subject
updateSubjectStatus(subjectId, payload: UpdateSubjectStatusPayload) → Subject
createOfficer(payload: CreateOfficerPayload) → Officer
getOrgSettings(orgId) → OrgSettings
updateOrgSettings(orgId, payload) → OrgSettings
```

**src/api/readings.ts**

```typescript
postReading(payload: CreateReadingPayload) → CreateReadingResponse
```

**src/api/events.ts**

```typescript
postEvent(payload: CreateEventPayload) → CreateEventResponse
postEventBatch(events: CreateEventPayload[]) → BatchEventResponse
```

---

## Cognito auth

AWS Cognito user pool in us-west-2. Three app clients:

- alcohol-monitoring-web — web dashboard (no client secret)
- alcohol-monitoring-mobile — mobile app (no client secret)
- alcohol-monitoring-api — backend machine to machine (has secret, not used here)

User pool details live in environment variables — never hardcoded:

- NEXT_PUBLIC_COGNITO_USER_POOL_ID / EXPO_PUBLIC_COGNITO_USER_POOL_ID
- NEXT_PUBLIC_COGNITO_WEB_CLIENT_ID / EXPO_PUBLIC_COGNITO_MOBILE_CLIENT_ID
- NEXT_PUBLIC_COGNITO_REGION / EXPO_PUBLIC_COGNITO_REGION

getCognitoConfig() reads these env vars with fallback between web and mobile
prefixes. The functions call the Cognito Identity Provider API directly via
fetch (no SDK dependency).

### Exported auth functions

```typescript
getCognitoConfig() → { userPoolId, clientId, region }
signIn(username, password) → { AccessToken, IdToken, RefreshToken?, ExpiresIn }
signUp(username, password, email) → { UserConfirmed, UserSub }
confirmSignUp(username, code) → void
refreshToken(refreshTokenValue) → { AccessToken, IdToken, ExpiresIn }
forgotPassword(username) → void
confirmForgotPassword(username, code, newPassword) → void
signOut(accessToken) → void
```

Token storage is the app's responsibility — this package only handles
the Cognito API calls and token retrieval via the injected getToken function.

---

## Utility functions

### src/utils/compliance.ts

```typescript
deriveSubjectStatus(latestReading: Reading | null, recentEvents: Event[]) → SubjectStatus
getReadingResult(reading: Reading) → ReadingResult  // "pass", "fail", or "no_data"
canViewBAC(role: Role) → boolean                    // true only for system_admin
isCompliant(status: SubjectStatus) → boolean
requiresAttention(status: SubjectStatus) → boolean  // true for "attention" or "violation"
```

deriveSubjectStatus is the single source of truth for status — used on the
fleet map, subject list, subject detail, and mobile home screen.

Logic:

```typescript
if (!latestReading) return "offline";
if (age > 2 hours) return "offline";
if (tamper_ir_detected in last hour OR bac > BAC_DEFAULT_THRESHOLD) return "violation";
if (batteryPercent <= 20 OR wristOn === false OR age > 45 min) return "attention";
return "compliant";
```

canViewBAC restricts BAC visibility to system_admin only. All other roles
(including officers) see pass/fail results but not raw BAC values. This is
enforced in the GeoJSON map utils as well.

### src/utils/bac.ts

```typescript
formatBac(value?: number | null) → string         // "0.015" or "--" for null
getBacColor(value?: number | null) → string        // hex color based on threshold
isBacAboveThreshold(value?, threshold?) → boolean  // defaults to BAC_DEFAULT_THRESHOLD
```

### src/utils/map.ts

```typescript
readingsToGeoJSON(readings: Reading[], role: Role) → GeoJSONFeatureCollection<GeoJSONPoint, ReadingPointProperties>
readingsToTrailLine(readings: Reading[]) → GeoJSONFeature<GeoJSONLineString> | null
```

Both functions filter out readings where gpsLat/gpsLng is null or
gpsFixStatus !== "acquired". readingsToGeoJSON omits the bac property
from feature properties unless canViewBAC(role) is true.
readingsToTrailLine sorts by recordedAt ascending and returns null if
fewer than 2 valid GPS points exist.

### src/utils/date.ts

```typescript
formatDate(isoString) → string      // "Apr 17, 2026"
formatTime(isoString) → string      // "3:45 PM"
formatDateTime(isoString) → string  // "Apr 17, 2026 3:45 PM"
timeAgo(isoString) → string         // "5m ago", "3h ago", "2d ago"
isWithinMinutes(isoString, minutes) → boolean
minutesAgo(isoString) → number
```

---

## Local development setup

```bash
# In alcohol-monitoring-shared
npm install
npm run build
npm link

# In alcohol-monitoring-web
npm link @alcohol-monitoring/shared

# In alcohol-monitoring-mobile
npm link @alcohol-monitoring/shared
```

After any change to the shared package, run `npm run build` again.
Or use `npm run dev` for watch mode during development.
Both apps pick up the changes automatically via the symlink.

---

## Related repos

- `alcohol-monitoring-db` — database schema and migrations (source of type definitions)
- `alcohol-monitoring-api` — backend API this package calls
- `alcohol-monitoring-web` — Next.js officer dashboard (imports this package)
- `alcohol-monitoring-mobile` — React Native subject app (imports this package)

---

## What not to do

- Do not import React or React Native — this package must stay framework-agnostic
- Do not hardcode API URLs — always read from environment variables
- Do not hardcode Cognito pool IDs or client IDs — read from environment variables
- Do not catch errors inside API functions — let the calling component handle them
- Do not store tokens in this package — token storage is the app's responsibility
- Do not duplicate the SubjectStatus derivation logic outside compliance.ts
- Do not add a new API function without adding the corresponding TypeScript type
- Do not change BAC_DEFAULT_THRESHOLD here — the real threshold comes from
  org_settings via the API, this constant is only a fallback default
- Do not put name/email/phone directly on Subject or Officer — those fields
  belong on Account. Use the account field from MapSubject or SubjectSummary.
- Do not expose raw server error messages — 500+ errors must use a generic message
