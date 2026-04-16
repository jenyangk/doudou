import { Hono } from "hono";
import type { Env } from "../../shared/types";
import { requireAuth } from "../middleware/auth";
import { createSessionSchema } from "../../shared/validation";
import type { CompetitionSession, SessionResponse, Round, RoundResponse } from "../../shared/types";
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
    totalRounds: row.total_rounds,
    currentRound: row.current_round,
    votingDurationMinutes: row.voting_duration_minutes,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

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

  const { name, maxUploadsPerUser, maxVotesPerUser, totalRounds, votingDurationMinutes } = parsed.data;
  const userId = c.get("userId");
  const code = generateCode();

  const result = await c.env.DB.prepare(
    `INSERT INTO competition_sessions (name, code, created_by, max_uploads_per_user, max_votes_per_user, total_rounds, voting_duration_minutes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
     RETURNING *`
  )
    .bind(name, code, userId, maxUploadsPerUser, maxVotesPerUser, totalRounds, votingDurationMinutes)
    .first<CompetitionSession>();

  if (!result) {
    return c.json({ error: "Failed to create session", code: "INTERNAL_ERROR" }, 500);
  }

  // Create rounds
  const roundValues = [];
  for (let i = 1; i <= parsed.data.totalRounds; i++) {
    const roundId = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    roundValues.push(`('${roundId}', '${result.id}', ${i}, '${i === 1 ? "uploading" : "pending"}')`);
  }
  await c.env.DB.prepare(
    `INSERT INTO rounds (id, session_id, round_number, status) VALUES ${roundValues.join(", ")}`
  ).run();

  return c.json(toSessionResponse(result), 201);
});

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

export { sessions };
