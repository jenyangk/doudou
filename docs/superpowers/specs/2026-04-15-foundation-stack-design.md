# DouDou Foundation: Stack, Infrastructure & Auth

**Sub-Project 1 of 4** — Rewrites the photo competition app from Next.js/Supabase/Clerk to SolidJS/Cloudflare/Better Auth.

**Date:** 2026-04-15
**Status:** Draft

---

## Overview

DouDou is a photo competition app where users create sessions, upload photos, and vote on each other's submissions. The current codebase is a Next.js app with gutted Supabase integration, broken upload pipeline, and commented-out functionality. This sub-project establishes the new technical foundation as a greenfield rewrite.

**What this sub-project delivers:**
- Working SolidJS SPA with TanStack Router (no SSR)
- Hono API on a Cloudflare Worker (all-in-one: serves SPA + API)
- D1 database with core schema
- R2 image storage with upload/serve pipeline
- Better Auth with passwordless OTP
- Durable Objects for real-time WebSocket updates
- Basic functional UI (not styled — UI design is Sub-Project 2)

**What this sub-project does NOT deliver:**
- Rubber-hose Disney art style (Sub-Project 2)
- Feature polish: upload UX refinements, QR sharing, confetti results (Sub-Project 3)
- Payments, admin, analytics, notifications (cut from scope)
- SSR, SEO optimization

**Existing codebase:** This is a greenfield rewrite. The current Next.js/Supabase code is replaced entirely. The existing `src/`, `public/`, config files are removed and rebuilt from scratch on the new stack.

---

## Architecture

Single Cloudflare Worker serves both the SolidJS SPA (static assets) and the Hono API.

```
┌─────────────────────────────────────────────┐
│              Cloudflare Worker              │
│                                             │
│  ┌──────────┐     ┌──────────────────────┐ │
│  │ Static   │     │ Hono API             │ │
│  │ SPA      │     │  /api/auth/*         │ │
│  │ Assets   │     │  /api/sessions/*     │ │
│  │ (SolidJS)│     │  /api/images/*       │ │
│  └──────────┘     │  /api/votes/*        │ │
│                   └──────┬───────────────┘ │
│                          │                  │
│  ┌───────┐ ┌────┐ ┌────┐│┌───────────────┐│
│  │  D1   │ │ R2 │ │ KV │││Durable Objects││
│  │(SQLite)│ │(img)│ │    │││ (real-time)   ││
│  └───────┘ └────┘ └────┘│└───────────────┘│
└─────────────────────────────────────────────┘
```

**Request routing in the Worker entry point (`worker.ts`):**
- Requests to `/api/*` → Hono router
- All other requests → serve the built SolidJS SPA (index.html for SPA fallback, or static asset if matched)

### Project Structure

```
doudou/
├── src/
│   ├── api/                    # Hono API (runs in Worker)
│   │   ├── index.ts            # Hono app setup, mount routes
│   │   ├── auth.ts             # Better Auth config + route mount
│   │   ├── middleware/
│   │   │   ├── auth.ts         # Auth middleware (session validation)
│   │   │   └── error.ts        # Global error handler
│   │   └── routes/
│   │       ├── sessions.ts     # CRUD for competition sessions
│   │       ├── images.ts       # Upload/list/delete images
│   │       ├── votes.ts        # Cast/remove votes, get results
│   │       └── ws.ts           # WebSocket upgrade → Durable Object
│   ├── client/                 # SolidJS SPA (built by Vite)
│   │   ├── index.tsx           # SPA entry point
│   │   ├── router.ts           # TanStack Router config
│   │   ├── routes/
│   │   │   ├── __root.tsx      # Root layout
│   │   │   ├── index.tsx       # Home (create/join session)
│   │   │   ├── sign-in.tsx     # Auth page
│   │   │   ├── sessions/
│   │   │   │   ├── $code.tsx   # Session board
│   │   │   │   └── $code.results.tsx  # Leaderboard
│   │   │   ├── tos.tsx
│   │   │   └── policy.tsx
│   │   ├── components/
│   │   │   ├── CreateSession.tsx
│   │   │   ├── JoinSession.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── VoteButton.tsx
│   │   │   ├── SessionDashboard.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ui/             # Basic UI primitives (button, input, card, etc.)
│   │   ├── lib/
│   │   │   ├── auth-client.ts  # Better Auth client
│   │   │   ├── api.ts          # Typed fetch wrapper for API calls
│   │   │   ├── ws.ts           # WebSocket hook (createSessionSocket)
│   │   │   └── upload.ts       # Client-side upload logic (compression, HEIC conversion)
│   │   └── styles/
│   │       └── globals.css     # Tailwind + CSS variables
│   └── shared/                 # Shared between API and client
│       ├── types.ts            # TypeScript interfaces
│       └── validation.ts       # Zod schemas for request/response
├── public/                     # Static assets (icons, images)
├── worker.ts                   # Worker entry point
├── wrangler.toml               # Cloudflare bindings config
├── vite.config.ts              # Vite config for SolidJS build
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema (D1)

Better Auth creates and manages its own tables (`user`, `session`, `account`, `verification`) via its migration tooling. We define application-specific tables only.

### `competition_sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `lower(hex(randomblob(8)))` |
| `name` | TEXT NOT NULL | Display name |
| `code` | TEXT NOT NULL UNIQUE | 6-char uppercase join code |
| `created_by` | TEXT NOT NULL FK → user(id) | Session owner |
| `max_uploads_per_user` | INTEGER NOT NULL DEFAULT 1 | |
| `max_votes_per_user` | INTEGER NOT NULL DEFAULT 3 | |
| `upload_open` | INTEGER NOT NULL DEFAULT 1 | Boolean: uploads allowed |
| `voting_open` | INTEGER NOT NULL DEFAULT 1 | Boolean: voting allowed |
| `created_at` | TEXT NOT NULL | `datetime('now')` |
| `updated_at` | TEXT NOT NULL | `datetime('now')` |

