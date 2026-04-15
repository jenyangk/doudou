import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResults, getImageUrl } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import type { SessionResponse, ResultItem } from "@shared/types";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);
      const res = await getResults(sess.id);
      setResults(res);
    } catch {
      // Error handled by loading state
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center gap-4 mb-6">
        <Link to="/sessions/$code" params={{ code: params.code }}>
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 class="text-2xl font-bold">Results</h1>
      </div>

      <Show when={!loading()} fallback={<div class="text-center py-12 text-gray-500">Loading results...</div>}>
        <div class="space-y-4 max-w-2xl mx-auto">
          <For each={results()}>
            {(item, index) => (
              <div class={`flex items-center gap-4 p-3 rounded-lg ${
                index() === 0 ? "bg-yellow-50 border border-yellow-200" :
                index() === 1 ? "bg-gray-50 border border-gray-200" :
                index() === 2 ? "bg-orange-50 border border-orange-200" :
                "bg-white border border-gray-100"
              }`}>
                <span class="text-2xl font-bold text-gray-400 w-8 text-center">
                  {index() === 0 ? "🥇" : index() === 1 ? "🥈" : index() === 2 ? "🥉" : `${index() + 1}`}
                </span>
                <img
                  src={getImageUrl(item.r2Key)}
                  alt={item.filename}
                  class="w-16 h-16 rounded-md object-cover"
                />
                <div class="flex-1">
                  <p class="text-sm text-gray-500 truncate">{item.filename}</p>
                </div>
                <span class="text-lg font-semibold">
                  {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                </span>
              </div>
            )}
          </For>

          <Show when={results().length === 0}>
            <div class="text-center py-12 text-gray-400">
              No results yet — no images have been uploaded.
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
