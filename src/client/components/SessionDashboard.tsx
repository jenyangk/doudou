import { Show } from "solid-js";
import type { SessionResponse } from "@shared/types";
import { updateSession } from "../lib/api";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
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
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="font-body text-sm text-dd-text">Total Images</span>
          <Badge variant="secondary">{props.imageCount}</Badge>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Badge variant={props.session.uploadOpen ? "success" : "primary"}>
              {props.session.uploadOpen ? "Uploads Open" : "Uploads Closed"}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleUploads}>
            {props.session.uploadOpen ? "🔓" : "🔒"}
          </Button>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Badge variant={props.session.votingOpen ? "success" : "primary"}>
              {props.session.votingOpen ? "Voting Open" : "Voting Closed"}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleVoting}>
            {props.session.votingOpen ? "🔓" : "🔒"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
