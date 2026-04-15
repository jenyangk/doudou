import { createSignal, onCleanup } from "solid-js";
import type { WsEvent } from "@shared/types";

interface UseSessionSocketReturn {
  lastEvent: () => WsEvent | null;
  connected: () => boolean;
  reconnect: () => void;
}

export function createSessionSocket(sessionId: string): UseSessionSocketReturn {
  const [lastEvent, setLastEvent] = createSignal<WsEvent | null>(null);
  const [connected, setConnected] = createSignal(false);

  let ws: WebSocket | null = null;
  let retries = 0;
  const maxRetries = 3;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/sessions/${sessionId}/ws`;

    ws = new WebSocket(url);

    ws.addEventListener("open", () => {
      setConnected(true);
      retries = 0;
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        setLastEvent(data);
      } catch {
        console.error("Invalid WebSocket message:", event.data);
      }
    });

    ws.addEventListener("close", () => {
      setConnected(false);
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000;
        timeoutId = setTimeout(() => {
          retries++;
          connect();
        }, delay);
      }
    });

    ws.addEventListener("error", () => {
      ws?.close();
    });
  }

  function reconnect() {
    retries = 0;
    ws?.close();
    connect();
  }

  function cleanup() {
    if (timeoutId) clearTimeout(timeoutId);
    ws?.close();
  }

  connect();
  onCleanup(cleanup);

  return { lastEvent, connected, reconnect };
}
