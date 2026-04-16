import { Hono } from "hono";
import type { Env, CompetitionSession, SessionImage, ImageResponse } from "../../shared/types";
import { requireAuth } from "../middleware/auth";
import { broadcastToSession } from "../lib/broadcast";

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
    roundId: row.round_id,
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

  return c.json(results.map(toImageResponse));
});

// POST /api/sessions/:id/images — upload image
images.post("/sessions/:id/images", requireAuth, async (c) => {
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

  // Get current uploading round
  const currentRound = await c.env.DB.prepare(
    "SELECT id FROM rounds WHERE session_id = ? AND status = 'uploading'"
  ).bind(sessionId).first<{ id: string }>();

  if (!currentRound) {
    return c.json({ error: "No round is accepting uploads", code: "UPLOAD_CLOSED" }, 403);
  }

  const { count } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM session_images WHERE session_id = ? AND user_id = ? AND round_id = ?"
  ).bind(sessionId, userId, currentRound.id).first<{ count: number }>() ?? { count: 0 };

  if (count >= session.max_uploads_per_user) {
    return c.json(
      { error: `Upload limit reached (max ${session.max_uploads_per_user})`, code: "UPLOAD_LIMIT_REACHED" },
      403
    );
  }

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

  const imageId = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  const ext = getExtension(file.name);
  const r2Key = `sessions/${sessionId}/${imageId}.${ext}`;

  await c.env.IMAGES.put(r2Key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const row = await c.env.DB.prepare(
    `INSERT INTO session_images (id, session_id, user_id, r2_key, filename, mime_type, round_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(imageId, sessionId, userId, r2Key, file.name, file.type, currentRound.id)
    .first<SessionImage>();

  if (!row) {
    await c.env.IMAGES.delete(r2Key);
    return c.json({ error: "Failed to save image record", code: "INTERNAL_ERROR" }, 500);
  }

  await broadcastToSession(c.env, sessionId, {
    type: "image-added",
    data: toImageResponse(row),
  });

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

  const session = await c.env.DB.prepare("SELECT * FROM competition_sessions WHERE id = ?")
    .bind(sessionId).first<CompetitionSession>();

  if (image.user_id !== userId && session?.created_by !== userId) {
    return c.json({ error: "You can only delete your own images", code: "FORBIDDEN" }, 403);
  }

  await c.env.IMAGES.delete(image.r2_key);

  await c.env.DB.prepare("DELETE FROM session_images WHERE id = ?")
    .bind(imageId)
    .run();

  await broadcastToSession(c.env, sessionId, {
    type: "image-removed",
    data: { id: imageId },
  });

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
