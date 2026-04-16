import { createSignal, createEffect, onMount, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { PageTransition } from "../../components/PageTransition";
import type { SessionResponse, ImageResponse, VoteResponse } from "@shared/types";
import toast from "solid-toast";

export default function SessionBoard() {
  const params = useParams({ from: "/sessions/$code" });
  const authSession = useSession();

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [images, setImages] = createSignal<ImageResponse[]>([]);
  const [myVotes, setMyVotes] = createSignal<VoteResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const isOwner = () => session()?.createdBy === authSession()?.data?.user?.id;

  const fetchData = async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);

      const [imgs, votes] = await Promise.all([
        getImages(sess.id),
        getMyVotes(sess.id),
      ]);
      setImages(imgs);
      setMyVotes(votes);
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

    const { lastEvent } = createSessionSocket(sess.id);

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
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "vote-removed":
          if (event.data.userId === authSession()?.data?.user?.id) {
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "session-updated":
          setSession((prev) =>
            prev ? { ...prev, uploadOpen: event.data.uploadOpen, votingOpen: event.data.votingOpen } : prev
          );
          break;
      }
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
                  {/* Status Banner */}
                  <StatusBanner variant={sess().votingOpen ? "success" : "warning"}>
                    {sess().votingOpen ? (
                      <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                    ) : (
                      <span>
                        Voting Closed —{" "}
                        <Link
                          to="/sessions/$code/results"
                          params={{ code: params.code }}
                          class="underline hover:no-underline"
                        >
                          View Results
                        </Link>
                      </span>
                    )}
                  </StatusBanner>

                  {/* Responsive layout: stacked on mobile, sidebar on md+ */}
                  <div class="flex flex-col md:flex-row gap-4">
                    {/* Main: Gallery */}
                    <div class="flex-1 min-w-0">
                      <Gallery
                        images={images()}
                        votes={myVotes()}
                        sessionId={sess().id}
                        votingOpen={sess().votingOpen}
                        maxVotes={sess().maxVotesPerUser}
                        onVoteChange={fetchData}
                      />
                    </div>

                    {/* Sidebar: Dashboard + Uploader (on md+) */}
                    <div class="w-full md:w-72 shrink-0 space-y-4 order-first md:order-last">
                      <Show when={isOwner()}>
                        <SessionDashboard
                          session={sess()}
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
