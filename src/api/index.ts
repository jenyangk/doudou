import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";
import { sessions } from "./routes/sessions";
import { images } from "./routes/images";
import { votes } from "./routes/votes";
import { ws } from "./routes/ws";

export type AppType = { Bindings: Env };

const api = new Hono<AppType>().basePath("/api");

api.onError(errorHandler);

api.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

api.get("/health", (c) => c.json({ status: "ok" }));

api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

api.route("/sessions", sessions);
api.route("/", images);
api.route("/sessions", votes);
api.route("/sessions", ws);

export { api };
