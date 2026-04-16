import { createSignal, onMount, For, Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import { useSession } from "../lib/auth-client";
import { getMySessions } from "../lib/api";
import { Badge } from "./ui/Badge";
import { staggerIn } from "../lib/animations";
import type { SessionResponse } from "@shared/types";

export function MySessionsList() {
  const auth = useSession();
  const [sessions, setSessions] = createSignal<SessionResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  let listRef!: HTMLDivElement;

  const isSignedIn = () => !!auth()?.data?.user;

  onMount(async () => {
    if (!isSignedIn()) {
      setLoading(false);
      return;
    }
    try {
      const result = await getMySessions();
      setSessions(result);
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        if (listRef) {
          const items = Array.from(listRef.children) as HTMLElement[];
          if (items.length > 0) staggerIn(items);
        }
      });
    }
  });

  const roundStatus = (s: SessionResponse) => {
    if (s.totalRounds <= 1) {
      return s.votingOpen ? "Voting" : s.uploadOpen ? "Uploading" : "Closed";
    }
    const status = s.votingOpen ? "Voting" : s.uploadOpen ? "Uploading" : "Closed";
    return `Round ${s.currentRound} of ${s.totalRounds} — ${status}`;
  };

  return (
    <Show when={isSignedIn() && !loading() && sessions().length > 0}>
      <div class="mt-6">
        <h2 class="text-lg font-display font-bold text-dd-text mb-3">My Sessions</h2>
        <div ref={listRef} class="space-y-2">
          <For each={sessions()}>
            {(session) => (
              <Link
                to="/sessions/$code"
                params={{ code: session.code }}
                class="block rounded-dd-card border-[3px] border-dd-border bg-dd-card p-3 hover:shadow-dd-card transition-shadow"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-display font-bold text-dd-text">{session.name}</p>
                    <p class="text-xs font-body text-dd-text-muted">
                      {session.code} · {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={session.votingOpen ? "success" : session.uploadOpen ? "accent" : "secondary"}>
                    {roundStatus(session)}
                  </Badge>
                </div>
              </Link>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
