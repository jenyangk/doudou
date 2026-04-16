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
