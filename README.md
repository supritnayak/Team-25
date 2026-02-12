# Helping Hand

## Overview

Helping Hand is a mobile-first donation platform built with Expo (React Native) and an Express.js backend. It connects donors who want to give away food or clothes with nearby receivers. Users can sign up, post donations with optional location data, browse available donations on a map, and reserve items. The app uses a file-based routing system via Expo Router and communicates with a PostgreSQL-backed Express API server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router (file-based routing in the `app/` directory)
  - `app/index.tsx` — Auth screen (login/signup), redirects to dashboard if authenticated
  - `app/dashboard.tsx` — Main dashboard with map view showing nearby donations
  - `app/donate.tsx` — Multi-step donation creation form (category, details, location)
  - `app/donate-confirm.tsx` — Success confirmation after posting a donation
  - `app/receive.tsx` — Browse and reserve available donations
- **State Management**: React Query (`@tanstack/react-query`) for server state, React Context for auth state (`lib/auth-context.tsx`)
- **Styling**: StyleSheet-based with a centralized color palette (`constants/colors.ts`), Nunito font family via `@expo-google-fonts/nunito`
- **Platform Handling**: Web fallbacks exist for native-only features (e.g., `MapViewWrapper.web.tsx` shows a placeholder instead of `react-native-maps`)
- **Key Libraries**: `expo-location` for geolocation, `expo-haptics` for tactile feedback, `react-native-reanimated` for animations, `expo-linear-gradient` for gradient styling

### Backend (Express.js)
- **Runtime**: Node.js with TypeScript (compiled via `tsx` in dev, `esbuild` for production)
- **Server Entry**: `server/index.ts` — Sets up CORS (supports Replit domains and localhost), JSON parsing, and serves static builds in production
- **Routes**: `server/routes.ts` — RESTful API endpoints:
  - `POST /api/auth/signup` — User registration
  - `POST /api/auth/login` — User authentication
  - `GET /api/auth/me` — Current user session check
  - `POST /api/auth/logout` — Session destruction
  - `POST /api/donations` — Create a donation
  - `GET /api/donations` — List available donations
  - `POST /api/donations/:id/reserve` — Reserve a donation
- **Sessions**: `express-session` with `connect-pg-simple` for PostgreSQL-backed session storage (auto-creates session table)

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`):
  - `users` — id (UUID), email (unique), username, password (plain text — should be hashed), createdAt
  - `donations` — id (UUID), userId (FK → users), category (enum: food/clothes), title, description, latitude, longitude, availabilityStart, availabilityEnd, status (enum: available/reserved/completed), createdAt
  - `reservations` — id (UUID), donationId (FK → donations), receiverId (FK → users), status, createdAt
- **Validation**: `drizzle-zod` generates Zod schemas from Drizzle table definitions
- **Schema Push**: `drizzle-kit push` applies schema changes directly (no migration files needed for dev)
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable

### Shared Code
- The `shared/` directory contains schema definitions and types used by both frontend and backend
- Path aliases configured in `tsconfig.json`: `@/*` maps to root, `@shared/*` maps to `./shared/*`

### API Communication
- Frontend uses `expo/fetch` (not standard fetch) for all API calls
- `lib/query-client.ts` provides `getApiUrl()` which constructs the base URL from `EXPO_PUBLIC_DOMAIN` environment variable
- `apiRequest()` helper handles method, headers, body serialization, and credential inclusion
- All requests use `credentials: "include"` for session cookie support

### Build & Deployment
- **Dev Mode**: Two processes run simultaneously — `expo:dev` (Metro bundler) and `server:dev` (Express via tsx)
- **Production**: `expo:static:build` creates a static web bundle, `server:build` bundles the server with esbuild, `server:prod` runs the bundled server which also serves the static frontend
- **Build Script**: `scripts/build.js` handles the static export process with Metro bundler coordination
- The server serves a landing page template (`server/templates/landing-page.html`) and can serve the built static files from a `dist/` directory

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **pg** (node-postgres) — Database driver used by both Drizzle ORM and the session store

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Express session secret (falls back to "helping-hand-secret")
- `EXPO_PUBLIC_DOMAIN` — API server domain for frontend API calls
- `REPLIT_DEV_DOMAIN` — Used for CORS and Expo dev server configuration
- `REPLIT_DOMAINS` — Additional allowed CORS origins
- `REPLIT_INTERNAL_APP_DOMAIN` — Used for production deployment domain detection

### Third-Party Libraries (Notable)
- `drizzle-orm` / `drizzle-kit` — Database ORM and migration tooling
- `@tanstack/react-query` — Server state management and caching
- `express-session` + `connect-pg-simple` — Session management backed by PostgreSQL
- `react-native-maps` — Native map rendering (iOS/Android only)
- `expo-location` — Device geolocation access
- `archiver` — ZIP file creation (used in build/export process)
- `patch-package` — Applies patches to dependencies post-install
