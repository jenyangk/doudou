import { createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes, getRounds } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { Badge } from "../../components/ui/Badge";
import { PageTransition } from "../../components/PageTransition";
import type { SessionResponse, ImageResponse, VoteResponse, RoundResponse } from "@shared/types";
import toast from "solid-toast";

export default function SessionBoard() {
  const params = useParams({ from: "/sessions/$code" });
  const authSession = useSession();

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [images, setImages] = createSignal<ImageResponse[]>([]);
  const [myVotes, setMyVotes] = createSignal<VoteResponse[]>([]);
  const [rounds, setRounds] = createSignal<RoundResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [presenceCount, setPresenceCount] = createSignal(0);
  const [countdown, setCountdown] = createSignal<string | null>(null);

  const isOwner = () => session()?.createdBy === authSession()?.data?.user?.id;
  const currentRound = () => rounds().find((r) => r.roundNumber === session()?.currentRound);

  const fetchData = async () => {
    try {
      const sess = await getSession(params().code);
      setSession(sess);

      const [imgs, votes, rds] = await Promise.all([
        getImages(sess.id),
        getMyVotes(sess.id),
        getRounds(sess.id),
      ]);
      setImages(imgs);
      setMyVotes(votes);
      setRounds(rds);
    } catch (err: any) {
      setError(err.error ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchData);

  createEffect(() => {
    const sess = session();
    if (!sess) return;

    const { lastEvent, presenceCount: pc } = createSessionSocket(sess.id);

    createEffect(() => {
      setPresenceCount(pc());
    });

    createEffect(() => {
      const event = lastEvent();
      if (!event) return;

      switch (event.type) {
        case "image-added":
          setImages((prev) => [...prev, event.data]);
          break;
        case "image-removed":
          setImages((prev) => prev.filter((i) => i.id !== event.data.id));
          break;
        case "vote-cast":
          if (event.data.userId === authSession()?.data?.user?.id) {
            const sess = session();
            if (sess) getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "vote-removed":
          if (event.data.userId === authSession()?.data?.user?.id) {
            const sess = session();
            if (sess) getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "session-updated":
          setSession((prev) =>
            prev ? { ...prev, uploadOpen: event.data.uploadOpen, votingOpen: event.data.votingOpen } : prev
          );
          fetchData(); // Refresh rounds too
          break;
        case "round-advanced":
          fetchData(); // Full refresh on round change
          break;
      }
    });

    // Countdown timer
    createEffect(() => {
      const sess = session();
      const round = currentRound();
      if (!sess?.votingDurationMinutes || round?.status !== "voting" || !round?.votingStartedAt) {
        setCountdown(null);
        return;
      }

      const endTime = new Date(round.votingStartedAt).getTime() + sess.votingDurationMinutes * 60 * 1000;

      const interval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        if (remaining <= 0) {
          setCountdown(null);
          clearInterval(interval);
          return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
      }, 1000);

      onCleanup(() => clearInterval(interval));
    });
  });

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <Show when={!loading()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">Loading session...</div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-12 font-body text-dd-primary">{error()}</div>
          }>
            <Show when={session()}>
              {(sess) => (
                <div class="space-y-4">
                  {/* Status Banner with presence count */}
                  <div class="flex items-center gap-2">
                    <StatusBanner
                      variant={sess().votingOpen ? "success" : "warning"}
                      class="flex-1"
                    >
                      {sess().votingOpen ? (
                        <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                      ) : sess().uploadOpen ? (
                        <span>Uploads Open — Round {sess().currentRound}{sess().totalRounds > 1 ? ` of ${sess().totalRounds}` : ""}</span>
                      ) : (
                        <span>
                          Round Closed —{" "}
                          <Link
                            to="/sessions/$code/results"
                            params={{ code: params().code }}
                            class="underline hover:no-underline"
                          >
                            View Results
                          </Link>
                        </span>
                      )}
                    </StatusBanner>
                    <Show when={countdown()}>
                      <Badge variant="accent">⏱ {countdown()}</Badge>
                    </Show>
                    <Show when={presenceCount() > 0}>
                      <Badge variant="secondary">👥 {presenceCount()}</Badge>
                    </Show>
                  </div>

                  {/* Responsive layout */}
                  <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-1 min-w-0">
                      <Gallery
                        images={images()}
                        votes={myVotes()}
                        sessionId={sess().id}
                        votingOpen={sess().votingOpen}
                        maxVotes={sess().maxVotesPerUser}
                        isOwner={isOwner()}
                        onVoteChange={fetchData}
                      />
                    </div>

                    <div class="w-full md:w-72 shrink-0 space-y-4 order-first md:order-last">
                      <Show when={isOwner()}>
                        <SessionDashboard
                          session={sess()}
                          currentRound={currentRound()}
                          imageCount={images().length}
                          onSessionUpdate={fetchData}
                        />
                      </Show>

                      <Show when={sess().uploadOpen}>
                        <ImageUploader sessionId={sess().id} onUploadComplete={fetchData} />
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </Show>
        </Show>
      </div>
    </PageTransition>
  );
}
