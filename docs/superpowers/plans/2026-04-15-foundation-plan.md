# DouDou Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the DouDou photo competition app on SolidJS + Hono + Cloudflare (D1, R2, KV, Durable Objects) with Better Auth.

**Architecture:** Single Cloudflare Worker serves both a SolidJS SPA (static assets) and a Hono API. D1 for database, R2 for image storage, KV for caching, Durable Objects for real-time WebSocket. Better Auth with email OTP for authentication.

**Tech Stack:** SolidJS, TanStack Router, Hono, Cloudflare Workers/D1/R2/KV/Durable Objects, Better Auth, GSAP, Tailwind CSS, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-04-15-foundation-stack-design.md`

---

## File Map

### Root Config Files
- `package.json` — dependencies, scripts
- `tsconfig.json` — TypeScript config (paths, JSX for SolidJS)
- `wrangler.toml` — Cloudflare bindings (D1, R2, KV, DO)
- `vite.config.ts` — Vite + SolidJS + TanStack Router plugin
- `tailwind.config.ts` — Tailwind setup
- `postcss.config.mjs` — PostCSS with Tailwind

### Worker Entry
- `worker.ts` — Routes `/api/*` to Hono, everything else to SPA static assets

### API (`src/api/`)
- `src/api/index.ts` — Hono app setup, mount all route groups
- `src/api/auth.ts` — Better Auth instance + config
- `src/api/middleware/auth.ts` — Session validation middleware
- `src/api/middleware/error.ts` — Global error handler
- `src/api/routes/sessions.ts` — Session CRUD
- `src/api/routes/images.ts` — Image upload/list/delete/serve
- `src/api/routes/votes.ts` — Vote cast/remove/results
- `src/api/routes/ws.ts` — WebSocket upgrade to Durable Object
- `src/api/durable-objects/session-room.ts` — SessionRoom DO class

### Client (`src/client/`)
- `src/client/index.tsx` — SPA entry, mount router
- `src/client/router.ts` — TanStack Router config
- `src/client/routes/__root.tsx` — Root layout (header, footer, toaster)
- `src/client/routes/index.tsx` — Home (create/join tabs)
- `src/client/routes/sign-in.tsx` — OTP auth page
- `src/client/routes/sessions/$code.tsx` — Session board
- `src/client/routes/sessions/$code.results.tsx` — Leaderboard
- `src/client/routes/tos.tsx` — Terms of service
- `src/client/routes/policy.tsx` — Privacy policy
- `src/client/components/CreateSession.tsx`
- `src/client/components/JoinSession.tsx`
- `src/client/components/ImageUploader.tsx`
- `src/client/components/Gallery.tsx`
- `src/client/components/VoteButton.tsx`
- `src/client/components/SessionDashboard.tsx`
- `src/client/components/Profile.tsx`
- `src/client/components/ui/Button.tsx`
- `src/client/components/ui/Input.tsx`
- `src/client/components/ui/Card.tsx`
- `src/client/lib/auth-client.ts` — Better Auth client wrapper
- `src/client/lib/api.ts` — Typed fetch wrapper
- `src/client/lib/ws.ts` — WebSocket hook
- `src/client/lib/upload.ts` — Client-side image processing + upload
- `src/client/styles/globals.css` — Tailwind directives + CSS vars

### Shared (`src/shared/`)
- `src/shared/types.ts` — TypeScript interfaces
- `src/shared/validation.ts` — Zod schemas

### Database
- `migrations/0001_initial.sql` — App tables (competition_sessions, session_images, votes)

### Static
- `public/icon.png` — App icon (copied from existing)
- `index.html` — SPA HTML shell

---

## Phase 1: Project Scaffolding

### Task 1.1: Clean existing project files

**Files:**
- Remove: all existing `src/`, config files, etc.
- Keep: `docs/`, `public/icon.png`, `public/icon-large.png`, `.git/`

- [ ] **Step 1: Remove old source and config files**

```bash
cd /Users/akoh/Documents/doudou

# Remove old source code and configs
rm -rf src/ scripts/ monitoring/
rm -f next.config.mjs next-env.d.ts components.json postcss.config.mjs tailwind.config.ts tsconfig.json package.json package-lock.json

# Keep docs/, public/ (icons), .git/, LICENSE, README.md
```

- [ ] **Step 2: Commit clean slate**

```bash
git add -A
git commit -m "chore: remove old Next.js/Supabase codebase"
```

### Task 1.2: Initialize new project with dependencies

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "doudou",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"wrangler dev worker.ts --local\" \"vite dev\"",
    "build": "vite build",
    "deploy": "vite build && wrangler deploy worker.ts",
    "db:migrate": "wrangler d1 execute doudou-db --local --file=migrations/0001_initial.sql",
    "db:migrate:remote": "wrangler d1 execute doudou-db --file=migrations/0001_initial.sql",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/solid-router": "^1.120.0",
    "better-auth": "^1.2.0",
    "gsap": "^3.12.0",
    "hono": "^4.7.0",
    "solid-js": "^1.9.0",
    "solid-toast": "^0.5.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.8.0",
    "@cloudflare/workers-types": "^4.20250410.0",
    "@solidjs/testing-library": "^0.8.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^9.1.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "vite-plugin-solid": "^2.11.0",
    "vitest": "^3.1.0",
    "wrangler": "^4.10.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Clean install, `node_modules/` created, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize new project dependencies"
```

### Task 1.3: Create TypeScript and build configs

**Files:**
- Create: `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `index.html`

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@api/*": ["./src/api/*"],
      "@client/*": ["./src/client/*"],
      "@shared/*": ["./src/shared/*"]
    },
    "types": ["@cloudflare/workers-types", "vite/client"]
  },
  "include": ["src/**/*", "worker.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@client": resolve(__dirname, "src/client"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  root: ".",
  build: {
    outDir: "dist/client",
    emptyDirFirst: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
```

- [ ] **Step 3: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Create postcss.config.mjs**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DouDou</title>
    <link rel="icon" href="/icon.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create wrangler.toml**

```toml
name = "doudou"
main = "worker.ts"
compatibility_date = "2025-04-01"

[assets]
directory = "dist/client"

[[d1_databases]]
binding = "DB"
database_name = "doudou-db"
database_id = "local"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "doudou-images"

[[kv_namespaces]]
binding = "CACHE"
id = "local"

[[durable_objects.bindings]]
name = "SESSION_ROOM"
class_name = "SessionRoom"

[[migrations]]
tag = "v1"
new_classes = ["SessionRoom"]
```

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json vite.config.ts tailwind.config.ts postcss.config.mjs index.html wrangler.toml
git commit -m "chore: add TypeScript, Vite, Tailwind, and Wrangler configs"
```

### Task 1.4: Create shared types and validation schemas

**Files:**
- Create: `src/shared/types.ts`, `src/shared/validation.ts`

- [ ] **Step 1: Create src/shared/types.ts**

```typescript
// --- Database row types ---

export interface CompetitionSession {
  id: string;
  name: string;
  code: string;
  created_by: string;
  max_uploads_per_user: number;
  max_votes_per_user: number;
  upload_open: number; // 0 or 1
  voting_open: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface SessionImage {
  id: string;
  session_id: string;
  user_id: string;
  r2_key: string;
  filename: string;
  mime_type: string;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  user_id: string;
  image_id: string;
  created_at: string;
}

// --- API response types ---

export interface ApiError {
  error: string;
  code: string;
}

export interface SessionResponse {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  maxUploadsPerUser: number;
  maxVotesPerUser: number;
  uploadOpen: boolean;
  votingOpen: boolean;
  createdAt: string;
}

export interface ImageResponse {
  id: string;
  sessionId: string;
  userId: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  createdAt: string;
}

export interface VoteResponse {
  id: string;
  imageId: string;
  userId: string;
  createdAt: string;
}

export interface ResultItem {
  imageId: string;
  r2Key: string;
  filename: string;
  voteCount: number;
}

// --- WebSocket event types ---

export type WsEvent =
  | { type: "image-added"; data: ImageResponse }
  | { type: "image-removed"; data: { id: string } }
  | { type: "vote-cast"; data: { imageId: string; userId: string } }
  | { type: "vote-removed"; data: { imageId: string; userId: string } }
  | { type: "session-updated"; data: { uploadOpen: boolean; votingOpen: boolean } }
  | { type: "presence"; data: { count: number } };

// --- Cloudflare env bindings ---

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CACHE: KVNamespace;
  SESSION_ROOM: DurableObjectNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  EMAIL_API_KEY: string;
}
```

- [ ] **Step 2: Create src/shared/validation.ts**

```typescript
import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  maxUploadsPerUser: z.number().int().min(1).max(20).default(1),
  maxVotesPerUser: z.number().int().min(1).max(50).default(3),
});

export const updateSessionSchema = z.object({
  uploadOpen: z.boolean().optional(),
  votingOpen: z.boolean().optional(),
});

export const castVoteSchema = z.object({
  imageId: z.string().min(1),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/
git commit -m "feat: add shared types and Zod validation schemas"
```

### Task 1.5: Create D1 migration

**Files:**
- Create: `migrations/0001_initial.sql`

- [ ] **Step 1: Create migrations/0001_initial.sql**

```sql
-- DouDou application tables
-- Better Auth manages its own tables (user, session, account, verification)

CREATE TABLE IF NOT EXISTS competition_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  max_uploads_per_user INTEGER NOT NULL DEFAULT 1,
  max_votes_per_user INTEGER NOT NULL DEFAULT 3,
  upload_open INTEGER NOT NULL DEFAULT 1,
  voting_open INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_images (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL REFERENCES competition_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL REFERENCES competition_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  image_id TEXT NOT NULL REFERENCES session_images(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_id, user_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_code ON competition_sessions(code);
CREATE INDEX IF NOT EXISTS idx_images_session ON session_images(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_image ON votes(image_id);
```

- [ ] **Step 2: Commit**

```bash
git add migrations/
git commit -m "feat: add D1 migration for app tables"
```

---

## Phase 2: Hono API Skeleton + Worker Entry

### Task 2.1: Create error handling middleware

**Files:**
- Create: `src/api/middleware/error.ts`

- [ ] **Step 1: Create src/api/middleware/error.ts**

```typescript
import type { ErrorHandler } from "hono";
import type { Env } from "@shared/types";

export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof Response) {
    return err;
  }

  return c.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    500
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/middleware/error.ts
git commit -m "feat: add global error handler middleware"
```

### Task 2.2: Create Hono app skeleton

**Files:**
- Create: `src/api/index.ts`

- [ ] **Step 1: Create src/api/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin, // Allow same-origin in production
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

// Route groups will be mounted here in later tasks:
// api.route("/auth", authRoutes)
// api.route("/sessions", sessionRoutes)
// api.route("/images", imageRoutes)
// api.route("/votes", voteRoutes)

export { api };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/index.ts
git commit -m "feat: add Hono API skeleton with health endpoint"
```

### Task 2.3: Create Worker entry point

**Files:**
- Create: `worker.ts`

- [ ] **Step 1: Create worker.ts**

```typescript
import { api } from "./src/api/index";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/* to Hono
    if (url.pathname.startsWith("/api")) {
      return api.fetch(request, env, ctx);
    }

    // Serve static assets (handled by wrangler [assets] config)
    // For SPA fallback, return index.html for non-asset paths
    return new Response("SPA placeholder — Vite build not yet wired", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  },
};

// Durable Object export will be added in Phase 7
// export { SessionRoom } from "./src/api/durable-objects/session-room";
```

- [ ] **Step 2: Verify worker starts locally**

Run: `npx wrangler dev worker.ts --local`
Expected: Worker starts on `http://localhost:8787`. Hit `http://localhost:8787/api/health` → `{"status":"ok"}`

- [ ] **Step 3: Commit**

```bash
git add worker.ts
git commit -m "feat: add Worker entry point routing /api to Hono"
```

---

## Phase 3: Better Auth Integration

### Task 3.1: Create Better Auth server config

**Files:**
- Create: `src/api/auth.ts`

- [ ] **Step 1: Create src/api/auth.ts**

```typescript
import { betterAuth } from "better-auth";
import { d1Adapter } from "better-auth/adapters/d1";
import { emailOTP } from "better-auth/plugins";
import type { Env } from "@shared/types";

export function createAuth(env: Env) {
  return betterAuth({
    database: d1Adapter(env.DB),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: false },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          // Use Resend or another email API
          // For dev, log to console
          console.log(`[DEV] OTP for ${email}: ${otp}`);

          if (env.EMAIL_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.EMAIL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "DouDou <noreply@doudou.muniee.com>",
                to: email,
                subject: "Your DouDou sign-in code",
                text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
              }),
            });
          }
        },
      }),
    ],
    trustedOrigins: ["http://localhost:5173", "https://doudou.muniee.com"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: add Better Auth config with email OTP plugin"
```

### Task 3.2: Mount Better Auth routes in Hono

**Files:**
- Modify: `src/api/index.ts`

- [ ] **Step 1: Update src/api/index.ts to mount auth**

Replace the full file content with:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

// Better Auth handler — handles all /api/auth/* routes
api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Route groups will be mounted here in later tasks:
// api.route("/sessions", sessionRoutes)
// api.route("/images", imageRoutes)
// api.route("/votes", voteRoutes)

export { api };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/index.ts
git commit -m "feat: mount Better Auth routes at /api/auth/*"
```

### Task 3.3: Create auth middleware

**Files:**
- Create: `src/api/middleware/auth.ts`

- [ ] **Step 1: Create src/api/middleware/auth.ts**

```typescript
import { createMiddleware } from "hono/factory";
import type { Env } from "@shared/types";
import { createAuth } from "../auth";

type AuthEnv = { Bindings: Env; Variables: { userId: string } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Authentication required", code: "UNAUTHORIZED" }, 401);
  }

  c.set("userId", session.user.id);
  await next();
});
```

- [ ] **Step 2: Commit**

```bash
git add src/api/middleware/auth.ts
git commit -m "feat: add requireAuth middleware using Better Auth session"
```

---

## Phase 4: Session CRUD Routes

### Task 4.1: Create session routes

**Files:**
- Create: `src/api/routes/sessions.ts`

- [ ] **Step 1: Create src/api/routes/sessions.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "@shared/types";
import { requireAuth } from "../middleware/auth";
import { createSessionSchema, updateSessionSchema } from "@shared/validation";
import type { CompetitionSession, SessionResponse } from "@shared/types";

type SessionEnv = { Bindings: Env; Variables: { userId: string } };

const sessions = new Hono<SessionEnv>();

function toSessionResponse(row: CompetitionSession): SessionResponse {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    createdBy: row.created_by,
    maxUploadsPerUser: row.max_uploads_per_user,
    maxVotesPerUser: row.max_votes_per_user,
    uploadOpen: row.upload_open === 1,
    votingOpen: row.voting_open === 1,
    createdAt: row.created_at,
  };
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    code += chars[b % chars.length];
  }
  return code;
}

// GET /api/sessions/:code — get session by join code
sessions.get("/:code", requireAuth, async (c) => {
  const code = c.req.param("code").toUpperCase();

  // Check KV cache first
  const cached = await c.env.CACHE.get(`session:code:${code}`);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const row = await c.env.DB.prepare(
    "SELECT * FROM competition_sessions WHERE code = ?"
  )
    .bind(code)
    .first<CompetitionSession>();

  if (!row) {
    return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  }

  const response = toSessionResponse(row);

  // Cache for 5 minutes
  await c.env.CACHE.put(`session:code:${code}`, JSON.stringify(response), {
    expirationTtl: 300,
  });

  return c.json(response);
});

// POST /api/sessions — create new session
sessions.post("/", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
      400
    );
  }

  const { name, maxUploadsPerUser, maxVotesPerUser } = parsed.data;
  const userId = c.get("userId");
  const code = generateCode();

  const result = await c.env.DB.prepare(
    `INSERT INTO competition_sessions (name, code, created_by, max_uploads_per_user, max_votes_per_user)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(name, code, userId, maxUploadsPerUser, maxVotesPerUser)
    .first<CompetitionSession>();

  if (!result) {
    return c.json({ error: "Failed to create session", code: "INTERNAL_ERROR" }, 500);
  }

  return c.json(toSessionResponse(result), 201);
});

// PATCH /api/sessions/:id — update session (owner only)
sessions.patch("/:id", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const session = await c.env.DB.prepare(
    "SELECT * FROM competition_sessions WHERE id = ?"
  )
    .bind(sessionId)
    .first<CompetitionSession>();

  if (!session) {
    return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  }

  if (session.created_by !== userId) {
    return c.json({ error: "Only the session owner can update settings", code: "FORBIDDEN" }, 403);
  }

  const body = await c.req.json();
  const parsed = updateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
      400
    );
  }

  const updates: string[] = [];
  const values: (number | string)[] = [];

  if (parsed.data.uploadOpen !== undefined) {
    updates.push("upload_open = ?");
    values.push(parsed.data.uploadOpen ? 1 : 0);
  }
  if (parsed.data.votingOpen !== undefined) {
    updates.push("voting_open = ?");
    values.push(parsed.data.votingOpen ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json(toSessionResponse(session));
  }

  updates.push("updated_at = datetime('now')");
  values.push(sessionId);

  const updated = await c.env.DB.prepare(
    `UPDATE competition_sessions SET ${updates.join(", ")} WHERE id = ? RETURNING *`
  )
    .bind(...values)
    .first<CompetitionSession>();

  if (!updated) {
    return c.json({ error: "Failed to update session", code: "INTERNAL_ERROR" }, 500);
  }

  // Invalidate KV cache
  await c.env.CACHE.delete(`session:code:${updated.code}`);

  // Notify Durable Object (will be wired in Phase 7)
  // const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  // const stub = c.env.SESSION_ROOM.get(doId);
  // await stub.fetch(new Request("http://internal/broadcast", { ... }));

  return c.json(toSessionResponse(updated));
});

export { sessions };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/routes/sessions.ts
git commit -m "feat: add session CRUD routes (get by code, create, update)"
```

### Task 4.2: Mount session routes in Hono app

**Files:**
- Modify: `src/api/index.ts`

- [ ] **Step 1: Add session route import and mount**

Add after the auth handler in `src/api/index.ts`:

```typescript
import { sessions } from "./routes/sessions";
```

And mount it:

```typescript
api.route("/sessions", sessions);
```

The full updated `src/api/index.ts`:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";
import { sessions } from "./routes/sessions";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

// Better Auth handler
api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Route groups
api.route("/sessions", sessions);

export { api };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/index.ts
git commit -m "feat: mount session routes in Hono app"
```

---

## Phase 5: Image Upload, Serve & Delete (R2)

### Task 5.1: Create image routes

**Files:**
- Create: `src/api/routes/images.ts`

- [ ] **Step 1: Create src/api/routes/images.ts**

```typescript
import { Hono } from "hono";
import type { Env, CompetitionSession, SessionImage, ImageResponse } from "@shared/types";
import { requireAuth } from "../middleware/auth";

type ImageEnv = { Bindings: Env; Variables: { userId: string } };

const images = new Hono<ImageEnv>();

function toImageResponse(row: SessionImage): ImageResponse {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    r2Key: row.r2_key,
    filename: row.filename,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET /api/sessions/:id/images — list images in session
images.get("/sessions/:id/images", requireAuth, async (c) => {
  const sessionId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_images WHERE session_id = ? ORDER BY created_at ASC"
  )
    .bind(sessionId)
    .all<SessionImage>();

  return c.json(results.map(toImageResponse));
});

// POST /api/sessions/:id/images — upload image
images.post("/sessions/:id/images", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  // Verify session exists and uploads are open
  const session = await c.env.DB.prepare(
    "SELECT * FROM competition_sessions WHERE id = ?"
  )
    .bind(sessionId)
    .first<CompetitionSession>();

  if (!session) {
    return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  }

  if (!session.upload_open) {
    return c.json({ error: "Uploads are closed for this session", code: "UPLOAD_CLOSED" }, 403);
  }

  // Check upload limit
  const { count } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM session_images WHERE session_id = ? AND user_id = ?"
  )
    .bind(sessionId, userId)
    .first<{ count: number }>() ?? { count: 0 };

  if (count >= session.max_uploads_per_user) {
    return c.json(
      { error: `Upload limit reached (max ${session.max_uploads_per_user})`, code: "UPLOAD_LIMIT_REACHED" },
      403
    );
  }

  // Parse multipart form
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided", code: "VALIDATION_ERROR" }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json(
      { error: "File type not allowed. Use JPEG, PNG, GIF, WebP, or AVIF.", code: "VALIDATION_ERROR" },
      400
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: "File too large (max 10MB)", code: "VALIDATION_ERROR" },
      400
    );
  }

  // Generate image ID and R2 key
  const imageId = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  const ext = getExtension(file.name);
  const r2Key = `sessions/${sessionId}/${imageId}.${ext}`;

  // Upload to R2
  await c.env.IMAGES.put(r2Key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // Insert DB record
  const row = await c.env.DB.prepare(
    `INSERT INTO session_images (id, session_id, user_id, r2_key, filename, mime_type)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(imageId, sessionId, userId, r2Key, file.name, file.type)
    .first<SessionImage>();

  if (!row) {
    // Cleanup R2 on DB failure
    await c.env.IMAGES.delete(r2Key);
    return c.json({ error: "Failed to save image record", code: "INTERNAL_ERROR" }, 500);
  }

  // Notify Durable Object (will be wired in Phase 7)
  // const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  // const stub = c.env.SESSION_ROOM.get(doId);
  // await stub.fetch(new Request("http://internal/broadcast", { ... }));

  return c.json(toImageResponse(row), 201);
});

// DELETE /api/sessions/:id/images/:imageId — delete own image
images.delete("/sessions/:id/images/:imageId", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const imageId = c.req.param("imageId");
  const userId = c.get("userId");

  const image = await c.env.DB.prepare(
    "SELECT * FROM session_images WHERE id = ? AND session_id = ?"
  )
    .bind(imageId, sessionId)
    .first<SessionImage>();

  if (!image) {
    return c.json({ error: "Image not found", code: "NOT_FOUND" }, 404);
  }

  if (image.user_id !== userId) {
    return c.json({ error: "You can only delete your own images", code: "FORBIDDEN" }, 403);
  }

  // Delete from R2
  await c.env.IMAGES.delete(image.r2_key);

  // Delete from DB (cascades to votes)
  await c.env.DB.prepare("DELETE FROM session_images WHERE id = ?")
    .bind(imageId)
    .run();

  // Notify Durable Object (will be wired in Phase 7)

  return c.json({ success: true });
});

// GET /api/images/:key+ — serve image from R2
images.get("/images/*", async (c) => {
  const key = c.req.path.replace("/api/images/", "");

  const object = await c.env.IMAGES.get(key);

  if (!object) {
    return c.json({ error: "Image not found", code: "NOT_FOUND" }, 404);
  }

  const headers = new Headers();
  headers.set("content-type", object.httpMetadata?.contentType ?? "image/jpeg");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
});

export { images };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/routes/images.ts
git commit -m "feat: add image upload, list, delete, and serve routes (R2)"
```

### Task 5.2: Mount image routes in Hono app

**Files:**
- Modify: `src/api/index.ts`

- [ ] **Step 1: Update src/api/index.ts**

Add import and mount:

```typescript
import { images } from "./routes/images";
```

Mount at the top level (image routes define their own full paths):

```typescript
api.route("/", images);
```

Full updated `src/api/index.ts`:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";
import { sessions } from "./routes/sessions";
import { images } from "./routes/images";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

api.route("/sessions", sessions);
api.route("/", images);

export { api };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/index.ts
git commit -m "feat: mount image routes in Hono app"
```

---

## Phase 6: Voting Routes

### Task 6.1: Create vote routes

**Files:**
- Create: `src/api/routes/votes.ts`

- [ ] **Step 1: Create src/api/routes/votes.ts**

```typescript
import { Hono } from "hono";
import type { Env, CompetitionSession, Vote, VoteResponse, ResultItem, SessionImage } from "@shared/types";
import { requireAuth } from "../middleware/auth";
import { castVoteSchema } from "@shared/validation";

type VoteEnv = { Bindings: Env; Variables: { userId: string } };

const votes = new Hono<VoteEnv>();

// POST /api/sessions/:id/votes — cast a vote
votes.post("/:id/votes", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const body = await c.req.json();
  const parsed = castVoteSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
      400
    );
  }

  const { imageId } = parsed.data;

  // Verify session exists and voting is open
  const session = await c.env.DB.prepare(
    "SELECT * FROM competition_sessions WHERE id = ?"
  )
    .bind(sessionId)
    .first<CompetitionSession>();

  if (!session) {
    return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  }

  if (!session.voting_open) {
    return c.json({ error: "Voting is closed for this session", code: "VOTING_CLOSED" }, 403);
  }

  // Verify image belongs to this session
  const image = await c.env.DB.prepare(
    "SELECT id FROM session_images WHERE id = ? AND session_id = ?"
  )
    .bind(imageId, sessionId)
    .first<SessionImage>();

  if (!image) {
    return c.json({ error: "Image not found in this session", code: "NOT_FOUND" }, 404);
  }

  // Check vote limit
  const { count } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM votes WHERE session_id = ? AND user_id = ?"
  )
    .bind(sessionId, userId)
    .first<{ count: number }>() ?? { count: 0 };

  if (count >= session.max_votes_per_user) {
    return c.json(
      { error: `Vote limit reached (max ${session.max_votes_per_user})`, code: "UPLOAD_LIMIT_REACHED" },
      403
    );
  }

  // Insert vote (UNIQUE constraint prevents duplicate vote on same image)
  try {
    const row = await c.env.DB.prepare(
      `INSERT INTO votes (session_id, user_id, image_id)
       VALUES (?, ?, ?)
       RETURNING *`
    )
      .bind(sessionId, userId, imageId)
      .first<Vote>();

    if (!row) {
      return c.json({ error: "Failed to cast vote", code: "INTERNAL_ERROR" }, 500);
    }

    // Notify Durable Object (will be wired in Phase 7)

    const response: VoteResponse = {
      id: row.id,
      imageId: row.image_id,
      userId: row.user_id,
      createdAt: row.created_at,
    };

    return c.json(response, 201);
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint failed")) {
      return c.json({ error: "You already voted for this image", code: "VALIDATION_ERROR" }, 409);
    }
    throw err;
  }
});

// DELETE /api/sessions/:id/votes/:imageId — remove own vote
votes.delete("/:id/votes/:imageId", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const imageId = c.req.param("imageId");
  const userId = c.get("userId");

  const vote = await c.env.DB.prepare(
    "SELECT * FROM votes WHERE session_id = ? AND user_id = ? AND image_id = ?"
  )
    .bind(sessionId, userId, imageId)
    .first<Vote>();

  if (!vote) {
    return c.json({ error: "Vote not found", code: "NOT_FOUND" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM votes WHERE id = ?")
    .bind(vote.id)
    .run();

  // Notify Durable Object (will be wired in Phase 7)

  return c.json({ success: true });
});

// GET /api/sessions/:id/results — vote tallies
votes.get("/:id/results", requireAuth, async (c) => {
  const sessionId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT
       si.id as imageId,
       si.r2_key as r2Key,
       si.filename,
       COUNT(v.id) as voteCount
     FROM session_images si
     LEFT JOIN votes v ON v.image_id = si.id
     WHERE si.session_id = ?
     GROUP BY si.id
     ORDER BY voteCount DESC, si.created_at ASC`
  )
    .bind(sessionId)
    .all<ResultItem>();

  return c.json(results);
});

// GET /api/sessions/:id/votes/mine — get current user's votes in a session
votes.get("/:id/votes/mine", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM votes WHERE session_id = ? AND user_id = ?"
  )
    .bind(sessionId, userId)
    .all<Vote>();

  const response: VoteResponse[] = results.map((v) => ({
    id: v.id,
    imageId: v.image_id,
    userId: v.user_id,
    createdAt: v.created_at,
  }));

  return c.json(response);
});

export { votes };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/routes/votes.ts
git commit -m "feat: add vote cast, remove, results, and my-votes routes"
```

### Task 6.2: Mount vote routes in Hono app

**Files:**
- Modify: `src/api/index.ts`

- [ ] **Step 1: Update src/api/index.ts**

Add import and mount. Full updated file:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";
import { sessions } from "./routes/sessions";
import { images } from "./routes/images";
import { votes } from "./routes/votes";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

api.route("/sessions", sessions);
api.route("/", images);
api.route("/sessions", votes);

export { api };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/index.ts
git commit -m "feat: mount vote routes in Hono app"
```

---

## Phase 7: Durable Objects (Real-time WebSocket)

### Task 7.1: Create SessionRoom Durable Object

**Files:**
- Create: `src/api/durable-objects/session-room.ts`

- [ ] **Step 1: Create src/api/durable-objects/session-room.ts**

```typescript
import type { WsEvent } from "@shared/types";

interface ConnectedClient {
  userId: string;
  joinedAt: number;
}

export class SessionRoom implements DurableObject {
  private connections: Map<WebSocket, ConnectedClient> = new Map();

  constructor(
    private state: DurableObjectState,
    private env: unknown
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/broadcast") {
      return this.handleBroadcast(request);
    }

    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(request: Request): Response {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return new Response("Missing user ID", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.connections.set(server, { userId, joinedAt: Date.now() });

    // Broadcast updated presence count
    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const event = (await request.json()) as WsEvent;
    this.broadcastEvent(event);
    return new Response("OK");
  }

  private broadcastEvent(event: WsEvent): void {
    const message = JSON.stringify(event);
    for (const [ws] of this.connections) {
      try {
        ws.send(message);
      } catch {
        // Socket closed — will be cleaned up in webSocketClose
        this.connections.delete(ws);
      }
    }
  }

  webSocketClose(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });
  }

  webSocketError(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/durable-objects/session-room.ts
git commit -m "feat: add SessionRoom Durable Object for real-time WebSocket"
```

### Task 7.2: Create WebSocket upgrade route

**Files:**
- Create: `src/api/routes/ws.ts`

- [ ] **Step 1: Create src/api/routes/ws.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "@shared/types";
import { requireAuth } from "../middleware/auth";

type WsEnv = { Bindings: Env; Variables: { userId: string } };

const ws = new Hono<WsEnv>();

// GET /api/sessions/:id/ws — WebSocket upgrade
ws.get("/:id/ws", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const upgradeHeader = c.req.header("upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade", code: "VALIDATION_ERROR" }, 426);
  }

  // Get or create Durable Object for this session
  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);

  // Forward the upgrade request to the DO with user info
  const doRequest = new Request("http://internal/websocket", {
    headers: {
      upgrade: "websocket",
      "x-user-id": userId,
    },
  });

  return stub.fetch(doRequest);
});

export { ws };
```

- [ ] **Step 2: Commit**

```bash
git add src/api/routes/ws.ts
git commit -m "feat: add WebSocket upgrade route via Durable Object"
```

### Task 7.3: Wire DO broadcasts into API routes + export DO

**Files:**
- Modify: `src/api/routes/sessions.ts` — uncomment DO broadcast in PATCH
- Modify: `src/api/routes/images.ts` — uncomment DO broadcast in POST and DELETE
- Modify: `src/api/routes/votes.ts` — uncomment DO broadcast in POST and DELETE
- Modify: `worker.ts` — export SessionRoom
- Modify: `src/api/index.ts` — mount ws routes

- [ ] **Step 1: Create a broadcast helper**

Create `src/api/lib/broadcast.ts`:

```typescript
import type { Env, WsEvent } from "@shared/types";

export async function broadcastToSession(
  env: Env,
  sessionId: string,
  event: WsEvent
): Promise<void> {
  try {
    const doId = env.SESSION_ROOM.idFromName(sessionId);
    const stub = env.SESSION_ROOM.get(doId);
    await stub.fetch(
      new Request("http://internal/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      })
    );
  } catch (err) {
    // Non-critical: log but don't fail the request
    console.error("Failed to broadcast to session:", err);
  }
}
```

- [ ] **Step 2: Add broadcast calls to session update route**

In `src/api/routes/sessions.ts`, add import at top:

```typescript
import { broadcastToSession } from "../lib/broadcast";
```

Replace the comment `// Notify Durable Object (will be wired in Phase 7)` in the PATCH handler with:

```typescript
  await broadcastToSession(c.env, sessionId, {
    type: "session-updated",
    data: {
      uploadOpen: updated.upload_open === 1,
      votingOpen: updated.voting_open === 1,
    },
  });
```

- [ ] **Step 3: Add broadcast calls to image routes**

In `src/api/routes/images.ts`, add import at top:

```typescript
import { broadcastToSession } from "../lib/broadcast";
```

Replace the comment after R2 upload + DB insert in POST handler with:

```typescript
  await broadcastToSession(c.env, sessionId, {
    type: "image-added",
    data: toImageResponse(row),
  });
```

Replace the comment in DELETE handler with:

```typescript
  await broadcastToSession(c.env, sessionId, {
    type: "image-removed",
    data: { id: imageId },
  });
```

- [ ] **Step 4: Add broadcast calls to vote routes**

In `src/api/routes/votes.ts`, add import at top:

```typescript
import { broadcastToSession } from "../lib/broadcast";
```

After the successful vote insert in POST handler, add:

```typescript
    await broadcastToSession(c.env, sessionId, {
      type: "vote-cast",
      data: { imageId, userId },
    });
```

After the delete in DELETE handler, add:

```typescript
  await broadcastToSession(c.env, sessionId, {
    type: "vote-removed",
    data: { imageId, userId },
  });
```

- [ ] **Step 5: Export SessionRoom from worker.ts and mount ws route**

Update `worker.ts`:

```typescript
import { api } from "./src/api/index";
export { SessionRoom } from "./src/api/durable-objects/session-room";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return api.fetch(request, env, ctx);
    }

    return new Response("SPA placeholder — Vite build not yet wired", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  },
};
```

Update `src/api/index.ts` to mount ws route:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "@shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";
import { sessions } from "./routes/sessions";
import { images } from "./routes/images";
import { votes } from "./routes/votes";
import { ws } from "./routes/ws";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

api.route("/sessions", sessions);
api.route("/", images);
api.route("/sessions", votes);
api.route("/sessions", ws);

export { api };
```

- [ ] **Step 6: Commit**

```bash
git add src/api/lib/broadcast.ts src/api/routes/sessions.ts src/api/routes/images.ts src/api/routes/votes.ts src/api/routes/ws.ts src/api/index.ts worker.ts
git commit -m "feat: wire Durable Object broadcasts into all API routes"
```

---

## Phase 8: SolidJS SPA Shell

### Task 8.1: Create SPA entry point and global styles

**Files:**
- Create: `src/client/index.tsx`
- Create: `src/client/styles/globals.css`

- [ ] **Step 1: Create src/client/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- [ ] **Step 2: Create src/client/index.tsx**

```tsx
/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "./router";
import "./styles/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

render(() => <Router />, root);
```

- [ ] **Step 3: Commit**

```bash
git add src/client/index.tsx src/client/styles/globals.css
git commit -m "feat: add SolidJS SPA entry point and global styles"
```

### Task 8.2: Create TanStack Router config and root layout

**Files:**
- Create: `src/client/router.ts`
- Create: `src/client/routes/__root.tsx`

- [ ] **Step 1: Create src/client/router.ts**

```typescript
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/solid-router";
import { lazy } from "solid-js";
import { RootLayout } from "./routes/__root";

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Lazy-loaded route components
const Home = lazy(() => import("./routes/index"));
const SignIn = lazy(() => import("./routes/sign-in"));
const SessionBoard = lazy(() => import("./routes/sessions/$code"));
const SessionResults = lazy(() => import("./routes/sessions/$code.results"));
const ToS = lazy(() => import("./routes/tos"));
const Policy = lazy(() => import("./routes/policy"));

// Define routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignIn,
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$code",
  component: SessionBoard,
});

const sessionResultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$code/results",
  component: SessionResults,
});

const tosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tos",
  component: ToS,
});

const policyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/policy",
  component: Policy,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  sessionRoute,
  sessionResultsRoute,
  tosRoute,
  policyRoute,
]);

// Create router instance
const router = createRouter({ routeTree });

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

export function Router() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 2: Create src/client/routes/__root.tsx**

```tsx
import { Outlet, Link } from "@tanstack/solid-router";
import { Toaster } from "solid-toast";
import { Profile } from "../components/Profile";

export function RootLayout() {
  return (
    <div class="flex flex-col min-h-screen">
      <header class="sticky top-0 flex h-12 items-center gap-4 border-b bg-white px-4 md:px-6 justify-between z-50">
        <Link to="/" class="hover:opacity-80">
          <img src="/icon.png" alt="DouDou" width={32} height={32} />
        </Link>
        <Profile />
      </header>

      <main class="flex-1">
        <Outlet />
      </main>

      <footer class="border-t py-4 px-4 md:px-6">
        <div class="max-w-sm mx-auto flex justify-center gap-4 text-sm text-gray-500">
          <Link to="/tos" class="hover:text-gray-900 transition-colors">
            Terms of Service
          </Link>
          <Link to="/policy" class="hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>

      <Toaster position="bottom-center" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/router.ts src/client/routes/__root.tsx
git commit -m "feat: add TanStack Router config and root layout"
```

### Task 8.3: Create basic UI primitives

**Files:**
- Create: `src/client/components/ui/Button.tsx`
- Create: `src/client/components/ui/Input.tsx`
- Create: `src/client/components/ui/Card.tsx`

- [ ] **Step 1: Create src/client/components/ui/Button.tsx**

```tsx
import { splitProps, type JSX } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<string, string> = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  ghost: "hover:bg-gray-100",
  outline: "border border-gray-200 hover:bg-gray-100",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const sizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);

  const classes = () =>
    `inline-flex items-center justify-center rounded-md font-medium transition-colors
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
     disabled:opacity-50 disabled:pointer-events-none
     ${variants[local.variant ?? "default"]}
     ${sizes[local.size ?? "default"]}
     ${local.class ?? ""}`.trim();

  return (
    <button class={classes()} {...rest}>
      {local.children}
    </button>
  );
}
```

- [ ] **Step 2: Create src/client/components/ui/Input.tsx**

```tsx
import { splitProps, type JSX } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      class={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
              placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-gray-400 disabled:opacity-50 ${local.class ?? ""}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 3: Create src/client/components/ui/Card.tsx**

```tsx
import type { JSX } from "solid-js";

interface CardProps {
  class?: string;
  children: JSX.Element;
}

export function Card(props: CardProps) {
  return (
    <div class={`rounded-lg border border-gray-200 bg-white shadow-sm ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <div class={`flex flex-col space-y-1.5 p-6 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardTitle(props: CardProps) {
  return (
    <h3 class={`text-xl font-semibold leading-none tracking-tight ${props.class ?? ""}`}>
      {props.children}
    </h3>
  );
}

export function CardDescription(props: CardProps) {
  return (
    <p class={`text-sm text-gray-500 ${props.class ?? ""}`}>
      {props.children}
    </p>
  );
}

export function CardContent(props: CardProps) {
  return (
    <div class={`p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <div class={`flex items-center p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/client/components/ui/
git commit -m "feat: add basic UI primitives (Button, Input, Card)"
```

### Task 8.4: Create auth client and API wrapper

**Files:**
- Create: `src/client/lib/auth-client.ts`
- Create: `src/client/lib/api.ts`

- [ ] **Step 1: Create src/client/lib/auth-client.ts**

```typescript
import { createAuthClient } from "better-auth/solid";

export const authClient = createAuthClient({
  baseURL: window.location.origin + "/api/auth",
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

- [ ] **Step 2: Create src/client/lib/api.ts**

```typescript
import type {
  SessionResponse,
  ImageResponse,
  VoteResponse,
  ResultItem,
  ApiError,
} from "@shared/types";
import type { CreateSessionInput, CastVoteInput } from "@shared/validation";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({
      error: "Unknown error",
      code: "INTERNAL_ERROR",
    }));
    throw err;
  }

  return res.json();
}

// Sessions
export const getSession = (code: string) =>
  request<SessionResponse>(`/sessions/${code}`);

export const createSession = (data: CreateSessionInput) =>
  request<SessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateSession = (id: string, data: { uploadOpen?: boolean; votingOpen?: boolean }) =>
  request<SessionResponse>(`/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// Images
export const getImages = (sessionId: string) =>
  request<ImageResponse[]>(`/sessions/${sessionId}/images`);

export const deleteImage = (sessionId: string, imageId: string) =>
  request<{ success: boolean }>(`/sessions/${sessionId}/images/${imageId}`, {
    method: "DELETE",
  });

export const getImageUrl = (r2Key: string) => `/api/images/${r2Key}`;

// Votes
export const castVote = (sessionId: string, data: CastVoteInput) =>
  request<VoteResponse>(`/sessions/${sessionId}/votes`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const removeVote = (sessionId: string, imageId: string) =>
  request<{ success: boolean }>(`/sessions/${sessionId}/votes/${imageId}`, {
    method: "DELETE",
  });

export const getMyVotes = (sessionId: string) =>
  request<VoteResponse[]>(`/sessions/${sessionId}/votes/mine`);

export const getResults = (sessionId: string) =>
  request<ResultItem[]>(`/sessions/${sessionId}/results`);

// Upload (uses FormData, not JSON)
export async function uploadImage(
  sessionId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<ImageResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/sessions/${sessionId}/images`);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          reject(JSON.parse(xhr.responseText));
        } catch {
          reject({ error: "Upload failed", code: "INTERNAL_ERROR" });
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject({ error: "Network error", code: "INTERNAL_ERROR" });
    });

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/lib/auth-client.ts src/client/lib/api.ts
git commit -m "feat: add Better Auth client and typed API wrapper"
```

### Task 8.5: Create WebSocket hook

**Files:**
- Create: `src/client/lib/ws.ts`

- [ ] **Step 1: Create src/client/lib/ws.ts**

```typescript
import { createSignal, onCleanup } from "solid-js";
import type { WsEvent } from "@shared/types";

interface UseSessionSocketReturn {
  lastEvent: () => WsEvent | null;
  connected: () => boolean;
  reconnect: () => void;
}

export function createSessionSocket(sessionId: string): UseSessionSocketReturn {
  const [lastEvent, setLastEvent] = createSignal<WsEvent | null>(null);
  const [connected, setConnected] = createSignal(false);

  let ws: WebSocket | null = null;
  let retries = 0;
  const maxRetries = 3;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/sessions/${sessionId}/ws`;

    ws = new WebSocket(url);

    ws.addEventListener("open", () => {
      setConnected(true);
      retries = 0;
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        setLastEvent(data);
      } catch {
        console.error("Invalid WebSocket message:", event.data);
      }
    });

    ws.addEventListener("close", () => {
      setConnected(false);
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
        timeoutId = setTimeout(() => {
          retries++;
          connect();
        }, delay);
      }
    });

    ws.addEventListener("error", () => {
      ws?.close();
    });
  }

  function reconnect() {
    retries = 0;
    ws?.close();
    connect();
  }

  function cleanup() {
    if (timeoutId) clearTimeout(timeoutId);
    ws?.close();
  }

  connect();
  onCleanup(cleanup);

  return { lastEvent, connected, reconnect };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/lib/ws.ts
git commit -m "feat: add WebSocket hook with auto-reconnect"
```

### Task 8.6: Create Profile component

**Files:**
- Create: `src/client/components/Profile.tsx`

- [ ] **Step 1: Create src/client/components/Profile.tsx**

```tsx
import { Show } from "solid-js";
import { useSession, signOut } from "../lib/auth-client";
import { Button } from "./ui/Button";
import { useNavigate } from "@tanstack/solid-router";

export function Profile() {
  const session = useSession();
  const navigate = useNavigate();

  return (
    <Show
      when={session()?.data?.user}
      fallback={
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/sign-in" })}>
          Sign In
        </Button>
      }
    >
      {(user) => (
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">{user().email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
          >
            Sign Out
          </Button>
        </div>
      )}
    </Show>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/Profile.tsx
git commit -m "feat: add Profile component with auth state"
```

---

## Phase 9: Client Route Pages & Feature Components

### Task 9.1: Create sign-in page

**Files:**
- Create: `src/client/routes/sign-in.tsx`

- [ ] **Step 1: Create src/client/routes/sign-in.tsx**

```tsx
import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { authClient, useSession } from "../lib/auth-client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import toast from "solid-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const session = useSession();

  // Redirect if already signed in
  if (session()?.data?.user) {
    navigate({ to: "/" });
  }

  const [email, setEmail] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [step, setStep] = createSignal<"email" | "otp">("email");
  const [loading, setLoading] = createSignal(false);

  const sendOtp = async (e: Event) => {
    e.preventDefault();
    if (!email()) return;

    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: email() });
      setStep("otp");
      toast.success("Check your email for the verification code");
    } catch (err) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: Event) => {
    e.preventDefault();
    if (!otp()) return;

    setLoading(true);
    try {
      await authClient.signIn.emailOtp({ email: email(), otp: otp() });
      toast.success("Signed in successfully");
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex items-center justify-center min-h-[80vh] px-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Show
            when={step() === "otp"}
            fallback={
              <form onSubmit={sendOtp} class="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <Button type="submit" class="w-full" disabled={loading()}>
                  {loading() ? "Sending..." : "Send Code"}
                </Button>
              </form>
            }
          >
            <form onSubmit={verifyOtp} class="space-y-4">
              <p class="text-sm text-gray-500">
                Code sent to <strong>{email()}</strong>
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp()}
                onInput={(e) => setOtp(e.currentTarget.value)}
                maxLength={6}
                class="text-center text-lg tracking-widest"
                required
              />
              <Button type="submit" class="w-full" disabled={loading()}>
                {loading() ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                class="w-full"
                onClick={() => setStep("email")}
              >
                Use a different email
              </Button>
            </form>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sign-in.tsx
git commit -m "feat: add sign-in page with email OTP flow"
```

### Task 9.2: Create home page with CreateSession and JoinSession

**Files:**
- Create: `src/client/components/CreateSession.tsx`
- Create: `src/client/components/JoinSession.tsx`
- Create: `src/client/routes/index.tsx`

- [ ] **Step 1: Create src/client/components/CreateSession.tsx**

```tsx
import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { useSession } from "../lib/auth-client";
import { createSession } from "../lib/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card";
import toast from "solid-toast";

export function CreateSession() {
  const session = useSession();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [maxUploads, setMaxUploads] = createSignal(1);
  const [maxVotes, setMaxVotes] = createSignal(3);
  const [loading, setLoading] = createSignal(false);

  const isSignedIn = () => !!session()?.data?.user;

  const handleCreate = async () => {
    if (!name()) {
      toast.error("Please enter a session name");
      return;
    }

    setLoading(true);
    try {
      const result = await createSession({
        name: name(),
        maxUploadsPerUser: maxUploads(),
        maxVotesPerUser: maxVotes(),
      });
      toast.success("Session created!");
      navigate({ to: "/sessions/$code", params: { code: result.code } });
    } catch (err: any) {
      toast.error(err.error ?? "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Session</CardTitle>
        <CardDescription>Start a new photo competition</CardDescription>
      </CardHeader>
      <Show
        when={isSignedIn()}
        fallback={
          <CardContent>
            <p class="text-sm text-gray-500">Please sign in to create sessions.</p>
          </CardContent>
        }
      >
        <CardContent class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="session-name">Session Name</label>
            <Input
              id="session-name"
              placeholder="My Competition"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium" for="max-uploads">Max Uploads Per User</label>
            <Input
              id="max-uploads"
              type="number"
              min={1}
              max={20}
              value={maxUploads()}
              onInput={(e) => setMaxUploads(parseInt(e.currentTarget.value) || 1)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium" for="max-votes">Max Votes Per User</label>
            <Input
              id="max-votes"
              type="number"
              min={1}
              max={50}
              value={maxVotes()}
              onInput={(e) => setMaxVotes(parseInt(e.currentTarget.value) || 3)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" onClick={handleCreate} disabled={loading()}>
            {loading() ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </Show>
    </Card>
  );
}
```

- [ ] **Step 2: Create src/client/components/JoinSession.tsx**

```tsx
import { createSignal } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import toast from "solid-toast";

export function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleJoin = (e: Event) => {
    e.preventDefault();
    const trimmed = code().trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a session code");
      return;
    }
    setLoading(true);
    navigate({ to: "/sessions/$code", params: { code: trimmed } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Session</CardTitle>
        <CardDescription>Enter a session code to join</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} class="space-y-4">
          <Input
            type="text"
            placeholder="Session Code"
            value={code()}
            onInput={(e) => setCode(e.currentTarget.value)}
            class="text-center text-lg uppercase"
            maxLength={6}
            required
          />
          <Button type="submit" class="w-full" disabled={loading()}>
            {loading() ? "Joining..." : "Join Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create src/client/routes/index.tsx**

```tsx
import { createSignal } from "solid-js";
import { CreateSession } from "../components/CreateSession";
import { JoinSession } from "../components/JoinSession";

export default function Home() {
  const [tab, setTab] = createSignal<"join" | "create">("join");

  return (
    <div class="py-8 max-w-sm mx-auto px-4">
      <div class="grid grid-cols-2 mb-4 rounded-lg border border-gray-200 overflow-hidden">
        <button
          class={`py-2 text-sm font-medium transition-colors ${
            tab() === "create"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setTab("create")}
        >
          Create Session
        </button>
        <button
          class={`py-2 text-sm font-medium transition-colors ${
            tab() === "join"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setTab("join")}
        >
          Join Session
        </button>
      </div>

      {tab() === "create" ? <CreateSession /> : <JoinSession />}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/client/components/CreateSession.tsx src/client/components/JoinSession.tsx src/client/routes/index.tsx
git commit -m "feat: add home page with create/join session tabs"
```

### Task 9.3: Create session board page with Gallery, VoteButton, ImageUploader, SessionDashboard

**Files:**
- Create: `src/client/components/Gallery.tsx`
- Create: `src/client/components/VoteButton.tsx`
- Create: `src/client/components/ImageUploader.tsx`
- Create: `src/client/components/SessionDashboard.tsx`
- Create: `src/client/routes/sessions/$code.tsx`

- [ ] **Step 1: Create src/client/components/ImageUploader.tsx**

```tsx
import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
import toast from "solid-toast";

interface ImageUploaderProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

export function ImageUploader(props: ImageUploaderProps) {
  const [dragging, setDragging] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  let fileInput!: HTMLInputElement;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];

    // Validate client-side
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadImage(props.sessionId, file, (pct) => setProgress(pct));
      toast.success("Image uploaded!");
      props.onUploadComplete?.();
    } catch (err: any) {
      toast.error(err.error ?? "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      fileInput.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  return (
    <div
      class={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragging() ? "border-gray-900 bg-gray-50" : "border-gray-300"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Show
        when={!uploading()}
        fallback={
          <div class="space-y-2">
            <p class="text-sm text-gray-600">Uploading... {progress()}%</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-gray-900 h-2 rounded-full transition-all"
                style={{ width: `${progress()}%` }}
              />
            </div>
          </div>
        }
      >
        <p class="text-sm text-gray-500 mb-2">
          Drag & drop an image here, or click to browse
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <Button variant="outline" size="sm" onClick={() => fileInput.click()}>
          Choose File
        </Button>
      </Show>
    </div>
  );
}
```

- [ ] **Step 2: Create src/client/components/VoteButton.tsx**

```tsx
import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import toast from "solid-toast";

interface VoteButtonProps {
  sessionId: string;
  imageId: string;
  voted: boolean;
  disabled: boolean;
  onVoteChange?: () => void;
}

export function VoteButton(props: VoteButtonProps) {
  const handleClick = async () => {
    try {
      if (props.voted) {
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <Button
      size="sm"
      variant={props.voted ? "default" : "outline"}
      disabled={props.disabled && !props.voted}
      onClick={handleClick}
    >
      {props.voted ? "★ Voted" : "☆ Vote"}
    </Button>
  );
}
```

- [ ] **Step 3: Create src/client/components/Gallery.tsx**

```tsx
import { For, Show, createSignal } from "solid-js";
import type { ImageResponse, VoteResponse } from "@shared/types";
import { getImageUrl } from "../lib/api";
import { VoteButton } from "./VoteButton";

interface GalleryProps {
  images: ImageResponse[];
  votes: VoteResponse[];
  sessionId: string;
  votingOpen: boolean;
  maxVotes: number;
  onVoteChange?: () => void;
}

export function Gallery(props: GalleryProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  const votedImageIds = () => new Set(props.votes.map((v) => v.imageId));
  const remainingVotes = () => props.maxVotes - props.votes.length;

  return (
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-semibold">Gallery</h2>
        <Show when={props.votingOpen}>
          <span class="text-sm text-gray-500">{remainingVotes()} votes remaining</span>
        </Show>
      </div>

      <Show
        when={props.images.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg mb-1">No photos yet</p>
            <p class="text-gray-400 text-sm">Be the first to upload!</p>
          </div>
        }
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <For each={props.images}>
            {(image) => (
              <div class="relative aspect-square rounded-md overflow-hidden group cursor-pointer">
                <img
                  src={getImageUrl(image.r2Key)}
                  alt={image.filename}
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setSelectedId(image.id)}
                />
                <Show when={props.votingOpen}>
                  <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <VoteButton
                      sessionId={props.sessionId}
                      imageId={image.id}
                      voted={votedImageIds().has(image.id)}
                      disabled={remainingVotes() <= 0}
                      onVoteChange={props.onVoteChange}
                    />
                  </div>
                </Show>
                <Show when={votedImageIds().has(image.id)}>
                  <div class="absolute top-2 right-2 text-yellow-500 text-lg">★</div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Lightbox */}
      <Show when={selectedId()}>
        <div
          class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div class="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(props.images.find((i) => i.id === selectedId())?.r2Key ?? "")}
              alt="Selected"
              class="w-full h-full object-contain rounded-lg"
            />
            <button
              class="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedId(null)}
            >
              ✕
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
```

- [ ] **Step 4: Create src/client/components/SessionDashboard.tsx**

```tsx
import { Show } from "solid-js";
import type { SessionResponse } from "@shared/types";
import { updateSession } from "../lib/api";
import { Button } from "./ui/Button";
import toast from "solid-toast";

