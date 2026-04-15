import { api } from "./src/api/index";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return api.fetch(request, env, ctx);
    }

    return new Response("SPA placeholder — Vite build not yet wired", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  },
};
