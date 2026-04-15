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