interface SessionDashboardProps {
  session: SessionResponse;
  imageCount: number;
  onSessionUpdate?: () => void;
}

export function SessionDashboard(props: SessionDashboardProps) {
  const toggleUploads = async () => {
    try {
      await updateSession(props.session.id, { uploadOpen: !props.session.uploadOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  const toggleVoting = async () => {
    try {
      await updateSession(props.session.id, { votingOpen: !props.session.votingOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  return (
    <div class="p-4 bg-gray-100 rounded-lg space-y-3">
      <h2 class="text-lg font-semibold">Dashboard</h2>
      <div class="grid grid-cols-2 gap-2 items-center text-sm">
        <span>Total Images:</span>
        <span class="text-right">{props.imageCount}</span>

        <span class={props.session.uploadOpen ? "text-green-600" : "text-red-500"}>
          {props.session.uploadOpen ? "Uploads Open" : "Uploads Closed"}
        </span>
        <div class="text-right">
          <Button size="sm" variant="outline" onClick={toggleUploads}>
            {props.session.uploadOpen ? "🔓" : "🔒"}
          </Button>
        </div>

        <span class={props.session.votingOpen ? "text-green-600" : "text-red-500"}>
          {props.session.votingOpen ? "Voting Open" : "Voting Closed"}
        </span>
        <div class="text-right">
          <Button size="sm" variant="outline" onClick={toggleVoting}>
            {props.session.votingOpen ? "🔓" : "🔒"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create src/client/routes/sessions/$code.tsx**

```tsx
import { createSignal, createEffect, onMount, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { Button } from "../../components/ui/Button";
import type { SessionResponse, ImageResponse, VoteResponse, WsEvent } from "@shared/types";
import toast from "solid-toast";

export default function SessionBoard() {
  const params = useParams({ from: "/sessions/$code" });
  const authSession = useSession();

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [images, setImages] = createSignal<ImageResponse[]>([]);
  const [myVotes, setMyVotes] = createSignal<VoteResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const isOwner = () => session()?.createdBy === authSession()?.data?.user?.id;

  const fetchData = async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);

      const [imgs, votes] = await Promise.all([
        getImages(sess.id),
        getMyVotes(sess.id),
      ]);
      setImages(imgs);
      setMyVotes(votes);
    } catch (err: any) {
      setError(err.error ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchData);

  // WebSocket for real-time updates
  createEffect(() => {
    const sess = session();
    if (!sess) return;

    const { lastEvent } = createSessionSocket(sess.id);

    createEffect(() => {
      const event = lastEvent();
      if (!event) return;

      switch (event.type) {
        case "image-added":
          setImages((prev) => [...prev, event.data]);
          break;
        case "image-removed":
          setImages((prev) => prev.filter((i) => i.id !== event.data.id));
          break;
        case "vote-cast":
          // Refresh votes if it's from current user
          if (event.data.userId === authSession()?.data?.user?.id) {
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "vote-removed":
          if (event.data.userId === authSession()?.data?.user?.id) {
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "session-updated":
          setSession((prev) =>
            prev ? { ...prev, uploadOpen: event.data.uploadOpen, votingOpen: event.data.votingOpen } : prev
          );
          break;
      }
    });
  });

  return (
    <div class="container mx-auto px-4 py-4">
      <Show when={!loading()} fallback={<div class="text-center py-12 text-gray-500">Loading session...</div>}>
        <Show when={!error()} fallback={<div class="text-center py-12 text-red-500">{error()}</div>}>
          <Show when={session()}>
            {(sess) => (
              <>
                {/* Status banner */}
                <div class={`rounded-lg p-2 mb-4 text-center text-sm font-medium ${
                  sess().votingOpen ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {sess().votingOpen ? (
                    <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                  ) : (
                    <span>
                      Voting Closed —{" "}
                      <Link to="/sessions/$code/results" params={{ code: params.code }} class="underline">
                        View Results
                      </Link>
                    </span>
                  )}
                </div>

                {/* Owner dashboard */}
                <Show when={isOwner()}>
                  <SessionDashboard
                    session={sess()}
                    imageCount={images().length}
                    onSessionUpdate={fetchData}
                  />
                </Show>

                {/* Uploader */}
                <Show when={sess().uploadOpen}>
                  <div class="my-4">
                    <ImageUploader sessionId={sess().id} onUploadComplete={fetchData} />
                  </div>
                </Show>

                {/* Gallery */}
                <Gallery
                  images={images()}
                  votes={myVotes()}
                  sessionId={sess().id}
                  votingOpen={sess().votingOpen}
                  maxVotes={sess().maxVotesPerUser}
                  onVoteChange={fetchData}
                />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/client/components/ImageUploader.tsx src/client/components/VoteButton.tsx src/client/components/Gallery.tsx src/client/components/SessionDashboard.tsx src/client/routes/sessions/\$code.tsx
git commit -m "feat: add session board page with gallery, upload, voting, dashboard"
```

### Task 9.4: Create results page

**Files:**
- Create: `src/client/routes/sessions/$code.results.tsx`

- [ ] **Step 1: Create src/client/routes/sessions/$code.results.tsx**

```tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResults, getImageUrl } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import type { SessionResponse, ResultItem } from "@shared/types";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);
      const res = await getResults(sess.id);
      setResults(res);
    } catch {
      // Error handled by loading state
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center gap-4 mb-6">
        <Link to="/sessions/$code" params={{ code: params.code }}>
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 class="text-2xl font-bold">Results</h1>
      </div>

      <Show when={!loading()} fallback={<div class="text-center py-12 text-gray-500">Loading results...</div>}>
        <div class="space-y-4 max-w-2xl mx-auto">
          <For each={results()}>
            {(item, index) => (
              <div class={`flex items-center gap-4 p-3 rounded-lg ${
                index() === 0 ? "bg-yellow-50 border border-yellow-200" :
                index() === 1 ? "bg-gray-50 border border-gray-200" :
                index() === 2 ? "bg-orange-50 border border-orange-200" :
                "bg-white border border-gray-100"
              }`}>
                <span class="text-2xl font-bold text-gray-400 w-8 text-center">
                  {index() === 0 ? "🥇" : index() === 1 ? "🥈" : index() === 2 ? "🥉" : `${index() + 1}`}
                </span>
                <img
                  src={getImageUrl(item.r2Key)}
                  alt={item.filename}
                  class="w-16 h-16 rounded-md object-cover"
                />
                <div class="flex-1">
                  <p class="text-sm text-gray-500 truncate">{item.filename}</p>
                </div>
                <span class="text-lg font-semibold">
                  {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                </span>
              </div>
            )}
          </For>

          <Show when={results().length === 0}>
            <div class="text-center py-12 text-gray-400">
              No results yet — no images have been uploaded.
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sessions/\$code.results.tsx
git commit -m "feat: add results/leaderboard page"
```

### Task 9.5: Create static pages (ToS, Policy)

**Files:**
- Create: `src/client/routes/tos.tsx`
- Create: `src/client/routes/policy.tsx`

- [ ] **Step 1: Create src/client/routes/tos.tsx**

```tsx
export default function ToS() {
  return (
    <div class="max-w-2xl mx-auto px-4 py-8 prose">
      <h1>Terms of Service</h1>
      <p>By using DouDou, you agree to these terms.</p>
      <h2>Usage</h2>
      <p>DouDou is a photo competition platform. You may upload images you own or have rights to share. Do not upload inappropriate, illegal, or copyrighted content.</p>
      <h2>Accounts</h2>
      <p>You are responsible for maintaining the security of your account. We use email-based authentication.</p>
      <h2>Content</h2>
      <p>You retain ownership of images you upload. By uploading, you grant DouDou a license to display the image within the platform for the purpose of the competition.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create src/client/routes/policy.tsx**

```tsx
export default function Policy() {
  return (
    <div class="max-w-2xl mx-auto px-4 py-8 prose">
      <h1>Privacy Policy</h1>
      <p>Your privacy matters to us.</p>
      <h2>Data We Collect</h2>
      <p>We collect your email address for authentication and the images you upload to competition sessions.</p>
      <h2>How We Use Data</h2>
      <p>Your data is used solely to operate the competition platform. We do not sell your data to third parties.</p>
      <h2>Data Storage</h2>
      <p>Data is stored on Cloudflare infrastructure. Images are stored in Cloudflare R2.</p>
      <h2>Contact</h2>
      <p>For questions about your data, contact us at privacy@doudou.muniee.com.</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/routes/tos.tsx src/client/routes/policy.tsx
git commit -m "feat: add Terms of Service and Privacy Policy pages"
```

### Task 9.6: Create client-side upload utilities

**Files:**
- Create: `src/client/lib/upload.ts`

- [ ] **Step 1: Create src/client/lib/upload.ts**

```typescript
/**
 * Client-side image processing utilities.
 * HEIC conversion and image compression before upload.
 */

export async function compressImage(file: File, quality = 0.85): Promise<File> {
  // Skip non-compressible formats
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Don't upscale small images
      const maxDim = 2048;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression didn't help — return original
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fall back to original on error
    };

    img.src = url;
  });
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (
    file.type !== "image/heic" &&
    file.type !== "image/heif" &&
    !file.name.toLowerCase().endsWith(".heic")
  ) {
    return file;
  }

  // Dynamic import to avoid bundling heic2any for all users
  const { default: heic2any } = await import("heic2any");

  const blob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 1.0,
  });

  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  return new File(
    [resultBlob],
    file.name.replace(/\.(heic|HEIC|heif|HEIF)$/, ".jpg"),
    { type: "image/jpeg" }
  );
}

export async function processImageForUpload(file: File): Promise<File> {
  let processed = await convertHeicToJpeg(file);
  processed = await compressImage(processed);
  return processed;
}
```

- [ ] **Step 2: Add heic2any as a dependency**

Run: `npm install heic2any`

- [ ] **Step 3: Commit**

```bash
git add src/client/lib/upload.ts package.json package-lock.json
git commit -m "feat: add client-side image compression and HEIC conversion"
```

### Task 9.7: Final wiring — verify full dev stack runs

- [ ] **Step 1: Run D1 migration locally**

Run: `npm run db:migrate`
Expected: Migration applies successfully.

- [ ] **Step 2: Start dev environment**

Run: `npm run dev`
Expected: Vite dev server starts (port 5173) and wrangler dev starts (port 8787). Opening `http://localhost:5173` shows the SPA.

- [ ] **Step 3: Verify API health endpoint**

Run: `curl http://localhost:8787/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: finalize dev environment and verify full stack"
```

---

## Summary

| Phase | What It Builds | Tasks |
|-------|---------------|-------|
| 1 | Project scaffolding, deps, configs, types, migration | 1.1–1.5 |
| 2 | Hono API skeleton + Worker entry | 2.1–2.3 |
| 3 | Better Auth (config, route mount, middleware) | 3.1–3.3 |
| 4 | Session CRUD routes | 4.1–4.2 |
| 5 | Image upload/serve/delete (R2) | 5.1–5.2 |
| 6 | Voting routes | 6.1–6.2 |
| 7 | Durable Objects, WebSocket, broadcast wiring | 7.1–7.3 |
| 8 | SolidJS SPA shell, router, UI primitives, auth client, WS hook | 8.1–8.6 |
| 9 | All client pages and feature components | 9.1–9.7 |

**Note:** GSAP is listed as a dependency but basic page transition animations (fade/slide between routes, gallery stagger, vote bounce) are deferred to Sub-Project 2 (UI/Design System) where the full rubber-hose animation system is designed. The foundation installs GSAP so it's available, but doesn't implement animations — keeping scope focused on functionality.
