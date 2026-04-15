import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import toast from "solid-toast";

interface VoteButtonProps {
  sessionId: string;
  imageId: string;
  voted: boolean;
  disabled: boolean;
  onVoteChange?: () => void;
}

export function VoteButton(props: VoteButtonProps) {
  const handleClick = async () => {
    try {
      if (props.voted) {
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <Button
      size="sm"
      variant={props.voted ? "default" : "outline"}
      disabled={props.disabled && !props.voted}
      onClick={handleClick}
    >
      {props.voted ? "★ Voted" : "☆ Vote"}
    </Button>
  );
}
