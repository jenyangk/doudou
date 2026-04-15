import { createSignal, createEffect, onMount, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { Button } from "../../components/ui/Button";
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
    <div class="container mx-auto px-4 py-4">
      <Show when={!loading()} fallback={<div class="text-center py-12 text-gray-500">Loading session...</div>}>
        <Show when={!error()} fallback={<div class="text-center py-12 text-red-500">{error()}</div>}>
          <Show when={session()}>
            {(sess) => (
              <>
                <div class={`rounded-lg p-2 mb-4 text-center text-sm font-medium ${
                  sess().votingOpen ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {sess().votingOpen ? (
                    <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                  ) : (
                    <span>
                      Voting Closed —{" "}
                      <Link to="/sessions/$code/results" params={{ code: params.code }} class="underline">
                        View Results
                      </Link>
                    </span>
                  )}
                </div>

                <Show when={isOwner()}>
                  <SessionDashboard
                    session={sess()}
                    imageCount={images().length}
                    onSessionUpdate={fetchData}
                  />
                </Show>

                <Show when={sess().uploadOpen}>
                  <div class="my-4">
                    <ImageUploader sessionId={sess().id} onUploadComplete={fetchData} />
                  </div>
                </Show>

                <Gallery
                  images={images()}
                  votes={myVotes()}
                  sessionId={sess().id}
                  votingOpen={sess().votingOpen}
                  maxVotes={sess().maxVotesPerUser}
                  onVoteChange={fetchData}
                />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </div>
  );
}
