import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../shared/types";
import { errorHandler } from "./middleware/error";
import { createAuth } from "./auth";

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

// Better Auth handler — handles all /api/auth/* routes
api.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Route groups will be mounted here in later tasks:
// api.route("/sessions", sessionRoutes)
// api.route("/images", imageRoutes)
// api.route("/votes", voteRoutes)

export { api };
