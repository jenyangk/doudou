import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../shared/types";
import { errorHandler } from "./middleware/error";

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

export { api };
