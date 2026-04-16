import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import { voteStamp, voteUndo, goldenPulse } from "../lib/animations";
import toast from "solid-toast";

interface VoteButtonProps {
  sessionId: string;
  imageId: string;
  voted: boolean;
  disabled: boolean;
  onVoteChange?: () => void;
}

export function VoteButton(props: VoteButtonProps) {
  let ref!: HTMLDivElement;

  const handleClick = async () => {
    try {
      if (props.voted) {
        if (ref) await voteUndo(ref);
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
        if (ref) {
          voteStamp(ref);
          // Golden pulse on the star badge (parent will handle via class)
          const badge = ref.closest("[data-image-card]")?.querySelector("[data-star-badge]") as HTMLElement | null;
          if (badge) goldenPulse(badge);
        }
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <div ref={ref}>
      <Button
        variant={props.voted ? "accent" : "ghost"}
        size="sm"
        disabled={!props.voted && props.disabled}
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {props.voted ? "★ Voted" : "☆ Vote"}
      </Button>
    </div>
  );
}
