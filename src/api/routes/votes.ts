import { Hono } from "hono";
import type { Env, CompetitionSession, Vote, VoteResponse, ResultItem, SessionImage } from "../../shared/types";
import { requireAuth } from "../middleware/auth";
import { castVoteSchema } from "../../shared/validation";
import { broadcastToSession } from "../lib/broadcast";

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

  const image = await c.env.DB.prepare(
    "SELECT id FROM session_images WHERE id = ? AND session_id = ?"
  )
    .bind(imageId, sessionId)
    .first<SessionImage>();

  if (!image) {
    return c.json({ error: "Image not found in this session", code: "NOT_FOUND" }, 404);
  }

  const { count } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM votes WHERE session_id = ? AND user_id = ?"
  )
    .bind(sessionId, userId)
    .first<{ count: number }>() ?? { count: 0 };

  if (count >= session.max_votes_per_user) {
    return c.json(
      { error: `Vote limit reached (max ${session.max_votes_per_user})`, code: "VOTE_LIMIT_REACHED" },
      403
    );
  }

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

    const response: VoteResponse = {
      id: row.id,
      imageId: row.image_id,
      userId: row.user_id,
      createdAt: row.created_at,
    };

    await broadcastToSession(c.env, sessionId, {
      type: "vote-cast",
      data: { imageId, userId },
    });

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

  await broadcastToSession(c.env, sessionId, {
    type: "vote-removed",
    data: { imageId, userId },
  });

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

// GET /api/sessions/:id/votes/mine — get current user's votes
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
