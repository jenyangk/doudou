import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import { voteStamp } from "../lib/animations";
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
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
        if (ref) voteStamp(ref);
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <div ref={ref} class="inline-block">
      <Button
        size="sm"
        variant={props.voted ? "accent" : "primary"}
        disabled={props.disabled && !props.voted}
        onClick={handleClick}
      >
        {props.voted ? "★ Voted" : "☆ Vote"}
      </Button>
    </div>
  );
}
