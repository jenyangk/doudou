import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { getImageUrl, deleteImage } from "../lib/api";
import { VoteButton } from "./VoteButton";
import { Button } from "./ui/Button";
import { lightboxOpen, lightboxClose } from "../lib/animations";
import { createSwipeHandler } from "../lib/swipe";
import type { ImageResponse } from "@shared/types";
import toast from "solid-toast";

interface LightboxProps {
  images: ImageResponse[];
  initialIndex: number;
  sessionId: string;
  votingOpen: boolean;
  votedImageIds: Set<string>;
  remainingVotes: number;
  isOwner: boolean;
  onClose: () => void;
  onVoteChange?: () => void;
  onImageRemoved?: (imageId: string) => void;
}

export function Lightbox(props: LightboxProps) {
  const [index, setIndex] = createSignal(props.initialIndex);
  let overlayRef!: HTMLDivElement;
  let contentRef!: HTMLDivElement;

  const currentImage = () => props.images[index()];
  const total = () => props.images.length;

  const navigate = (dir: -1 | 1) => {
    const next = index() + dir;
    if (next >= 0 && next < total()) {
      setIndex(next);
    }
  };

  const close = async () => {
    if (contentRef) await lightboxClose(contentRef);
    props.onClose();
  };

  const handleRemove = async () => {
    const img = currentImage();
    if (!img) return;
    try {
      await deleteImage(props.sessionId, img.id);
      props.onImageRemoved?.(img.id);
      if (total() <= 1) {
        close();
      } else if (index() >= total() - 1) {
        setIndex(index() - 1);
      }
    } catch (err: any) {
      toast.error(err.error ?? "Failed to remove image");
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    if (contentRef) lightboxOpen(contentRef);
    if (overlayRef) {
      createSwipeHandler(overlayRef, {
        onSwipeLeft: () => navigate(1),
        onSwipeRight: () => navigate(-1),
      });
    }
  });

  onCleanup(() => {
    document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div
      ref={overlayRef}
      class="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef) close(); }}
    >
      {/* Header: filename + counter + close */}
      <div class="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <span class="text-sm font-body text-white/70 truncate max-w-[40%]">
          {currentImage()?.filename}
        </span>
        <span class="text-sm font-display font-bold text-white">
          {index() + 1} / {total()}
        </span>
        <div class="flex items-center gap-2">
          <Show when={props.isOwner}>
            <Button variant="ghost" size="sm" onClick={handleRemove}
              class="!border-white/30 !text-white hover:!bg-white/10">
              Remove
            </Button>
          </Show>
          <button
            class="bg-dd-primary text-white rounded-dd-pill w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-dd-primary-shadow transition-colors"
            onClick={close}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Image */}
      <div ref={contentRef} class="relative max-w-4xl w-full max-h-[75vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}>
        <Show when={currentImage()}>
          <img
            src={getImageUrl(currentImage()!.r2Key)}
            alt={currentImage()!.filename}
            class="max-w-full max-h-[75vh] object-contain rounded-dd-photo"
          />
        </Show>

        {/* Navigation arrows (desktop) */}
        <Show when={index() > 0}>
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-dd-pill w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors hidden md:flex"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
        </Show>
        <Show when={index() < total() - 1}>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-dd-pill w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors hidden md:flex"
            onClick={() => navigate(1)}
          >
            →
          </button>
        </Show>
      </div>

      {/* Vote button at bottom */}
      <Show when={props.votingOpen && currentImage()}>
        <div class="mt-4">
          <VoteButton
            sessionId={props.sessionId}
            imageId={currentImage()!.id}
            voted={props.votedImageIds.has(currentImage()!.id)}
            disabled={props.remainingVotes <= 0}
            onVoteChange={props.onVoteChange}
          />
        </div>
      </Show>
    </div>
  );
}
