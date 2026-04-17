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

- **Language**: TypeScript (strict mode)
- **Build output**: dist/ (CommonJS + ESM)
- **No framework dependencies** — works with Next.js and React Native
- **Local development**: npm link into web and mobile repos
- **Package name**: @alcohol-monitoring/shared

---

## Project structure

```
src/
  api/
    client.ts         — base fetch wrapper with auth token injection
    subjects.ts       — subject and reading API functions
    readings.ts       — POST reading functions
    events.ts         — POST event functions
    auth.ts           — Cognito auth helper functions
  types/
    index.ts          — all TypeScript interfaces and types
  constants/
    index.ts          — event types, roles, colors, thresholds
  utils/
    date.ts           — date formatting helpers
    compliance.ts     — status calculation from reading data
    bac.ts            — BAC formatting and color coding
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

**Write (wearable / phone app)**

- POST /v1/readings — store a 30-min sensor snapshot
- POST /v1/events — store a discrete event
- POST /v1/events/batch — store up to 50 events in one transaction

**Read (officer dashboard / subject app)**

- GET /v1/subjects/:id/readings — reading history with date range
- GET /v1/subjects/:id/readings/latest — most recent reading
- GET /v1/subjects/:id/events — event history with optional filters
- GET /v1/subjects/:id/summary — streak + latest reading + program info
- GET /v1/officers/:id/subjects — all subjects for an officer
- GET /v1/map/subjects — all subjects with latest reading for fleet map

**Management**

- POST /v1/subjects — enroll new subject
- POST /v1/officers — create officer
- PATCH /v1/subjects/:id/status — update program status
- GET /v1/orgs/:id/settings — org configuration
- PUT /v1/orgs/:id/settings — update org configuration

---

## TypeScript types

All types are in src/types/index.ts and exported from the package root.

### Key types to know

**SubjectStatus** — derived from latest reading data:

- "compliant" — BAC below threshold, wrist on, battery > 20%, reading within last hour
- "attention" — missed reading OR battery ≤ 20% OR wrist off > 15 min
- "violation" — BAC above threshold OR tamper event in last hour
- "offline" — no reading in last 2 hours

**MapSubject** — what the fleet map renders per pin:

- Combines Subject profile + latest Reading + derived SubjectStatus
- Fetched in one call via GET /v1/map/subjects

**SubjectSummary** — what the subject mobile home screen shows:

- streak (current + longest)
- latest_reading
- program info (status, enrolled_at, program_end_at, days_remaining)
- last_7_days (reading_count, event_count, violation_count, missed_readings)

---

## Constants

All in src/constants/index.ts:

```typescript
EVENT_TYPES — array of all valid event_type strings
SUBJECT_STATUS_COLORS — {
  compliant: "#1D9E75",
  attention: "#BA7517",
  violation: "#E05A38",
  offline:   "#888780"
}
ROLES — { SUBJECT, OFFICER, SUPERVISOR, ORG_ADMIN, SYSTEM_ADMIN }
BAC_DEFAULT_THRESHOLD — 0.02
READING_INTERVAL_MINS — 30
WRIST_OFF_ALERT_MINS  — 15
```

---

## API client architecture

src/api/client.ts exports an initializer that accepts a getToken function:

```typescript
initApiClient({ getToken: () => string | null, baseUrl: string });
```

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
  getToken: async () => await SecureStore.getItemAsync("cognito_token"),
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});
```

After init, all API functions in subjects.ts, readings.ts, and events.ts
automatically include the auth header without any extra configuration.

### Error handling

- 401 — token expired, triggers re-auth (injected onUnauthorized callback)
- 404 — returns null (not found is not an error)
- 400 — throws ValidationError with field details
- 500 — throws ApiError with generic message, never exposes raw DB errors
- Network failure — throws NetworkError

Never catch errors inside the API functions — let callers handle them.

---

## Cognito auth

AWS Cognito user pool in us-west-2. Three app clients:

- alcohol-monitoring-web — web dashboard (no client secret)
- alcohol-monitoring-mobile — mobile app (no client secret)
- alcohol-monitoring-api — backend machine to machine (has secret)

The shared package handles token storage and refresh for web and mobile.
The backend machine to machine client is never used in this package.

User pool details live in environment variables — never hardcoded:

- NEXT_PUBLIC_COGNITO_USER_POOL_ID / EXPO_PUBLIC_COGNITO_USER_POOL_ID
- NEXT_PUBLIC_COGNITO_WEB_CLIENT_ID / EXPO_PUBLIC_COGNITO_MOBILE_CLIENT_ID
- NEXT_PUBLIC_COGNITO_REGION / EXPO_PUBLIC_COGNITO_REGION

---

## Compliance status logic

src/utils/compliance.ts contains deriveSubjectStatus(reading, events):

```typescript
function deriveSubjectStatus(
  latestReading: Reading | null,
  recentEvents: Event[]
): SubjectStatus {
  if (!latestReading) return "offline";
  const age = Date.now() - new Date(latestReading.recorded_at).getTime();
  if (age > 2 * 60 * 60 * 1000) return "offline";
  const recentTamper = recentEvents.some(
    (e) =>
      e.event_type === "tamper_ir_detected" &&
      Date.now() - new Date(e.recorded_at).getTime() < 60 * 60 * 1000
  );
  if (recentTamper || (latestReading.ethanol_bac ?? 0) > BAC_DEFAULT_THRESHOLD)
    return "violation";
  if (
    (latestReading.battery_pct ?? 100) <= 20 ||
    latestReading.wrist_on === false ||
    age > READING_INTERVAL_MINS * 60 * 1000 * 1.5
  )
    return "attention";
  return "compliant";
}
```

This function is the single source of truth for status — used on the
fleet map, subject list, subject detail, and mobile home screen.

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

After any change to the shared package, run npm run build again.
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
