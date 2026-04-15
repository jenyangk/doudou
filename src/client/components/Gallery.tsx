import { For, Show, createSignal } from "solid-js";
import type { ImageResponse, VoteResponse } from "@shared/types";
import { getImageUrl } from "../lib/api";
import { VoteButton } from "./VoteButton";

interface GalleryProps {
  images: ImageResponse[];
  votes: VoteResponse[];
  sessionId: string;
  votingOpen: boolean;
  maxVotes: number;
  onVoteChange?: () => void;
}

export function Gallery(props: GalleryProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);

  const votedImageIds = () => new Set(props.votes.map((v) => v.imageId));
  const remainingVotes = () => props.maxVotes - props.votes.length;

  return (
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-semibold">Gallery</h2>
        <Show when={props.votingOpen}>
          <span class="text-sm text-gray-500">{remainingVotes()} votes remaining</span>
        </Show>
      </div>

      <Show
        when={props.images.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg mb-1">No photos yet</p>
            <p class="text-gray-400 text-sm">Be the first to upload!</p>
          </div>
        }
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <For each={props.images}>
            {(image) => (
              <div class="relative aspect-square rounded-md overflow-hidden group cursor-pointer">
                <img
                  src={getImageUrl(image.r2Key)}
                  alt={image.filename}
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setSelectedId(image.id)}
                />
                <Show when={props.votingOpen}>
                  <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <VoteButton
                      sessionId={props.sessionId}
                      imageId={image.id}
                      voted={votedImageIds().has(image.id)}
                      disabled={remainingVotes() <= 0}
                      onVoteChange={props.onVoteChange}
                    />
                  </div>
                </Show>
                <Show when={votedImageIds().has(image.id)}>
                  <div class="absolute top-2 right-2 text-yellow-500 text-lg">★</div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={selectedId()}>
        <div
          class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div class="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(props.images.find((i) => i.id === selectedId())?.r2Key ?? "")}
              alt="Selected"
              class="w-full h-full object-contain rounded-lg"
            />
            <button
              class="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedId(null)}
            >
              ✕
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
