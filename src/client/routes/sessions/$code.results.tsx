import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResults, getImageUrl } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { PageTransition } from "../../components/PageTransition";
import { staggerIn } from "../../lib/animations";
import type { SessionResponse, ResultItem } from "@shared/types";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  let listRef!: HTMLDivElement;

  onMount(async () => {
    try {
      const sess = await getSession(params().code);
      setSession(sess);
      const res = await getResults(sess.id);
      setResults(res);
    } catch {
      // Error handled by loading state
    } finally {
      setLoading(false);
      // Stagger animation after results render
      requestAnimationFrame(() => {
        if (listRef) {
          const rows = Array.from(listRef.children) as HTMLElement[];
          if (rows.length > 0) staggerIn(rows);
        }
      });
    }
  });

  const podiumStyle = (index: number) => {
    if (index === 0) return "bg-dd-accent/20 border-dd-accent-shadow/30";
    if (index === 1) return "bg-dd-secondary/10 border-dd-secondary/30";
    if (index === 2) return "bg-dd-primary/10 border-dd-primary/30";
    return "bg-white border-dd-muted-border";
  };

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4 mb-6">
          <Link to="/sessions/$code" params={{ code: params().code }}>
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 class="text-2xl font-display font-black text-dd-text">Results</h1>
        </div>

        <Show when={!loading()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">Loading results...</div>
        }>
          <div ref={listRef} class="space-y-3 max-w-2xl mx-auto">
            <For each={results()}>
              {(item, index) => (
                <div class={`flex items-center gap-4 p-3 rounded-dd-card border-2 ${podiumStyle(index())}`}>
                  <span class="text-2xl font-display font-black w-10 text-center">
                    {index() === 0 ? "🥇" : index() === 1 ? "🥈" : index() === 2 ? "🥉" : `${index() + 1}`}
                  </span>
                  <img
                    src={getImageUrl(item.r2Key)}
                    alt={item.filename}
                    class="w-16 h-16 rounded-dd-photo object-cover"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-body text-dd-text-muted truncate">{item.filename}</p>
                  </div>
                  <span class="text-lg font-display font-black text-dd-text">
                    {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
              )}
            </For>

            <Show when={results().length === 0}>
              <div class="text-center py-12">
                <p class="font-display font-bold text-dd-text-muted">
                  No results yet — no images have been uploaded.
                </p>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </PageTransition>
  );
}
