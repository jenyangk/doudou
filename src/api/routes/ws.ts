import { Hono } from "hono";
import type { Env } from "../../shared/types";
import { requireAuth } from "../middleware/auth";

type WsEnv = { Bindings: Env; Variables: { userId: string } };

const ws = new Hono<WsEnv>();

ws.get("/:id/ws", requireAuth, async (c) => {
  const sessionId = c.req.param("id");
  const userId = c.get("userId");

  const upgradeHeader = c.req.header("upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade", code: "VALIDATION_ERROR" }, 426);
  }

  const doId = c.env.SESSION_ROOM.idFromName(sessionId);
  const stub = c.env.SESSION_ROOM.get(doId);

  const doRequest = new Request("http://internal/websocket", {
    headers: {
      upgrade: "websocket",
      "x-user-id": userId,
    },
  });

  return stub.fetch(doRequest);
});

export { ws };
