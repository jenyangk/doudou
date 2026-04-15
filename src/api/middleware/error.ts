import type { ErrorHandler } from "hono";
import type { Env } from "../../shared/types";

export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof Response) {
    return err;
  }

  return c.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    500
  );
};