### `session_images`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `lower(hex(randomblob(8)))` |
| `session_id` | TEXT NOT NULL FK → competition_sessions(id) ON DELETE CASCADE | |
| `user_id` | TEXT NOT NULL FK → user(id) | Uploader |
| `r2_key` | TEXT NOT NULL | R2 object key |
| `filename` | TEXT NOT NULL | Original filename |
| `mime_type` | TEXT NOT NULL | |
| `created_at` | TEXT NOT NULL | `datetime('now')` |

### `votes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `lower(hex(randomblob(8)))` |
| `session_id` | TEXT NOT NULL FK → competition_sessions(id) ON DELETE CASCADE | |
| `user_id` | TEXT NOT NULL FK → user(id) | Voter |
| `image_id` | TEXT NOT NULL FK → session_images(id) ON DELETE CASCADE | |
| `created_at` | TEXT NOT NULL | `datetime('now')` |
| **UNIQUE** | `(session_id, user_id, image_id)` | One vote per user per image |

### Indexes

```sql
CREATE INDEX idx_sessions_code ON competition_sessions(code);
CREATE INDEX idx_images_session ON session_images(session_id);
CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_image ON votes(image_id);
```

### R2 Key Pattern

`sessions/{session_id}/{image_id}.{ext}`

### KV Usage

- `session:code:{code}` → cached session metadata JSON (TTL: 5 minutes) for fast join code lookups

---

## Authentication (Better Auth)

### Configuration

Better Auth configured for Cloudflare Workers with D1 adapter:

```typescript
// Conceptual config — not final implementation code
{
  database: d1Adapter(env.DB),
  emailAndPassword: { enabled: false },
  plugins: [emailOTP()],
  trustedOrigins: ["https://doudou.muniee.com"],
}
```

### Auth Method

**Passwordless OTP only** (magic link via email):
1. User enters email → client calls Better Auth's email OTP endpoint
2. Worker generates OTP, stores verification in D1, sends email via external email service
3. User enters OTP → client verifies
4. Better Auth creates session, sets HTTP-only cookie
5. All subsequent API calls include the session cookie

### Email Delivery

The Worker calls an external email API to send OTP codes. Options (to be decided during implementation): Resend, Mailgun, or Cloudflare Email Workers. The email service is injected via environment variable so it can be swapped without code changes.

### API Protection

Hono middleware validates the session cookie via `auth.api.getSession()` on all `/api/*` routes except:
- `/api/auth/*` (Better Auth handles its own auth)
- Health check endpoints

### Client Auth

Better Auth provides `createAuthClient()` for the SolidJS client:
- Handles sign-in/sign-up/sign-out flows
- Manages session state as a SolidJS signal
- Auto-refreshes sessions

---

## API Routes (Hono)

### Auth (managed by Better Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `*` | `/api/auth/*` | varies | Better Auth handles all auth routes |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/sessions/:code` | required | Get session by join code |
| `POST` | `/api/sessions` | required | Create new session |
| `PATCH` | `/api/sessions/:id` | owner only | Update settings (toggle upload/voting) |

### Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/sessions/:id/images` | required | List images in session |
| `POST` | `/api/sessions/:id/images` | required | Upload image (multipart) |
| `DELETE` | `/api/sessions/:id/images/:imageId` | owner of image | Delete own image |
| `GET` | `/api/images/:key+` | public | Serve image from R2 (with cache headers) |

### Votes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/sessions/:id/votes` | required | Cast vote `{ imageId }` |
| `DELETE` | `/api/sessions/:id/votes/:imageId` | voter only | Remove own vote |
| `GET` | `/api/sessions/:id/results` | required | Vote tallies. Returns results regardless of voting state; client decides when to show the results page (typically linked when voting is closed). |

### WebSocket

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/sessions/:id/ws` | required | WebSocket upgrade → Durable Object |

### Image Upload Flow

1. Client compresses image (client-side) and converts HEIC→JPEG if needed
2. Client sends `multipart/form-data` to `POST /api/sessions/:id/images`
3. Worker validates: auth check, session exists, session upload is open, user hasn't exceeded max uploads
4. Worker validates file: type is `image/*`, size under 10MB (hard limit, enforced server-side)
5. Worker generates image ID, constructs R2 key: `sessions/{session_id}/{image_id}.{ext}`
6. Worker streams file body to R2
7. Worker inserts record into D1 `session_images`
8. Worker notifies the session's Durable Object to broadcast `image-added` event
9. Worker returns `{ id, r2Key, filename }` to client

### Error Response Format

All API errors return:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Standard codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `UPLOAD_LIMIT_REACHED`, `VOTING_CLOSED`, `UPLOAD_CLOSED`, `INTERNAL_ERROR`.

---

## Real-time (Durable Objects)

### SessionRoom Durable Object

One Durable Object instance per competition session, keyed by session ID.

**Responsibilities:**
- Accept WebSocket connections from session participants
- Broadcast events to all connected clients
- Track connected user count for presence

**Events broadcast:**

| Event | Payload | Triggered By |
|-------|---------|-------------|
| `image-added` | `{ id, r2Key, filename, userId }` | Image upload API |
| `image-removed` | `{ id }` | Image delete API |
| `vote-cast` | `{ imageId, userId }` | Vote API |
| `vote-removed` | `{ imageId, userId }` | Vote remove API |
| `session-updated` | `{ uploadOpen, votingOpen }` | Session update API |
| `presence` | `{ count }` | On connect/disconnect |

**Connection flow:**
1. Client calls `GET /api/sessions/:id/ws` with auth cookie
2. Worker validates auth, extracts user ID
3. Worker gets Durable Object stub by session ID
4. Worker forwards request to DO with user info in headers
5. DO accepts WebSocket upgrade, stores socket in `Map<WebSocket, { userId, joinedAt }>`
6. DO broadcasts `presence` event with updated count

**Internal communication:**
When an API route handler mutates state (image upload, vote, session toggle), it sends an internal fetch to the Durable Object stub with the event payload. The DO then broadcasts to all connected sockets.

**No persistent state in DO storage.** D1 is the source of truth. The DO is purely a message bus for connected clients.

**Reconnection:** Client WebSocket hook implements exponential backoff (1s, 2s, 4s, max 3 retries), then shows a "connection lost" UI with manual retry button.

---

## Client (SolidJS + TanStack Router)

### Routes

| Path | Component | Loader | Description |
|------|-----------|--------|-------------|
| `/` | `Home` | none | Create/join session tabs |
| `/sign-in` | `SignIn` | redirect if authed | OTP auth form |
| `/sessions/:code` | `SessionBoard` | fetch session by code | Gallery, upload, vote, dashboard |
| `/sessions/:code/results` | `Results` | fetch results | Leaderboard with vote counts |
| `/tos` | `ToS` | none | Static content |
| `/policy` | `Policy` | none | Static content |

### Key Client Modules

**`lib/auth-client.ts`** — Better Auth `createAuthClient()` wrapper. Exports:
- `authClient` — the client instance
- `useSession()` — SolidJS accessor for current session/user
- `signIn(email)` — trigger OTP flow
- `verifyOTP(email, code)` — complete sign-in
- `signOut()` — clear session

**`lib/api.ts`** — Typed fetch wrapper for API calls. Auto-includes credentials (cookies). Returns typed responses matching `shared/types.ts`.

**`lib/ws.ts`** — `createSessionSocket(sessionCode)`:
- Returns a SolidJS signal with the latest event
- Auto-connects WebSocket on mount, disconnects on cleanup
- Exponential backoff reconnection
- Merges incoming events with local state signals

**`lib/upload.ts`** — Client-side upload utilities:
- `compressImage(file, quality)` — uses canvas API for compression
- `convertHeicToJpeg(file)` — HEIC→JPEG conversion (retained from current app)
- `uploadImage(sessionId, file, onProgress)` — XMLHttpRequest with progress tracking

### Component Overview

| Component | Purpose |
|-----------|---------|
| `CreateSession` | Form: session name, max uploads, max votes → POST /api/sessions |
| `JoinSession` | Form: enter join code → navigate to /sessions/:code |
| `ImageUploader` | Drag-and-drop zone, file preview, progress bar, HEIC conversion |
| `Gallery` | Grid of session images, click to expand |
| `VoteButton` | Vote/unvote toggle on each image |
| `SessionDashboard` | Owner controls: toggle upload/voting, stats |
| `Profile` | Auth state: sign-in button or user menu |

### Animation (GSAP)

GSAP is included in this sub-project for basic transitions. The rubber-hose animation system is deferred to Sub-Project 2, but the foundation wires up:
- Page transition wrapper (fade/slide between routes)
- Gallery image enter animation (staggered scale-in)
- Vote button micro-interaction (bounce on click)

---

## Error Handling

### API (Hono)

- Global `onError` handler catches unhandled exceptions, returns `{ error, code: "INTERNAL_ERROR" }` with 500 status
- Route-level validation errors return 400 with `VALIDATION_ERROR` code
- Auth errors return 401/403 with `UNAUTHORIZED`/`FORBIDDEN` codes

### Client (SolidJS)

- `ErrorBoundary` component wraps route content, shows friendly error message with retry
- API fetch wrapper throws typed errors that components can catch
- Toast notifications via `solid-toast` for transient errors

### WebSocket

- Auto-reconnect with exponential backoff: 1s → 2s → 4s (3 attempts)
- After max retries, show persistent "Connection lost" banner with manual retry button
- On reconnect, client re-fetches full session state to catch missed events

---

## Testing Strategy

### API Tests

**Vitest** with `@cloudflare/vitest-pool-workers` for integration tests:
- Tests run against miniflare (local D1/R2/KV emulation)
- Test auth flows end-to-end (create user, get OTP, verify, use session)
- Test session CRUD, image upload/serve, voting with limits
- Test authorization (owner-only routes, own-resource-only deletes)

### Client Tests

**Vitest** with `@solidjs/testing-library`:
- Unit tests for components (CreateSession, JoinSession, Gallery, VoteButton)
- Mock API responses, test loading/error/success states
- Test WebSocket hook behavior with mock WebSocket

### E2E

Deferred to a later sub-project. Foundation focuses on API integration tests and component unit tests.

---

## Dev Environment

- `wrangler dev` runs the Worker locally with miniflare (D1/R2/KV/DO emulation)
- Vite dev server for SolidJS with HMR, proxies `/api/*` to local Worker
- Single `npm run dev` script starts both (concurrently)
- `npm run build` builds SolidJS SPA, then `wrangler deploy` deploys everything
- `wrangler d1 migrations apply` for schema changes

### wrangler.toml bindings

```toml
[[d1_databases]]
binding = "DB"
database_name = "doudou-db"
database_id = "<to-be-created>"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "doudou-images"

[[kv_namespaces]]
binding = "CACHE"
id = "<to-be-created>"

[[durable_objects.bindings]]
name = "SESSION_ROOM"
class_name = "SessionRoom"

[[migrations]]
tag = "v1"
new_classes = ["SessionRoom"]
```

---

## Sub-Project Roadmap

| # | Sub-Project | Depends On | Scope |
|---|---|---|---|
| **1** | **Foundation (this spec)** | — | SolidJS + TanStack Router, Hono on CF Worker, D1 schema, R2 uploads, Better Auth (OTP), Durable Objects real-time, basic functional UI |
| 2 | UI/Design System | 1 | Rubber-hose Disney art style, custom component library, GSAP character animations, color palette, typography, page transitions |
| 3 | Feature Polish | 1, 2 | Upload UX (drag-drop, preview, progress), voting UX, QR code session sharing, results leaderboard with confetti, session management |
| 4 | Ops & Growth | 1-3 | Rate limiting, monitoring/error tracking, email templates, production hardening, performance optimization |
