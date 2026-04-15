import { Show } from "solid-js";
import type { SessionResponse } from "@shared/types";
import { updateSession } from "../lib/api";
import { Button } from "./ui/Button";
import toast from "solid-toast";

interface SessionDashboardProps {
  session: SessionResponse;
  imageCount: number;
  onSessionUpdate?: () => void;
}

export function SessionDashboard(props: SessionDashboardProps) {
  const toggleUploads = async () => {
    try {
      await updateSession(props.session.id, { uploadOpen: !props.session.uploadOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  const toggleVoting = async () => {
    try {
      await updateSession(props.session.id, { votingOpen: !props.session.votingOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  return (
    <div class="p-4 bg-gray-100 rounded-lg space-y-3">
      <h2 class="text-lg font-semibold">Dashboard</h2>
      <div class="grid grid-cols-2 gap-2 items-center text-sm">
        <span>Total Images:</span>
        <span class="text-right">{props.imageCount}</span>

        <span class={props.session.uploadOpen ? "text-green-600" : "text-red-500"}>
          {props.session.uploadOpen ? "Uploads Open" : "Uploads Closed"}
        </span>
        <div class="text-right">
          <Button size="sm" variant="outline" onClick={toggleUploads}>
            {props.session.uploadOpen ? "🔓" : "🔒"}
          </Button>
        </div>

        <span class={props.session.votingOpen ? "text-green-600" : "text-red-500"}>
          {props.session.votingOpen ? "Voting Open" : "Voting Closed"}
        </span>
        <div class="text-right">
          <Button size="sm" variant="outline" onClick={toggleVoting}>
            {props.session.votingOpen ? "🔓" : "🔒"}
          </Button>
        </div>
      </div>
    </div>
  );
}
