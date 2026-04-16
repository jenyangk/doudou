import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResultsForRound, getImageUrl, getRounds } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { TabSwitcher } from "../../components/ui/TabSwitcher";
import { PageTransition } from "../../components/PageTransition";
import { ConfettiCanvas } from "../../components/ConfettiCanvas";
import { staggerIn, revealSlideFromLeft, revealSlideFromRight, revealScaleUp } from "../../lib/animations";
import type { SessionResponse, ResultItem, RoundResponse } from "@shared/types";
import gsap from "gsap";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [rounds, setRounds] = createSignal<RoundResponse[]>([]);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [activeTab, setActiveTab] = createSignal<string>("overall");
  const [loading, setLoading] = createSignal(true);
  const [revealing, setRevealing] = createSignal(false);
  const [showConfetti, setShowConfetti] = createSignal(false);
  let listRef!: HTMLDivElement;

  const revealKey = () => `results-revealed-${session()?.id}`;
  const hasRevealed = () => sessionStorage.getItem(revealKey()) === "true";

  const loadResults = async (round: string) => {
    const sess = session();
    if (!sess) return;
    setLoading(true);
    try {
      const roundParam = round === "overall" ? "overall" : parseInt(round);
      const res = await getResultsForRound(sess.id, roundParam);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const doReveal = async () => {
    setRevealing(true);
    const items = results();
    if (items.length === 0) {
      setRevealing(false);
      return;
    }

    // Wait for DOM
    await new Promise((r) => requestAnimationFrame(r));
    const rows = Array.from(listRef?.children ?? []) as HTMLElement[];

    // Hide all rows
    gsap.set(rows, { opacity: 0 });

    // Pause
    await new Promise((r) => setTimeout(r, 500));

    // Reveal 3rd place
    if (rows.length >= 3) await revealSlideFromLeft(rows[2]);
    await new Promise((r) => setTimeout(r, 200));

    // Reveal 2nd place
    if (rows.length >= 2) await revealSlideFromRight(rows[1]);
    await new Promise((r) => setTimeout(r, 200));

    // Reveal 1st place + confetti
    if (rows.length >= 1) {
      await revealScaleUp(rows[0]);
      setShowConfetti(true);
    }

    // Show remaining
    if (rows.length > 3) {
      gsap.to(rows.slice(3), { opacity: 1, stagger: 0.05, duration: 0.3 });
    }

    sessionStorage.setItem(revealKey(), "true");
    setRevealing(false);
  };

  onMount(async () => {
    try {
      const sess = await getSession(params().code);
      setSession(sess);
      const rds = await getRounds(sess.id);
      setRounds(rds);
      const res = await getResultsForRound(sess.id, "overall");
      setResults(res);
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);

      // Reveal or stagger
      requestAnimationFrame(() => {
        if (!hasRevealed() && results().length > 0) {
          doReveal();
        } else if (listRef) {
          const rows = Array.from(listRef.children) as HTMLElement[];
          if (rows.length > 0) staggerIn(rows);
        }
      });
    }
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadResults(tab);
  };

  const podiumStyle = (index: number) => {
    if (index === 0) return "bg-dd-accent/20 border-dd-accent-shadow/30";
    if (index === 1) return "bg-dd-secondary/10 border-dd-secondary/30";
    if (index === 2) return "bg-dd-primary/10 border-dd-primary/30";
    return "bg-white border-dd-muted-border";
  };

  const tabs = () => {
    const t = rounds()
      .filter((r) => r.status === "closed" || r.status === "voting")
      .map((r) => ({ key: String(r.roundNumber), label: `Round ${r.roundNumber}` }));
    if (t.length > 1 || session()?.totalRounds === 1) {
      t.unshift({ key: "overall", label: "Overall" });
    }
    return t.length > 0 ? t : [{ key: "overall", label: "Overall" }];
  };

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4 mb-4">
          <Link to="/sessions/$code" params={{ code: params().code }}>
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 class="text-2xl font-display font-black text-dd-text">Results</h1>
        </div>

        {/* Round tabs */}
        <Show when={tabs().length > 1}>
          <div class="mb-4">
            <TabSwitcher
              tabs={tabs()}
              active={activeTab()}
              onTabChange={handleTabChange}
            />
          </div>
        </Show>

        <Show when={!loading() && !revealing()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">
            {revealing() ? "Revealing winners..." : "Loading results..."}
          </div>
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

        <Show when={showConfetti()}>
          <ConfettiCanvas />
        </Show>
      </div>
    </PageTransition>
  );
}
