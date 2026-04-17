# @alcohol-monitoring/shared

Shared TypeScript library for the Alcohol Monitoring system. Imported by both the Next.js web dashboard and the React Native Expo mobile app.

Contains:

- **API client** — fetch wrapper with auth header injection
- **TypeScript types** — interfaces for all entities
- **Constants** — event types, roles, status colors, thresholds
- **Utilities** — date formatting, compliance status derivation, BAC formatting

## Setup

```bash
npm install
npm run build
```

## Local development with npm link

### 1. Link this package globally

```bash
cd alcohol-monitoring-shared
npm install
npm run build
npm link
```

### 2. Link into the web dashboard

```bash
cd alcohol-monitoring-web
npm link @alcohol-monitoring/shared
```

### 3. Link into the mobile app

```bash
cd alcohol-monitoring-mobile
npm link @alcohol-monitoring/shared
```

### 4. After making changes

Rebuild the shared package — both apps pick up changes via the symlink:

```bash
cd alcohol-monitoring-shared
npm run build
```

Or use watch mode during development:

```bash
npm run dev
```

### 5. Unlinking

When you're done with local development, or before publishing:

```bash
# In each consuming app
npm unlink @alcohol-monitoring/shared

# In this package
npm unlink
```

## Initializing the API client

Call `initApiClient()` once at app startup:

**Next.js (web):**

```typescript
import { initApiClient } from "@alcohol-monitoring/shared";

initApiClient({
  getToken: () => localStorage.getItem("cognito_token"),
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
});
```

**React Native (Expo):**

```typescript
import { initApiClient } from "@alcohol-monitoring/shared";
import * as SecureStore from "expo-secure-store";

initApiClient({
  getToken: () => SecureStore.getItemAsync("cognito_token"),
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
});
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Build CJS + ESM to dist/ |
| `npm run dev` | Build in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run clean` | Remove dist/ |
