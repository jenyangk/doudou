import { createMiddleware } from "hono/factory";
import type { Env } from "../../shared/types";
import { createAuth } from "../auth";

type AuthEnv = { Bindings: Env; Variables: { userId: string } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Authentication required", code: "UNAUTHORIZED" }, 401);
  }

  c.set("userId", session.user.id);
  await next();
});
