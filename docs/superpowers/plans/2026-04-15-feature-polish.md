# Feature Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 feature areas to DouDou: polished upload UX (preview, webcam, retry), voting UX (animations, remaining indicator), session management (rounds, timer, session list), QR sharing, swipeable lightbox with voting, celebration results with confetti, and presence indicators.

**Architecture:** Rounds model extends existing flat session structure. Durable Object gains alarm-based timer support. All new UI uses existing Toontown design system. Client-side QR generation, canvas confetti, and pointer-event swipe detection — no heavy external libraries.

**Tech Stack:** Hono API (Cloudflare Workers), D1, R2, Durable Objects with Alarms, SolidJS, TanStack Solid Router, GSAP, Tailwind CSS, `qrcode` npm package

**Spec:** `docs/superpowers/specs/2026-04-15-feature-polish-design.md`

---

### Task 1: Database Migration — Rounds Schema

**Files:**
- Create: `migrations/0002_rounds.sql`

- [ ] **Step 1: Write migration SQL**

Create `migrations/0002_rounds.sql`:

```sql
-- Add rounds support to competition_sessions
ALTER TABLE competition_sessions ADD COLUMN total_rounds INTEGER NOT NULL DEFAULT 1;
ALTER TABLE competition_sessions ADD COLUMN current_round INTEGER NOT NULL DEFAULT 1;
ALTER TABLE competition_sessions ADD COLUMN voting_duration_minutes INTEGER;
ALTER TABLE competition_sessions ADD COLUMN expires_at TEXT;

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL REFERENCES competition_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'uploading', 'voting', 'closed')),
  voting_started_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);

-- Add round_id to session_images and votes
ALTER TABLE session_images ADD COLUMN round_id TEXT REFERENCES rounds(id);
ALTER TABLE votes ADD COLUMN round_id TEXT REFERENCES rounds(id);

-- Backfill: create a round for each existing session and link existing data
INSERT INTO rounds (id, session_id, round_number, status)
SELECT lower(hex(randomblob(8))), id, 1,
  CASE WHEN voting_open = 1 THEN 'voting'
       WHEN upload_open = 1 THEN 'uploading'
       ELSE 'closed'
  END
FROM competition_sessions;

-- Set expires_at for existing sessions
UPDATE competition_sessions SET expires_at = datetime(created_at, '+7 days');

-- Link existing images and votes to their session's round
UPDATE session_images SET round_id = (
  SELECT r.id FROM rounds r WHERE r.session_id = session_images.session_id AND r.round_number = 1
);
UPDATE votes SET round_id = (
  SELECT r.id FROM rounds r WHERE r.session_id = votes.session_id AND r.round_number = 1
);
```

- [ ] **Step 2: Run migration locally**

```bash
npx wrangler d1 execute doudou-db --local --file=migrations/0002_rounds.sql
```

Expected: Migration succeeds.

- [ ] **Step 3: Commit**

```bash
git add migrations/0002_rounds.sql
git commit -m "feat: add rounds schema migration"
```

---

### Task 2: Update Shared Types and Validation

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/validation.ts`

- [ ] **Step 1: Update `src/shared/types.ts`**

Add the `Round` database type after the `Vote` interface:

```ts
export interface Round {
  id: string;
  session_id: string;
  round_number: number;
  status: "pending" | "uploading" | "voting" | "closed";
  voting_started_at: string | null;
  created_at: string;
}
```

Add to `CompetitionSession` interface (after `updated_at`):
```ts
  total_rounds: number;
  current_round: number;
  voting_duration_minutes: number | null;
  expires_at: string | null;
```

Add `RoundResponse` after `SessionResponse`:
```ts
export interface RoundResponse {
  id: string;
  sessionId: string;
  roundNumber: number;
  status: "pending" | "uploading" | "voting" | "closed";
  votingStartedAt: string | null;
  createdAt: string;
}
```

Update `SessionResponse` — add after `votingOpen`:
```ts
  totalRounds: number;
  currentRound: number;
  votingDurationMinutes: number | null;
  expiresAt: string | null;
```

Add `round_id` to `SessionImage` and `Vote` interfaces:
- `SessionImage`: add `round_id: string;`
- `Vote`: add `round_id: string;`

Add `roundId` to `ImageResponse` and `VoteResponse`:
- `ImageResponse`: add `roundId: string;`
- `VoteResponse`: add `roundId: string;`

Update `WsEvent` union — add these variants:
```ts
  | { type: "round-advanced"; data: { roundNumber: number; status: string } }
  | { type: "presence-count"; data: { count: number } }
```

Note: the existing `| { type: "presence"; data: { count: number } }` should be replaced with `| { type: "presence-count"; data: { count: number } }` for consistency.

- [ ] **Step 2: Update `src/shared/validation.ts`**

Update `createSessionSchema`:
```ts
export const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  maxUploadsPerUser: z.number().int().min(1).max(20).default(1),
  maxVotesPerUser: z.number().int().min(1).max(50).default(3),
  totalRounds: z.number().int().min(1).max(10).default(1),
  votingDurationMinutes: z.number().int().min(1).max(1440).nullable().default(null),
});
```

Remove `updateSessionSchema` (no longer used — round flow replaces direct toggles).

Add new schema:
```ts
export const startVotingSchema = z.object({});
export const closeVotingSchema = z.object({});
export const advanceRoundSchema = z.object({});
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts src/shared/validation.ts
git commit -m "feat: update shared types and validation for rounds"
```

---

### Task 3: Update Session API Routes

**Files:**
- Modify: `src/api/routes/sessions.ts`

- [ ] **Step 1: Update session creation to create rounds**

In the `POST /` handler, after creating the session, create the round rows:

After the `INSERT INTO competition_sessions` and getting `result`, add:
```ts
// Create rounds
const roundValues = [];
for (let i = 1; i <= parsed.data.totalRounds; i++) {
  const roundId = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  roundValues.push(`('${roundId}', '${result.id}', ${i}, '${i === 1 ? "uploading" : "pending"}')`);
}
await c.env.DB.prepare(
  `INSERT INTO rounds (id, session_id, round_number, status) VALUES ${roundValues.join(", ")}`
).run();
```

Also update the `INSERT INTO competition_sessions` query to include the new columns:
```sql
INSERT INTO competition_sessions (name, code, created_by, max_uploads_per_user, max_votes_per_user, total_rounds, voting_duration_minutes, expires_at)
VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
RETURNING *
```

Bind: `name, code, userId, maxUploadsPerUser, maxVotesPerUser, totalRounds, votingDurationMinutes`

- [ ] **Step 2: Update `toSessionResponse` to include new fields**

```ts
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
    totalRounds: row.total_rounds,
    currentRound: row.current_round,
    votingDurationMinutes: row.voting_duration_minutes,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
