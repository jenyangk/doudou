import { For, Show, createSignal, onMount } from "solid-js";
import type { ImageResponse, VoteResponse } from "@shared/types";
import { getImageUrl } from "../lib/api";
import { VoteButton } from "./VoteButton";
import { Lightbox } from "./Lightbox";
import { staggerIn } from "../lib/animations";

interface GalleryProps {
  images: ImageResponse[];
  votes: VoteResponse[];
  sessionId: string;
  votingOpen: boolean;
  maxVotes: number;
  isOwner?: boolean;
  onVoteChange?: () => void;
}

export function Gallery(props: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
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
              <div data-image-card class="relative aspect-square rounded-dd-photo overflow-hidden group cursor-pointer">
                <img
                  src={getImageUrl(image.r2Key)}
                  alt={image.filename}
                  class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setSelectedIndex(props.images.indexOf(image))}
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
                  <div data-star-badge class="absolute top-2 right-2 bg-dd-accent rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    ★
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Lightbox */}
      <Show when={selectedIndex() !== null}>
        <Lightbox
          images={props.images}
          initialIndex={selectedIndex()!}
          sessionId={props.sessionId}
          votingOpen={props.votingOpen}
          votedImageIds={votedImageIds()}
          remainingVotes={remainingVotes()}
          isOwner={props.isOwner ?? false}
          onClose={() => setSelectedIndex(null)}
          onVoteChange={props.onVoteChange}
          onImageRemoved={(id) => {
            // Parent will handle via WebSocket event
          }}
        />
      </Show>
    </div>
  );
}
