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

export const getImages = (sessionId: string) =>
  request<ImageResponse[]>(`/sessions/${sessionId}/images`);

export const deleteImage = (sessionId: string, imageId: string) =>
  request<{ success: boolean }>(`/sessions/${sessionId}/images/${imageId}`, {
    method: "DELETE",
  });

export const getImageUrl = (r2Key: string) => `/api/images/${r2Key}`;

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
