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
