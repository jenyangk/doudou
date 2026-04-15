import type { WsEvent } from "../../shared/types";

interface ConnectedClient {
  userId: string;
  joinedAt: number;
}

export class SessionRoom implements DurableObject {
  private connections: Map<WebSocket, ConnectedClient> = new Map();

  constructor(
    private state: DurableObjectState,
    private env: unknown
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/broadcast") {
      return this.handleBroadcast(request);
    }

    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(request: Request): Response {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return new Response("Missing user ID", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.connections.set(server, { userId, joinedAt: Date.now() });

    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const event = (await request.json()) as WsEvent;
    this.broadcastEvent(event);
    return new Response("OK");
  }

  private broadcastEvent(event: WsEvent): void {
    const message = JSON.stringify(event);
    for (const [ws] of this.connections) {
      try {
        ws.send(message);
      } catch {
        this.connections.delete(ws);
      }
    }
  }

  webSocketClose(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });
  }

  webSocketError(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence",
      data: { count: this.connections.size },
    });
  }
}