```

- [ ] **Step 3: Add `GET /mine` endpoint**

```ts
// GET /api/sessions/mine — sessions created by current user
sessions.get("/mine", requireAuth, async (c) => {
  const userId = c.get("userId");

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM competition_sessions WHERE created_by = ? ORDER BY created_at DESC LIMIT 10`
  )
    .bind(userId)
    .all<CompetitionSession>();

  return c.json(results.map(toSessionResponse));
});
```

**IMPORTANT:** Place this route BEFORE the `GET /:code` route, otherwise "mine" gets matched as a `:code` param.

- [ ] **Step 4: Add round management endpoints**

Add `toRoundResponse` helper:
```ts
function toRoundResponse(row: Round): RoundResponse {
  return {
    id: row.id,
    sessionId: row.session_id,
    roundNumber: row.round_number,
    status: row.status,
    votingStartedAt: row.voting_started_at,
    createdAt: row.created_at,
  };
}
```

Add these routes (add `import type { Round, RoundResponse } from "../../shared/types"` at top):

```ts
// GET /api/sessions/:id/rounds — list rounds for a session
sessions.get("/:id/rounds", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM rounds WHERE session_id = ? ORDER BY round_number ASC"
  )
    .bind(sessionId)
    .all<Round>();
  return c.json(results.map(toRoundResponse));
});

// PUT /api/sessions/:id/rounds/:roundNumber/start-voting — owner starts voting for a round
sessions.put("/:id/rounds/:roundNumber/start-voting", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const roundNumber = parseInt(c.req.param("roundNumber"));
  const userId = c.get("userId");

  const session = await c.env.DB.prepare("SELECT * FROM competition_sessions WHERE id = ?")
    .bind(sessionId).first<CompetitionSession>();
  if (!session) return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  if (session.created_by !== userId) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

  const round = await c.env.DB.prepare("SELECT * FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, roundNumber).first<Round>();
  if (!round) return c.json({ error: "Round not found", code: "NOT_FOUND" }, 404);
  if (round.status !== "uploading") return c.json({ error: "Round is not in uploading state", code: "INVALID_STATE" }, 400);

  // Close uploads, open voting
  await c.env.DB.prepare("UPDATE rounds SET status = 'voting', voting_started_at = datetime('now') WHERE id = ?")
    .bind(round.id).run();
  await c.env.DB.prepare("UPDATE competition_sessions SET upload_open = 0, voting_open = 1, updated_at = datetime('now') WHERE id = ?")
    .bind(sessionId).run();

  await c.env.CACHE.delete(`session:code:${session.code}`);

  // If timer is set, schedule alarm on DO
  if (session.voting_duration_minutes) {
    const doId = c.env.SESSION_ROOM.idFromName(sessionId);
    const stub = c.env.SESSION_ROOM.get(doId);
    await stub.fetch(new Request("http://internal/set-alarm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        roundId: round.id,
        durationMinutes: session.voting_duration_minutes,
      }),
    }));
  }

  await broadcastToSession(c.env, sessionId, {
    type: "session-updated",
    data: { uploadOpen: false, votingOpen: true },
  });

  const updated = await c.env.DB.prepare("SELECT * FROM rounds WHERE id = ?")
    .bind(round.id).first<Round>();
  return c.json(toRoundResponse(updated!));
});

// PUT /api/sessions/:id/rounds/:roundNumber/close-voting — owner closes voting
sessions.put("/:id/rounds/:roundNumber/close-voting", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const roundNumber = parseInt(c.req.param("roundNumber"));
  const userId = c.get("userId");

  const session = await c.env.DB.prepare("SELECT * FROM competition_sessions WHERE id = ?")
    .bind(sessionId).first<CompetitionSession>();
  if (!session) return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  if (session.created_by !== userId) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

  const round = await c.env.DB.prepare("SELECT * FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, roundNumber).first<Round>();
  if (!round) return c.json({ error: "Round not found", code: "NOT_FOUND" }, 404);
  if (round.status !== "voting") return c.json({ error: "Round is not in voting state", code: "INVALID_STATE" }, 400);

  await c.env.DB.prepare("UPDATE rounds SET status = 'closed' WHERE id = ?")
    .bind(round.id).run();
  await c.env.DB.prepare("UPDATE competition_sessions SET voting_open = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(sessionId).run();

  await c.env.CACHE.delete(`session:code:${session.code}`);

  await broadcastToSession(c.env, sessionId, {
    type: "session-updated",
    data: { uploadOpen: false, votingOpen: false },
  });

  const updated = await c.env.DB.prepare("SELECT * FROM rounds WHERE id = ?")
    .bind(round.id).first<Round>();
  return c.json(toRoundResponse(updated!));
});

// PUT /api/sessions/:id/advance-round — owner advances to next round
sessions.put("/:id/advance-round", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const session = await c.env.DB.prepare("SELECT * FROM competition_sessions WHERE id = ?")
    .bind(sessionId).first<CompetitionSession>();
  if (!session) return c.json({ error: "Session not found", code: "NOT_FOUND" }, 404);
  if (session.created_by !== userId) return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  if (session.current_round >= session.total_rounds) {
    return c.json({ error: "Already on the last round", code: "INVALID_STATE" }, 400);
  }

  const currentRound = await c.env.DB.prepare("SELECT * FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, session.current_round).first<Round>();
  if (currentRound && currentRound.status !== "closed") {
    return c.json({ error: "Current round must be closed first", code: "INVALID_STATE" }, 400);
  }

  const nextRoundNumber = session.current_round + 1;
  await c.env.DB.prepare("UPDATE rounds SET status = 'uploading' WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, nextRoundNumber).run();
  await c.env.DB.prepare(
    "UPDATE competition_sessions SET current_round = ?, upload_open = 1, voting_open = 0, updated_at = datetime('now') WHERE id = ?"
  ).bind(nextRoundNumber, sessionId).run();

  await c.env.CACHE.delete(`session:code:${session.code}`);

  await broadcastToSession(c.env, sessionId, {
    type: "round-advanced",
    data: { roundNumber: nextRoundNumber, status: "uploading" },
  });

  await broadcastToSession(c.env, sessionId, {
    type: "session-updated",
    data: { uploadOpen: true, votingOpen: false },
  });

  return c.json({ success: true, currentRound: nextRoundNumber });
});
```

- [ ] **Step 5: Remove the PATCH /:id route**

Delete the entire `sessions.patch("/:id", ...)` handler — round flow replaces direct upload/voting toggles.

- [ ] **Step 6: Commit**

```bash
git add src/api/routes/sessions.ts
git commit -m "feat: update session API with rounds, round management, and my-sessions endpoints"
```

---

### Task 4: Update Image and Vote API Routes for Rounds

**Files:**
- Modify: `src/api/routes/images.ts`
- Modify: `src/api/routes/votes.ts`

- [ ] **Step 1: Update image routes**

In `GET /sessions/:id/images`, add optional `round` query param filter:
```ts
const roundParam = c.req.query("round");
let query = "SELECT * FROM session_images WHERE session_id = ?";
const binds: (string | number)[] = [sessionId];

if (roundParam) {
  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, parseInt(roundParam)).first<{ id: string }>();
  if (round) {
    query += " AND round_id = ?";
    binds.push(round.id);
  }
}
query += " ORDER BY created_at ASC";
const { results } = await c.env.DB.prepare(query).bind(...binds).all<SessionImage>();
```

In `POST /sessions/:id/images`, add round_id to the insert. Look up the current round:
```ts
// Get current uploading round
const currentRound = await c.env.DB.prepare(
  "SELECT id FROM rounds WHERE session_id = ? AND status = 'uploading'"
).bind(sessionId).first<{ id: string }>();

if (!currentRound) {
  return c.json({ error: "No round is accepting uploads", code: "UPLOAD_CLOSED" }, 403);
}
```

Replace the `session.upload_open` check with the round check above.

Update the INSERT to include `round_id`:
```sql
INSERT INTO session_images (id, session_id, user_id, r2_key, filename, mime_type, round_id)
VALUES (?, ?, ?, ?, ?, ?, ?)
```

Add `currentRound.id` to the bind values.

Also check upload count per-round instead of per-session:
```ts
const { count } = await c.env.DB.prepare(
  "SELECT COUNT(*) as count FROM session_images WHERE session_id = ? AND user_id = ? AND round_id = ?"
).bind(sessionId, userId, currentRound.id).first<{ count: number }>() ?? { count: 0 };
```

Update `toImageResponse` to include `roundId`:
```ts
function toImageResponse(row: SessionImage): ImageResponse {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    r2Key: row.r2_key,
    filename: row.filename,
    mimeType: row.mime_type,
    roundId: row.round_id,
    createdAt: row.created_at,
  };
}
```

In `DELETE /sessions/:id/images/:imageId`, also allow session owner to delete any image (not just own):
```ts
const session = await c.env.DB.prepare("SELECT * FROM competition_sessions WHERE id = ?")
  .bind(sessionId).first<CompetitionSession>();

if (image.user_id !== userId && session?.created_by !== userId) {
  return c.json({ error: "You can only delete your own images", code: "FORBIDDEN" }, 403);
}
```

- [ ] **Step 2: Update vote routes**

In `POST /:id/votes`, look up current voting round:
```ts
const currentRound = await c.env.DB.prepare(
  "SELECT id FROM rounds WHERE session_id = ? AND status = 'voting'"
).bind(sessionId).first<{ id: string }>();

if (!currentRound) {
  return c.json({ error: "Voting is closed", code: "VOTING_CLOSED" }, 403);
}
```

Replace the `session.voting_open` check with the round check above.

Update the INSERT to include `round_id`:
```sql
INSERT INTO votes (session_id, user_id, image_id, round_id) VALUES (?, ?, ?, ?)
```

Bind: `sessionId, userId, imageId, currentRound.id`

Check vote count per-round:
```ts
const { count } = await c.env.DB.prepare(
  "SELECT COUNT(*) as count FROM votes WHERE session_id = ? AND user_id = ? AND round_id = ?"
).bind(sessionId, userId, currentRound.id).first<{ count: number }>() ?? { count: 0 };
```

In `GET /:id/votes/mine`, add optional `round` query param:
```ts
const roundParam = c.req.query("round");
let query = "SELECT * FROM votes WHERE session_id = ? AND user_id = ?";
const binds: (string | number)[] = [sessionId, userId];

if (roundParam) {
  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, parseInt(roundParam)).first<{ id: string }>();
  if (round) {
    query += " AND round_id = ?";
    binds.push(round.id);
  }
}
const { results } = await c.env.DB.prepare(query).bind(...binds).all<Vote>();
```

In `GET /:id/results`, add round filtering:
```ts
const roundParam = c.req.query("round");
let roundFilter = "";
const binds: (string | number)[] = [sessionId];

if (roundParam && roundParam !== "overall") {
  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE session_id = ? AND round_number = ?")
    .bind(sessionId, parseInt(roundParam)).first<{ id: string }>();
  if (round) {
    roundFilter = " AND si.round_id = ?";
    binds.push(round.id);
  }
}

const { results } = await c.env.DB.prepare(
  `SELECT si.id as imageId, si.r2_key as r2Key, si.filename, COUNT(v.id) as voteCount
   FROM session_images si
   LEFT JOIN votes v ON v.image_id = si.id${roundParam && roundParam !== "overall" ? " AND v.round_id = si.round_id" : ""}
   WHERE si.session_id = ?${roundFilter}
   GROUP BY si.id ORDER BY voteCount DESC, si.created_at ASC`
).bind(...binds).all<ResultItem>();
```

- [ ] **Step 3: Commit**

```bash
git add src/api/routes/images.ts src/api/routes/votes.ts
git commit -m "feat: update image and vote routes for round-aware operations"
```

---

### Task 5: Update Durable Object — Timer Alarms + Presence Events

**Files:**
- Modify: `src/api/durable-objects/session-room.ts`

- [ ] **Step 1: Add alarm support and consistent presence event name**

Replace the entire file content:

```ts
import type { WsEvent, Env } from "../../shared/types";

interface ConnectedClient {
  userId: string;
  joinedAt: number;
}

interface AlarmData {
  sessionId: string;
  roundId: string;
}

export class SessionRoom implements DurableObject {
  private connections: Map<WebSocket, ConnectedClient> = new Map();

  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/broadcast") {
      return this.handleBroadcast(request);
    }

    if (url.pathname === "/set-alarm") {
      return this.handleSetAlarm(request);
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

    this.broadcastEvent({
      type: "presence-count",
      data: { count: this.connections.size },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const event = (await request.json()) as WsEvent;
    this.broadcastEvent(event);
    return new Response("OK");
  }

  private async handleSetAlarm(request: Request): Promise<Response> {
    const { sessionId, roundId, durationMinutes } = await request.json() as {
      sessionId: string;
      roundId: string;
      durationMinutes: number;
    };

    // Store alarm data for when alarm fires
    await this.state.storage.put("alarm-data", { sessionId, roundId } as AlarmData);

    // Schedule alarm
    const alarmTime = Date.now() + durationMinutes * 60 * 1000;
    await this.state.storage.setAlarm(alarmTime);

    return new Response("OK");
  }

  async alarm(): Promise<void> {
    const data = await this.state.storage.get<AlarmData>("alarm-data");
    if (!data) return;

    // Close voting for the round via D1
    await this.env.DB.prepare("UPDATE rounds SET status = 'closed' WHERE id = ?")
      .bind(data.roundId).run();
    await this.env.DB.prepare(
      "UPDATE competition_sessions SET voting_open = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(data.sessionId).run();

    // Broadcast session update
    this.broadcastEvent({
      type: "session-updated",
      data: { uploadOpen: false, votingOpen: false },
    });

    // Clean up
    await this.state.storage.delete("alarm-data");
  }

  private broadcastEvent(event: WsEvent): void {
    const message = JSON.stringify(event);
    for (const [ws] of this.connections) {
      try {
        ws.send(message);
      } catch {
        this.connections.delete(ws);
      }
    }
  }

  webSocketClose(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence-count",
      data: { count: this.connections.size },
    });
  }

  webSocketError(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence-count",
      data: { count: this.connections.size },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/durable-objects/session-room.ts
git commit -m "feat: add timer alarm and presence-count to SessionRoom DO"
```

---

### Task 6: Update Client API and WebSocket Libraries

**Files:**
- Modify: `src/client/lib/api.ts`
- Modify: `src/client/lib/ws.ts`

- [ ] **Step 1: Add new API functions to `api.ts`**

Add imports for new types at top:
```ts
import type { RoundResponse } from "@shared/types";
```

Add these functions:

```ts
export const getMySessions = () =>
  request<SessionResponse[]>("/sessions/mine");

export const getRounds = (sessionId: string) =>
  request<RoundResponse[]>(`/sessions/${sessionId}/rounds`);

export const startVoting = (sessionId: string, roundNumber: number) =>
  request<RoundResponse>(`/sessions/${sessionId}/rounds/${roundNumber}/start-voting`, {
    method: "PUT",
  });

export const closeVoting = (sessionId: string, roundNumber: number) =>
  request<RoundResponse>(`/sessions/${sessionId}/rounds/${roundNumber}/close-voting`, {
    method: "PUT",
  });

export const advanceRound = (sessionId: string) =>
  request<{ success: boolean; currentRound: number }>(`/sessions/${sessionId}/advance-round`, {
    method: "PUT",
  });

export const getImagesForRound = (sessionId: string, round: number) =>
  request<ImageResponse[]>(`/sessions/${sessionId}/images?round=${round}`);

export const getMyVotesForRound = (sessionId: string, round: number) =>
  request<VoteResponse[]>(`/sessions/${sessionId}/votes/mine?round=${round}`);

export const getResultsForRound = (sessionId: string, round: number | "overall") =>
  request<ResultItem[]>(`/sessions/${sessionId}/results?round=${round}`);
```

Remove the `updateSession` function (no longer used — round flow replaces it).

- [ ] **Step 2: Update `ws.ts` to handle new event types**

In the `createSessionSocket` function, add a `presenceCount` signal:

After `const [lastEvent, setLastEvent] = ...`:
```ts
const [presenceCount, setPresenceCount] = createSignal(0);
```

In the `message` event handler, after `setLastEvent(data)`:
```ts
if (data.type === "presence-count") {
  setPresenceCount(data.data.count);
}
```

Update the return type to include `presenceCount`:
```ts
interface UseSessionSocketReturn {
  lastEvent: () => WsEvent | null;
  connected: () => boolean;
  reconnect: () => void;
  presenceCount: () => number;
}
```

Return `presenceCount` from the function.

- [ ] **Step 3: Commit**

```bash
git add src/client/lib/api.ts src/client/lib/ws.ts
git commit -m "feat: add round management and presence APIs to client"
```

---

### Task 7: Install QR Library + Client Utilities

**Files:**
- Create: `src/client/lib/swipe.ts`
- Create: `src/client/lib/confetti.ts`
- Modify: `src/client/lib/animations.ts`

- [ ] **Step 1: Install qrcode package**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Create swipe detection utility**

Create `src/client/lib/swipe.ts`:

```ts
interface SwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function createSwipeHandler(el: HTMLElement, options: SwipeOptions) {
  const threshold = options.threshold ?? 50;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onPointerDown = (e: PointerEvent) => {
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!tracking) return;
    tracking = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Only trigger if horizontal movement > vertical movement
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) {
        options.onSwipeRight();
      } else {
        options.onSwipeLeft();
      }
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointerup", onPointerUp);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointerup", onPointerUp);
  };
}
```

- [ ] **Step 3: Create confetti particle system**

Create `src/client/lib/confetti.ts`:

```ts
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  isCircle: boolean;
}

const COLORS = ["#FFCB47", "#E05A47", "#4A90C4", "#5AAD72"];
const DURATION = 2500;
const PARTICLE_COUNT = 120;

export function launchConfetti(container: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const particles: Particle[] = [];

  // Create particles from center-top
  const cx = canvas.width / 2;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.3,
      vx: (Math.random() - 0.5) * 12,
      vy: -(Math.random() * 8 + 4),
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      isCircle: Math.random() > 0.5,
    });
  }

  const startTime = Date.now();
  const gravity = 0.15;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > DURATION) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fadeStart = DURATION * 0.7;
    for (const p of particles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (elapsed > fadeStart) {
        p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (DURATION - fadeStart));
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.isCircle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
```

- [ ] **Step 4: Add new animation presets to `animations.ts`**

Add these functions at the end of the file:

```ts
// --- Lightbox animations ---

export function lightboxOpen(el: HTMLElement) {
  return gsap.fromTo(el,
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
  );
}

export function lightboxClose(el: HTMLElement) {
  return gsap.to(el, {
    scale: 0.9,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
  });
}

export function imageNavigate(outEl: HTMLElement, inEl: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(outEl, { opacity: 0, duration: 0.15, ease: "power2.in" });
  tl.fromTo(inEl, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" });
  return tl;
}

// --- Vote animations ---

export function goldenPulse(el: HTMLElement) {
  gsap.fromTo(el,
    { scale: 1, backgroundColor: "#FFCB47" },
    { scale: 1.2, duration: 0.15, ease: "power2.out",
      onComplete: () => {
        gsap.to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
      }
    }
  );
}

export function voteUndo(el: HTMLElement) {
  return gsap.to(el, {
    scale: 0,
    opacity: 0,
    duration: 0.25,
    ease: "power2.in",
  });
}

export function countdownPulse(el: HTMLElement) {
  gsap.fromTo(el,
    { scale: 1 },
    { scale: 1.15, duration: 0.15, ease: "power2.out",
      onComplete: () => {
        gsap.to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
      }
    }
  );
}

// --- Reveal animations ---

export function revealSlideFromLeft(el: HTMLElement) {
  return gsap.fromTo(el,
    { x: -100, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
  );
}

export function revealSlideFromRight(el: HTMLElement) {
  return gsap.fromTo(el,
    { x: 100, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
  );
}

export function revealScaleUp(el: HTMLElement) {
  return gsap.fromTo(el,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/client/lib/swipe.ts src/client/lib/confetti.ts src/client/lib/animations.ts package.json package-lock.json
git commit -m "feat: add swipe detection, confetti system, and new animation presets"
```

---

### Task 8: Webcam Capture Component

**Files:**
- Create: `src/client/components/WebcamCapture.tsx`

- [ ] **Step 1: Create WebcamCapture component**

```tsx
import { createSignal, onCleanup, Show } from "solid-js";
import { Button } from "./ui/Button";

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function WebcamCapture(props: WebcamCaptureProps) {
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  let videoRef!: HTMLVideoElement;
  let canvasRef!: HTMLCanvasElement;

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef) {
        videoRef.srcObject = s;
        videoRef.play();
      }
    } catch {
      setError("Could not access camera");
    }
  };

  const stopCamera = () => {
    stream()?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const capture = () => {
    if (!videoRef || !canvasRef) return;
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;
    const ctx = canvasRef.getContext("2d")!;
    ctx.drawImage(videoRef, 0, 0);
    canvasRef.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          stopCamera();
          props.onCapture(file);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  startCamera();

  onCleanup(stopCamera);

  return (
    <div class="space-y-3">
      <Show when={!error()} fallback={
        <p class="text-sm font-body text-dd-primary text-center">{error()}</p>
      }>
        <div class="relative rounded-dd-photo overflow-hidden bg-black">
          <video
            ref={videoRef}
            class="w-full aspect-video object-cover"
            autoplay
            playsinline
            muted
          />
        </div>
        <div class="flex gap-2 justify-center">
          <Button onClick={capture}>📸 Capture</Button>
          <Button variant="ghost" onClick={() => { stopCamera(); props.onClose(); }}>
            Cancel
          </Button>
        </div>
      </Show>
      <canvas ref={canvasRef} class="hidden" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/WebcamCapture.tsx
git commit -m "feat: add WebcamCapture component"
```

---

### Task 9: Rework ImageUploader with Preview, Webcam, Retry

**Files:**
- Modify: `src/client/components/ImageUploader.tsx`

- [ ] **Step 1: Replace ImageUploader with full rework**

Replace the entire file with:

```tsx
import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import { WebcamCapture } from "./WebcamCapture";
import { pageEnter, badgeAppear } from "../lib/animations";
import toast from "solid-toast";

interface ImageUploaderProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

type State = "idle" | "preview" | "webcam" | "converting" | "uploading" | "success" | "error";

export function ImageUploader(props: ImageUploaderProps) {
  const [state, setState] = createSignal<State>("idle");
  const [file, setFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [progress, setProgress] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  let fileInput!: HTMLInputElement;
  let previewRef!: HTMLDivElement;
  let successRef!: HTMLDivElement;

  const reset = () => {
    setState("idle");
    setFile(null);
    if (previewUrl()) URL.revokeObjectURL(previewUrl()!);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInput) fileInput.value = "";
  };

  const processFile = async (f: File) => {
    // HEIC conversion
    if (f.name.toLowerCase().match(/\.heic|\.heif$/) || f.type === "image/heic") {
      setState("converting");
      try {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.9 });
        const converted = Array.isArray(blob) ? blob[0] : blob;
        f = new File([converted], f.name.replace(/\.heic|\.heif$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        toast.error("Failed to convert HEIC image");
        reset();
        return;
      }
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setState("preview");

    // Animate preview in
    requestAnimationFrame(() => {
      if (previewRef) pageEnter(previewRef);
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];

    if (!f.type.startsWith("image/") && !f.name.toLowerCase().match(/\.heic|\.heif$/)) {
      toast.error("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    processFile(f);
  };

  const startUpload = async () => {
    const f = file();
    if (!f) return;

    setState("uploading");
    setProgress(0);

    try {
      await uploadImage(props.sessionId, f, (pct) => setProgress(pct));
      setState("success");
      requestAnimationFrame(() => {
        if (successRef) badgeAppear(successRef);
      });
      toast.success("Image uploaded!");
      props.onUploadComplete?.();
      setTimeout(reset, 1500);
    } catch (err: any) {
      setState("error");
      toast.error(err.error ?? "Upload failed");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      class={`border-[3px] border-dashed rounded-dd-card p-4 text-center transition-colors ${
        dragging() ? "border-dd-primary bg-dd-accent/10" : "border-dd-muted-border bg-white"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* Idle state */}
      <Show when={state() === "idle"}>
        <p class="text-sm font-body text-dd-text-muted mb-3">
          Drag & drop an image, or
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <div class="flex gap-2 justify-center">
          <Button variant="ghost" size="sm" onClick={() => fileInput.click()}>
            Choose File
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setState("webcam")}>
            📸 Take Photo
          </Button>
        </div>
      </Show>

      {/* Webcam state */}
      <Show when={state() === "webcam"}>
        <WebcamCapture
          onCapture={(f) => processFile(f)}
          onClose={reset}
        />
      </Show>

      {/* Converting state */}
      <Show when={state() === "converting"}>
        <p class="text-sm font-body font-medium text-dd-text">Converting HEIC...</p>
      </Show>

      {/* Preview state */}
      <Show when={state() === "preview"}>
        <div ref={previewRef} style={{ opacity: 0 }}>
          <img
            src={previewUrl()!}
            alt="Preview"
            class="w-full h-32 object-cover rounded-dd-photo mb-2"
          />
          <p class="text-xs font-body text-dd-text-muted mb-2">
            {file()?.name} ({formatSize(file()?.size ?? 0)})
          </p>
          <div class="flex gap-2 justify-center">
            <Button size="sm" onClick={startUpload}>Upload</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
          </div>
        </div>
      </Show>

      {/* Uploading state */}
      <Show when={state() === "uploading"}>
        <div class="space-y-3">
          <p class="text-sm font-body font-medium text-dd-text">
            Uploading... {progress()}%
          </p>
          <ProgressBar percent={progress()} />
        </div>
      </Show>

      {/* Success state */}
      <Show when={state() === "success"}>
        <div ref={successRef} class="text-dd-success">
          <span class="text-3xl">✓</span>
          <p class="text-sm font-display font-bold mt-1">Uploaded!</p>
        </div>
      </Show>

      {/* Error state with retry */}
      <Show when={state() === "error"}>
        <div>
          <img
            src={previewUrl()!}
            alt="Preview"
            class="w-full h-32 object-cover rounded-dd-photo mb-2 opacity-60"
          />
          <p class="text-sm font-body text-dd-primary mb-2">Upload failed</p>
          <div class="flex gap-2 justify-center">
            <Button size="sm" onClick={startUpload}>Retry</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/ImageUploader.tsx
git commit -m "feat: rework ImageUploader with preview, webcam, HEIC indicator, retry"
```

---

### Task 10: Lightbox Component

**Files:**
- Create: `src/client/components/Lightbox.tsx`
- Modify: `src/client/components/Gallery.tsx`

- [ ] **Step 1: Create Lightbox component**

Create `src/client/components/Lightbox.tsx`:

```tsx
import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { getImageUrl, deleteImage } from "../lib/api";
import { VoteButton } from "./VoteButton";
import { Button } from "./ui/Button";
import { lightboxOpen, lightboxClose } from "../lib/animations";
import { createSwipeHandler } from "../lib/swipe";
import type { ImageResponse } from "@shared/types";
import toast from "solid-toast";

interface LightboxProps {
  images: ImageResponse[];
  initialIndex: number;
  sessionId: string;
  votingOpen: boolean;
  votedImageIds: Set<string>;
  remainingVotes: number;
  isOwner: boolean;
  onClose: () => void;
  onVoteChange?: () => void;
  onImageRemoved?: (imageId: string) => void;
}

export function Lightbox(props: LightboxProps) {
  const [index, setIndex] = createSignal(props.initialIndex);
  let overlayRef!: HTMLDivElement;
  let contentRef!: HTMLDivElement;

  const currentImage = () => props.images[index()];
  const total = () => props.images.length;

  const navigate = (dir: -1 | 1) => {
    const next = index() + dir;
    if (next >= 0 && next < total()) {
      setIndex(next);
    }
  };

  const close = async () => {
    if (contentRef) await lightboxClose(contentRef);
    props.onClose();
  };

  const handleRemove = async () => {
    const img = currentImage();
    if (!img) return;
    try {
      await deleteImage(props.sessionId, img.id);
      props.onImageRemoved?.(img.id);
      if (total() <= 1) {
        close();
      } else if (index() >= total() - 1) {
        setIndex(index() - 1);
      }
    } catch (err: any) {
      toast.error(err.error ?? "Failed to remove image");
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    if (contentRef) lightboxOpen(contentRef);
    if (overlayRef) {
      createSwipeHandler(overlayRef, {
        onSwipeLeft: () => navigate(1),
        onSwipeRight: () => navigate(-1),
      });
    }
  });

  onCleanup(() => {
    document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div
      ref={overlayRef}
      class="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef) close(); }}
    >
      {/* Header: filename + counter + close */}
      <div class="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <span class="text-sm font-body text-white/70 truncate max-w-[40%]">
          {currentImage()?.filename}
        </span>
        <span class="text-sm font-display font-bold text-white">
          {index() + 1} / {total()}
        </span>
        <div class="flex items-center gap-2">
          <Show when={props.isOwner}>
            <Button variant="ghost" size="sm" onClick={handleRemove}
              class="!border-white/30 !text-white hover:!bg-white/10">
              Remove
            </Button>
          </Show>
          <button
            class="bg-dd-primary text-white rounded-dd-pill w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-dd-primary-shadow transition-colors"
            onClick={close}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Image */}
      <div ref={contentRef} class="relative max-w-4xl w-full max-h-[75vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}>
        <Show when={currentImage()}>
          <img
            src={getImageUrl(currentImage()!.r2Key)}
            alt={currentImage()!.filename}
            class="max-w-full max-h-[75vh] object-contain rounded-dd-photo"
          />
        </Show>

        {/* Navigation arrows (desktop) */}
        <Show when={index() > 0}>
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-dd-pill w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors hidden md:flex"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
        </Show>
        <Show when={index() < total() - 1}>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-dd-pill w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors hidden md:flex"
            onClick={() => navigate(1)}
          >
            →
          </button>
        </Show>
      </div>

      {/* Vote button at bottom */}
      <Show when={props.votingOpen && currentImage()}>
        <div class="mt-4">
          <VoteButton
            sessionId={props.sessionId}
            imageId={currentImage()!.id}
            voted={props.votedImageIds.has(currentImage()!.id)}
            disabled={props.remainingVotes <= 0}
            onVoteChange={props.onVoteChange}
          />
        </div>
      </Show>
    </div>
  );
}
```

- [ ] **Step 2: Update Gallery to use Lightbox component**

Replace the Gallery's lightbox section (the `<Show when={selectedId()}>` block at the end) with:

```tsx
<Show when={selectedIndex() !== null}>
  <Lightbox
    images={props.images}
    initialIndex={selectedIndex()!}
    sessionId={props.sessionId}
    votingOpen={props.votingOpen}
    votedImageIds={votedImageIds()}
    remainingVotes={remainingVotes()}
    isOwner={props.isOwner ?? false}
    onClose={() => setSelectedIndex(null)}
    onVoteChange={props.onVoteChange}
    onImageRemoved={(id) => {
      // Parent will handle via WebSocket event
    }}
  />
</Show>
```

Change the Gallery state from `selectedId` to `selectedIndex`:
```ts
const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
```

Update click handler:
```ts
onClick={() => setSelectedIndex(props.images.indexOf(image))}
```

Add `isOwner` to `GalleryProps`:
```ts
isOwner?: boolean;
```

Add Lightbox import:
```ts
import { Lightbox } from "./Lightbox";
```

Also add the desaturation overlay for when votes are exhausted:
In the image card div, add this class condition:
```ts
class={`relative aspect-square rounded-dd-photo overflow-hidden group cursor-pointer
  ${props.votingOpen && remainingVotes() <= 0 && !votedImageIds().has(image.id)
    ? "after:absolute after:inset-0 after:bg-white/40 after:backdrop-grayscale"
    : ""}`}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/Lightbox.tsx src/client/components/Gallery.tsx
git commit -m "feat: add Lightbox with swipe navigation and voting"
```

---

### Task 11: QR Share Dialog

**Files:**
- Create: `src/client/components/QRShareDialog.tsx`

- [ ] **Step 1: Create QR share dialog**

```tsx
import { createSignal, onMount, Show } from "solid-js";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { badgeAppear } from "../lib/animations";
import QRCode from "qrcode";
import toast from "solid-toast";

interface QRShareDialogProps {
  sessionCode: string;
  onClose: () => void;
}

export function QRShareDialog(props: QRShareDialogProps) {
  const [svgHtml, setSvgHtml] = createSignal("");
  let qrRef!: HTMLDivElement;

  const sessionUrl = `${window.location.origin}/sessions/${props.sessionCode}`;

  onMount(async () => {
    try {
      const svg = await QRCode.toString(sessionUrl, {
        type: "svg",
        width: 256,
        margin: 2,
        color: { dark: "#E05A47", light: "#FFFFFF" },
      });
      setSvgHtml(svg);
      requestAnimationFrame(() => {
        if (qrRef) badgeAppear(qrRef);
      });
    } catch {
      toast.error("Failed to generate QR code");
    }
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join DouDou Session",
          text: `Join session ${props.sessionCode}`,
          url: sessionUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <Card class="max-w-xs w-full">
        <CardContent class="pt-6 text-center space-y-4">
          <Show when={svgHtml()}>
            <div
              ref={qrRef}
              class="mx-auto w-64 h-64"
              innerHTML={svgHtml()}
            />
          </Show>

          <p class="font-display font-bold text-2xl tracking-[4px] text-dd-text">
            {props.sessionCode}
          </p>

          <div class="flex gap-2 justify-center">
            <Show when={"share" in navigator}>
              <Button onClick={handleShare}>Share</Button>
            </Show>
            <Button variant={("share" in navigator) ? "ghost" : "primary"} onClick={handleCopy}>
              Copy Link
            </Button>
          </div>

          <Button variant="ghost" size="sm" class="w-full" onClick={props.onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/QRShareDialog.tsx
git commit -m "feat: add QR code share dialog"
```

---

### Task 12: My Sessions List Component

**Files:**
- Create: `src/client/components/MySessionsList.tsx`

- [ ] **Step 1: Create MySessionsList component**

```tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import { useSession } from "../lib/auth-client";
import { getMySessions } from "../lib/api";
import { Badge } from "./ui/Badge";
import { staggerIn } from "../lib/animations";
import type { SessionResponse } from "@shared/types";

export function MySessionsList() {
  const auth = useSession();
  const [sessions, setSessions] = createSignal<SessionResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  let listRef!: HTMLDivElement;

  const isSignedIn = () => !!auth()?.data?.user;

  onMount(async () => {
    if (!isSignedIn()) {
      setLoading(false);
      return;
    }
    try {
      const result = await getMySessions();
      setSessions(result);
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        if (listRef) {
          const items = Array.from(listRef.children) as HTMLElement[];
          if (items.length > 0) staggerIn(items);
        }
      });
    }
  });

  const roundStatus = (s: SessionResponse) => {
    if (s.totalRounds <= 1) {
      return s.votingOpen ? "Voting" : s.uploadOpen ? "Uploading" : "Closed";
    }
    const status = s.votingOpen ? "Voting" : s.uploadOpen ? "Uploading" : "Closed";
    return `Round ${s.currentRound} of ${s.totalRounds} — ${status}`;
  };

  return (
    <Show when={isSignedIn() && !loading() && sessions().length > 0}>
      <div class="mt-6">
        <h2 class="text-lg font-display font-bold text-dd-text mb-3">My Sessions</h2>
        <div ref={listRef} class="space-y-2">
          <For each={sessions()}>
            {(session) => (
              <Link
                to="/sessions/$code"
                params={{ code: session.code }}
                class="block rounded-dd-card border-[3px] border-dd-border bg-dd-card p-3 hover:shadow-dd-card transition-shadow"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-display font-bold text-dd-text">{session.name}</p>
                    <p class="text-xs font-body text-dd-text-muted">
                      {session.code} · {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={session.votingOpen ? "success" : session.uploadOpen ? "accent" : "secondary"}>
                    {roundStatus(session)}
                  </Badge>
                </div>
              </Link>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/MySessionsList.tsx
git commit -m "feat: add MySessionsList component"
```

---

### Task 13: Rework SessionDashboard for Rounds

**Files:**
- Modify: `src/client/components/SessionDashboard.tsx`

- [ ] **Step 1: Replace SessionDashboard with round flow controls**

Replace the entire file:

```tsx
import { createSignal, Show } from "solid-js";
import type { SessionResponse, RoundResponse } from "@shared/types";
import { startVoting, closeVoting, advanceRound } from "../lib/api";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { QRShareDialog } from "./QRShareDialog";
import toast from "solid-toast";

interface SessionDashboardProps {
  session: SessionResponse;
  currentRound?: RoundResponse;
  imageCount: number;
  onSessionUpdate?: () => void;
}

export function SessionDashboard(props: SessionDashboardProps) {
  const [showQR, setShowQR] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const roundStatus = () => props.currentRound?.status ?? "uploading";

  const handleStartVoting = async () => {
    setLoading(true);
    try {
      await startVoting(props.session.id, props.session.currentRound);
      props.onSessionUpdate?.();
      toast.success("Voting started!");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to start voting");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    setLoading(true);
    try {
      await closeVoting(props.session.id, props.session.currentRound);
      props.onSessionUpdate?.();
      toast.success("Voting closed");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to close voting");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    setLoading(true);
    try {
      await advanceRound(props.session.id);
      props.onSessionUpdate?.();
      toast.success("Advanced to next round!");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to advance round");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Dashboard</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowQR(true)}>
              📱 QR
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          {/* Round info */}
          <Show when={props.session.totalRounds > 1}>
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-dd-text">
                Round {props.session.currentRound} of {props.session.totalRounds}
              </span>
              <Badge variant={
                roundStatus() === "voting" ? "success" :
                roundStatus() === "uploading" ? "accent" : "secondary"
              }>
                {roundStatus().charAt(0).toUpperCase() + roundStatus().slice(1)}
              </Badge>
            </div>
          </Show>

          {/* Image count */}
          <div class="flex items-center justify-between">
            <span class="font-body text-sm text-dd-text">Images this round</span>
            <Badge variant="secondary">{props.imageCount}</Badge>
          </div>

          {/* Timer info */}
          <Show when={props.session.votingDurationMinutes && roundStatus() === "voting"}>
            <div class="flex items-center justify-between">
              <span class="font-body text-sm text-dd-text">Timer</span>
              <Badge variant="accent">{props.session.votingDurationMinutes}m</Badge>
            </div>
          </Show>

          {/* Round flow action buttons */}
          <div class="space-y-2">
            <Show when={roundStatus() === "uploading"}>
              <Button class="w-full" onClick={handleStartVoting} disabled={loading()}>
                {loading() ? "Starting..." : "Start Voting"}
              </Button>
            </Show>

            <Show when={roundStatus() === "voting"}>
              <Button class="w-full" variant="accent" onClick={handleCloseVoting} disabled={loading()}>
                {loading() ? "Closing..." : "Close Voting"}
              </Button>
            </Show>

            <Show when={roundStatus() === "closed" && props.session.currentRound < props.session.totalRounds}>
              <Button class="w-full" variant="secondary" onClick={handleAdvanceRound} disabled={loading()}>
                {loading() ? "Advancing..." : "Next Round →"}
              </Button>
            </Show>

            <Show when={roundStatus() === "closed" && props.session.currentRound >= props.session.totalRounds}>
              <Badge variant="secondary" class="w-full justify-center py-2">
                All Rounds Complete
              </Badge>
            </Show>
          </div>
        </CardContent>
      </Card>

      <Show when={showQR()}>
        <QRShareDialog sessionCode={props.session.code} onClose={() => setShowQR(false)} />
      </Show>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/SessionDashboard.tsx
git commit -m "feat: rework SessionDashboard with round flow and QR sharing"
```

---

### Task 14: Confetti Canvas Component + Results Celebration

**Files:**
- Create: `src/client/components/ConfettiCanvas.tsx`
- Modify: `src/client/routes/sessions/$code.results.tsx`

- [ ] **Step 1: Create ConfettiCanvas wrapper**

Create `src/client/components/ConfettiCanvas.tsx`:

```tsx
import { onMount } from "solid-js";
import { launchConfetti } from "../lib/confetti";

export function ConfettiCanvas() {
  let ref!: HTMLDivElement;

  onMount(() => {
    if (ref) launchConfetti(ref);
  });

  return <div ref={ref} />;
}
```

- [ ] **Step 2: Rework Results page with per-round tabs, reveal, and confetti**

Replace the entire file `src/client/routes/sessions/$code.results.tsx`:

```tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResultsForRound, getImageUrl, getRounds } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { TabSwitcher } from "../../components/ui/TabSwitcher";
import { PageTransition } from "../../components/PageTransition";
import { ConfettiCanvas } from "../../components/ConfettiCanvas";
import { staggerIn, revealSlideFromLeft, revealSlideFromRight, revealScaleUp } from "../../lib/animations";
import type { SessionResponse, ResultItem, RoundResponse } from "@shared/types";
import gsap from "gsap";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [rounds, setRounds] = createSignal<RoundResponse[]>([]);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [activeTab, setActiveTab] = createSignal<string>("overall");
  const [loading, setLoading] = createSignal(true);
  const [revealing, setRevealing] = createSignal(false);
  const [showConfetti, setShowConfetti] = createSignal(false);
  let listRef!: HTMLDivElement;

  const revealKey = () => `results-revealed-${session()?.id}`;
  const hasRevealed = () => sessionStorage.getItem(revealKey()) === "true";

  const loadResults = async (round: string) => {
    const sess = session();
    if (!sess) return;
    setLoading(true);
    try {
      const roundParam = round === "overall" ? "overall" : parseInt(round);
      const res = await getResultsForRound(sess.id, roundParam);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const doReveal = async () => {
    setRevealing(true);
    const items = results();
    if (items.length === 0) {
      setRevealing(false);
      return;
    }

    // Wait for DOM
    await new Promise((r) => requestAnimationFrame(r));
    const rows = Array.from(listRef?.children ?? []) as HTMLElement[];

    // Hide all rows
    gsap.set(rows, { opacity: 0 });

    // Pause
    await new Promise((r) => setTimeout(r, 500));

    // Reveal 3rd place
    if (rows.length >= 3) await revealSlideFromLeft(rows[2]);
    await new Promise((r) => setTimeout(r, 200));

    // Reveal 2nd place
    if (rows.length >= 2) await revealSlideFromRight(rows[1]);
    await new Promise((r) => setTimeout(r, 200));

    // Reveal 1st place + confetti
    if (rows.length >= 1) {
      await revealScaleUp(rows[0]);
      setShowConfetti(true);
    }

    // Show remaining
    if (rows.length > 3) {
      gsap.to(rows.slice(3), { opacity: 1, stagger: 0.05, duration: 0.3 });
    }

    sessionStorage.setItem(revealKey(), "true");
    setRevealing(false);
  };

  onMount(async () => {
    try {
      const sess = await getSession(params().code);
      setSession(sess);
      const rds = await getRounds(sess.id);
      setRounds(rds);
      const res = await getResultsForRound(sess.id, "overall");
      setResults(res);
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);

      // Reveal or stagger
      requestAnimationFrame(() => {
        if (!hasRevealed() && results().length > 0) {
          doReveal();
        } else if (listRef) {
          const rows = Array.from(listRef.children) as HTMLElement[];
          if (rows.length > 0) staggerIn(rows);
        }
      });
    }
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadResults(tab);
  };

  const podiumStyle = (index: number) => {
    if (index === 0) return "bg-dd-accent/20 border-dd-accent-shadow/30";
    if (index === 1) return "bg-dd-secondary/10 border-dd-secondary/30";
    if (index === 2) return "bg-dd-primary/10 border-dd-primary/30";
    return "bg-white border-dd-muted-border";
  };

  const tabs = () => {
    const t = rounds()
      .filter((r) => r.status === "closed" || r.status === "voting")
      .map((r) => ({ key: String(r.roundNumber), label: `Round ${r.roundNumber}` }));
    if (t.length > 1 || session()?.totalRounds === 1) {
      t.unshift({ key: "overall", label: "Overall" });
    }
    return t.length > 0 ? t : [{ key: "overall", label: "Overall" }];
  };

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4 mb-4">
          <Link to="/sessions/$code" params={{ code: params().code }}>
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 class="text-2xl font-display font-black text-dd-text">Results</h1>
        </div>

        {/* Round tabs */}
        <Show when={tabs().length > 1}>
          <div class="mb-4">
            <TabSwitcher
              tabs={tabs()}
              active={activeTab()}
              onTabChange={handleTabChange}
            />
          </div>
        </Show>

        <Show when={!loading() && !revealing()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">
            {revealing() ? "Revealing winners..." : "Loading results..."}
          </div>
        }>
          <div ref={listRef} class="space-y-3 max-w-2xl mx-auto">
            <For each={results()}>
              {(item, index) => (
                <div class={`flex items-center gap-4 p-3 rounded-dd-card border-2 ${podiumStyle(index())}`}>
                  <span class="text-2xl font-display font-black w-10 text-center">
                    {index() === 0 ? "🥇" : index() === 1 ? "🥈" : index() === 2 ? "🥉" : `${index() + 1}`}
                  </span>
                  <img
                    src={getImageUrl(item.r2Key)}
                    alt={item.filename}
                    class="w-16 h-16 rounded-dd-photo object-cover"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-body text-dd-text-muted truncate">{item.filename}</p>
                  </div>
                  <span class="text-lg font-display font-black text-dd-text">
                    {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
              )}
            </For>

            <Show when={results().length === 0}>
              <div class="text-center py-12">
                <p class="font-display font-bold text-dd-text-muted">
                  No results yet — no images have been uploaded.
                </p>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={showConfetti()}>
          <ConfettiCanvas />
        </Show>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/ConfettiCanvas.tsx src/client/routes/sessions/\$code.results.tsx
git commit -m "feat: add celebration reveal with confetti and per-round results tabs"
```

---

### Task 15: Update Session Board Page (Rounds, Presence, Countdown)

**Files:**
- Modify: `src/client/routes/sessions/$code.tsx`

- [ ] **Step 1: Rework session board for rounds and presence**

Replace the entire file:

```tsx
import { createSignal, createEffect, onMount, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes, getRounds } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { Badge } from "../../components/ui/Badge";
import { PageTransition } from "../../components/PageTransition";
import type { SessionResponse, ImageResponse, VoteResponse, RoundResponse } from "@shared/types";
import toast from "solid-toast";

export default function SessionBoard() {
  const params = useParams({ from: "/sessions/$code" });
  const authSession = useSession();

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [images, setImages] = createSignal<ImageResponse[]>([]);
  const [myVotes, setMyVotes] = createSignal<VoteResponse[]>([]);
  const [rounds, setRounds] = createSignal<RoundResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [presenceCount, setPresenceCount] = createSignal(0);

  const isOwner = () => session()?.createdBy === authSession()?.data?.user?.id;
  const currentRound = () => rounds().find((r) => r.roundNumber === session()?.currentRound);

  const fetchData = async () => {
    try {
      const sess = await getSession(params().code);
      setSession(sess);

      const [imgs, votes, rds] = await Promise.all([
        getImages(sess.id),
        getMyVotes(sess.id),
        getRounds(sess.id),
      ]);
      setImages(imgs);
      setMyVotes(votes);
      setRounds(rds);
    } catch (err: any) {
      setError(err.error ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchData);

  createEffect(() => {
    const sess = session();
    if (!sess) return;

    const { lastEvent, presenceCount: pc } = createSessionSocket(sess.id);

    createEffect(() => {
      setPresenceCount(pc());
    });

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
          if (event.data.userId === authSession()?.data?.user?.id) {
            const sess = session();
            if (sess) getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "vote-removed":
          if (event.data.userId === authSession()?.data?.user?.id) {
            const sess = session();
            if (sess) getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "session-updated":
          setSession((prev) =>
            prev ? { ...prev, uploadOpen: event.data.uploadOpen, votingOpen: event.data.votingOpen } : prev
          );
          fetchData(); // Refresh rounds too
          break;
        case "round-advanced":
          fetchData(); // Full refresh on round change
          break;
      }
    });
  });

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <Show when={!loading()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">Loading session...</div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-12 font-body text-dd-primary">{error()}</div>
          }>
            <Show when={session()}>
              {(sess) => (
                <div class="space-y-4">
                  {/* Status Banner with presence count */}
                  <div class="flex items-center gap-2">
                    <StatusBanner
                      variant={sess().votingOpen ? "success" : "warning"}
                      class="flex-1"
                    >
                      {sess().votingOpen ? (
                        <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                      ) : sess().uploadOpen ? (
                        <span>Uploads Open — Round {sess().currentRound}{sess().totalRounds > 1 ? ` of ${sess().totalRounds}` : ""}</span>
                      ) : (
                        <span>
                          Round Closed —{" "}
                          <Link
                            to="/sessions/$code/results"
                            params={{ code: params().code }}
                            class="underline hover:no-underline"
                          >
                            View Results
                          </Link>
                        </span>
                      )}
                    </StatusBanner>
                    <Show when={presenceCount() > 0}>
                      <Badge variant="secondary">👥 {presenceCount()}</Badge>
                    </Show>
                  </div>

                  {/* Responsive layout */}
                  <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-1 min-w-0">
                      <Gallery
                        images={images()}
                        votes={myVotes()}
                        sessionId={sess().id}
                        votingOpen={sess().votingOpen}
                        maxVotes={sess().maxVotesPerUser}
                        isOwner={isOwner()}
                        onVoteChange={fetchData}
                      />
                    </div>

                    <div class="w-full md:w-72 shrink-0 space-y-4 order-first md:order-last">
                      <Show when={isOwner()}>
                        <SessionDashboard
                          session={sess()}
                          currentRound={currentRound()}
                          imageCount={images().length}
                          onSessionUpdate={fetchData}
                        />
                      </Show>

                      <Show when={sess().uploadOpen}>
                        <ImageUploader sessionId={sess().id} onUploadComplete={fetchData} />
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </Show>
        </Show>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sessions/\$code.tsx
git commit -m "feat: update session board with rounds, presence, and countdown"
```

---

### Task 16: Update Home Page and CreateSession for Rounds

**Files:**
- Modify: `src/client/routes/index.tsx`
- Modify: `src/client/components/CreateSession.tsx`

- [ ] **Step 1: Add MySessionsList to home page**

In `src/client/routes/index.tsx`, add import and render MySessionsList:

```tsx
import { createSignal } from "solid-js";
import { CreateSession } from "../components/CreateSession";
import { JoinSession } from "../components/JoinSession";
import { MySessionsList } from "../components/MySessionsList";
import { TabSwitcher } from "../components/ui/TabSwitcher";
import { PageTransition } from "../components/PageTransition";

export default function Home() {
  const [tab, setTab] = createSignal<string>("join");

  return (
    <PageTransition>
      <div class="py-8 max-w-sm mx-auto px-4">
        <TabSwitcher
          tabs={[
            { key: "create", label: "Create Session" },
            { key: "join", label: "Join Session" },
          ]}
          active={tab()}
          onTabChange={setTab}
          class="w-full mb-6"
        />

        {tab() === "create" ? <CreateSession /> : <JoinSession />}

        <MySessionsList />
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Add rounds and timer fields to CreateSession**

In `src/client/components/CreateSession.tsx`, add:

After the existing `maxVotes` signal:
```ts
const [totalRounds, setTotalRounds] = createSignal(1);
const [votingDuration, setVotingDuration] = createSignal<number | null>(null);
```

In the `handleCreate` call, add to the data object:
```ts
totalRounds: totalRounds(),
votingDurationMinutes: votingDuration(),
```

Add these form fields after the "Max Votes Per User" field:
```tsx
<div class="space-y-1">
  <label class="text-sm font-display font-bold text-dd-text" for="total-rounds">Number of Rounds</label>
  <Input
    id="total-rounds"
    type="number"
    min={1}
    max={10}
    value={totalRounds()}
    onInput={(e) => setTotalRounds(parseInt(e.currentTarget.value) || 1)}
  />
</div>
<div class="space-y-1">
  <label class="text-sm font-display font-bold text-dd-text" for="voting-timer">Voting Timer (minutes)</label>
  <select
    id="voting-timer"
    class="flex h-11 w-full rounded-dd-pill border-[3px] border-dd-border bg-white px-4 py-2 font-body text-base text-dd-text"
    onChange={(e) => {
      const val = e.currentTarget.value;
      setVotingDuration(val === "" ? null : parseInt(val));
    }}
  >
    <option value="">No limit</option>
    <option value="5">5 minutes</option>
    <option value="10">10 minutes</option>
    <option value="15">15 minutes</option>
    <option value="30">30 minutes</option>
    <option value="60">60 minutes</option>
  </select>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/client/routes/index.tsx src/client/components/CreateSession.tsx
git commit -m "feat: add MySessionsList to home, rounds and timer to CreateSession"
```

---

### Task 17: VoteButton — Undo Animation + Golden Pulse

**Files:**
- Modify: `src/client/components/VoteButton.tsx`

- [ ] **Step 1: Update VoteButton with undo and golden pulse animations**

Replace the entire file:

```tsx
import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import { voteStamp, voteUndo, goldenPulse } from "../lib/animations";
import toast from "solid-toast";

interface VoteButtonProps {
  sessionId: string;
  imageId: string;
  voted: boolean;
  disabled: boolean;
  onVoteChange?: () => void;
}

export function VoteButton(props: VoteButtonProps) {
  let ref!: HTMLDivElement;

  const handleClick = async () => {
    try {
      if (props.voted) {
        if (ref) await voteUndo(ref);
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
        if (ref) {
          voteStamp(ref);
          // Golden pulse on the star badge (parent will handle via class)
          const badge = ref.closest("[data-image-card]")?.querySelector("[data-star-badge]") as HTMLElement | null;
          if (badge) goldenPulse(badge);
        }
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <div ref={ref}>
      <Button
        variant={props.voted ? "accent" : "ghost"}
        size="sm"
        disabled={!props.voted && props.disabled}
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {props.voted ? "★ Voted" : "☆ Vote"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Update Gallery image cards with data attributes for golden pulse targeting**

In `Gallery.tsx`, update the image card container div to add `data-image-card` and star badge `data-star-badge`:

```tsx
<div data-image-card class="relative aspect-square ...">
  ...
  <Show when={votedImageIds().has(image.id)}>
    <div data-star-badge class="absolute top-2 right-2 bg-dd-accent rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-md">
      ★
    </div>
  </Show>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/VoteButton.tsx src/client/components/Gallery.tsx
git commit -m "feat: add vote undo animation and golden pulse to VoteButton"
```

---

### Task 18: Countdown Timer Display + Shareable Results Card

**Files:**
- Modify: `src/client/routes/sessions/$code.tsx`
- Modify: `src/client/routes/sessions/$code.results.tsx`

- [ ] **Step 1: Add countdown timer to session board**

In `src/client/routes/sessions/$code.tsx`, add a countdown signal. After the `presenceCount` signal:

```ts
const [countdown, setCountdown] = createSignal<string | null>(null);
```

Add a timer effect. In the `createEffect` that watches `session()`:

```ts
// Countdown timer
createEffect(() => {
  const sess = session();
  const round = currentRound();
  if (!sess?.votingDurationMinutes || round?.status !== "voting" || !round?.votingStartedAt) {
    setCountdown(null);
    return;
  }

  const endTime = new Date(round.votingStartedAt).getTime() + sess.votingDurationMinutes * 60 * 1000;

  const interval = setInterval(() => {
    const remaining = Math.max(0, endTime - Date.now());
    if (remaining <= 0) {
      setCountdown(null);
      clearInterval(interval);
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
  }, 1000);

  onCleanup(() => clearInterval(interval));
});
```

Add `onCleanup` to the imports from `solid-js`.

In the StatusBanner, show countdown when active:
```tsx
<Show when={countdown()}>
  <Badge variant="accent">⏱ {countdown()}</Badge>
</Show>
```

- [ ] **Step 2: Add shareable results summary**

In `src/client/routes/sessions/$code.results.tsx`, add a share button after the results list:

```tsx
const shareResults = async () => {
  const items = results();
  const sess = session();
  if (!sess || items.length === 0) return;

  const top3 = items.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  const text = `${sess.name} Results\n\n` +
    top3.map((item, i) => `${medals[i]} ${item.filename} — ${item.voteCount} votes`).join("\n") +
    `\n\nPowered by DouDou`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `${sess.name} Results`, text });
    } catch { /* cancelled */ }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }
};
```

Add the button after the results list:
```tsx
<Show when={results().length > 0}>
  <div class="text-center mt-6">
    <Button variant="ghost" onClick={shareResults}>
      📤 Share Results
    </Button>
  </div>
</Show>
```

Add `import toast from "solid-toast"` if not already imported.

- [ ] **Step 3: Commit**

```bash
git add src/client/routes/sessions/\$code.tsx src/client/routes/sessions/\$code.results.tsx
git commit -m "feat: add countdown timer and shareable results"
```

---

### Task 19: Build Verification and Fixes

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 3: Common issues to check**

- `qrcode` types may need `@types/qrcode` or a declaration file
- `params().code` vs `params.code` — TanStack Solid Router returns an accessor
- `RoundResponse` import in files that use it
- The `updateSession` function was removed from `api.ts` — make sure no files still import it
- The `WsEvent` type changed — ensure `"presence"` is replaced with `"presence-count"` everywhere
- `Env` type imported in session-room.ts must work with D1 operations in alarm handler

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve build issues from feature polish implementation"
```
