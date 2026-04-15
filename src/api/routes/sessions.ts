import { Hono } from "hono";
import type { Env } from "../../shared/types";
import { requireAuth } from "../middleware/auth";
import { createSessionSchema, updateSessionSchema } from "../../shared/validation";
import type { CompetitionSession, SessionResponse } from "../../shared/types";
import { broadcastToSession } from "../lib/broadcast";

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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

  await c.env.CACHE.delete(`session:code:${updated.code}`);

  await broadcastToSession(c.env, sessionId, {
    type: "session-updated",
    data: {
      uploadOpen: updated.upload_open === 1,
      votingOpen: updated.voting_open === 1,
    },
  });

  return c.json(toSessionResponse(updated));
});

export { sessions };
