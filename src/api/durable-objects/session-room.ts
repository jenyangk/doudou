import type { WsEvent, Env } from "../../shared/types";

interface ConnectedClient {
  userId: string;
  joinedAt: number;
}

interface AlarmData {
  sessionId: string;
  roundId: string;
}

export class SessionRoom implements DurableObject {
  private connections: Map<WebSocket, ConnectedClient> = new Map();

  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/broadcast") {
      return this.handleBroadcast(request);
    }

    if (url.pathname === "/set-alarm") {
      return this.handleSetAlarm(request);
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
      type: "presence-count",
      data: { count: this.connections.size },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const event = (await request.json()) as WsEvent;
    this.broadcastEvent(event);
    return new Response("OK");
  }

  private async handleSetAlarm(request: Request): Promise<Response> {
    const { sessionId, roundId, durationMinutes } = await request.json() as {
      sessionId: string;
      roundId: string;
      durationMinutes: number;
    };

    // Store alarm data for when alarm fires
    await this.state.storage.put("alarm-data", { sessionId, roundId } as AlarmData);

    // Schedule alarm
    const alarmTime = Date.now() + durationMinutes * 60 * 1000;
    await this.state.storage.setAlarm(alarmTime);

    return new Response("OK");
  }

  async alarm(): Promise<void> {
    const data = await this.state.storage.get<AlarmData>("alarm-data");
    if (!data) return;

    // Close voting for the round via D1
    await this.env.DB.prepare("UPDATE rounds SET status = 'closed' WHERE id = ?")
      .bind(data.roundId).run();
    await this.env.DB.prepare(
      "UPDATE competition_sessions SET voting_open = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(data.sessionId).run();

    // Broadcast session update
    this.broadcastEvent({
      type: "session-updated",
      data: { uploadOpen: false, votingOpen: false },
    });

    // Clean up
    await this.state.storage.delete("alarm-data");
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
      type: "presence-count",
      data: { count: this.connections.size },
    });
  }

  webSocketError(ws: WebSocket): void {
    this.connections.delete(ws);
    this.broadcastEvent({
      type: "presence-count",
      data: { count: this.connections.size },
    });
  }
}
