import { For, Show, createSignal, onMount } from "solid-js";
import type { ImageResponse, VoteResponse } from "@shared/types";
import { getImageUrl } from "../lib/api";
import { VoteButton } from "./VoteButton";
import { staggerIn } from "../lib/animations";

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
  let gridRef!: HTMLDivElement;

  const votedImageIds = () => new Set(props.votes.map((v) => v.imageId));
  const remainingVotes = () => props.maxVotes - props.votes.length;

  onMount(() => {
    if (gridRef) {
      const cards = Array.from(gridRef.children) as HTMLElement[];
      if (cards.length > 0) staggerIn(cards);
    }
  });

  return (
    <div>
      <Show
        when={props.images.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="font-display font-bold text-dd-text-muted text-lg mb-1">No photos yet</p>
            <p class="font-body text-dd-text-muted text-sm">Be the first to upload!</p>
          </div>
        }
      >
        <div ref={gridRef} class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <For each={props.images}>
            {(image) => (
              <div class="relative aspect-square rounded-dd-photo overflow-hidden group cursor-pointer">
                <img
                  src={getImageUrl(image.r2Key)}
                  alt={image.filename}
                  class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setSelectedId(image.id)}
                />
                <Show when={props.votingOpen}>
                  <div class="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                  <div class="absolute top-2 right-2 bg-dd-accent rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    ★
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Lightbox */}
      <Show when={selectedId()}>
        <div
          class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div class="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(props.images.find((i) => i.id === selectedId())?.r2Key ?? "")}
              alt="Selected"
              class="w-full h-full object-contain rounded-dd-photo"
            />
            <button
              class="absolute top-3 right-3 bg-dd-primary text-white rounded-dd-pill w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-dd-primary-shadow transition-colors"
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
