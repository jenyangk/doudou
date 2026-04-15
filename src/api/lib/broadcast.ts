import type { Env, WsEvent } from "../../shared/types";

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
    console.error("Failed to broadcast to session:", err);
  }
}
