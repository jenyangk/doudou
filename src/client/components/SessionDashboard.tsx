import { createSignal, Show } from "solid-js";
import type { SessionResponse, RoundResponse } from "@shared/types";
import { startVoting, closeVoting, advanceRound } from "../lib/api";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { QRShareDialog } from "./QRShareDialog";
import toast from "solid-toast";

interface SessionDashboardProps {
  session: SessionResponse;
  currentRound?: RoundResponse;
  imageCount: number;
  onSessionUpdate?: () => void;
}

export function SessionDashboard(props: SessionDashboardProps) {
  const [showQR, setShowQR] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const roundStatus = () => props.currentRound?.status ?? "uploading";

  const handleStartVoting = async () => {
    setLoading(true);
    try {
      await startVoting(props.session.id, props.session.currentRound);
      props.onSessionUpdate?.();
      toast.success("Voting started!");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to start voting");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    setLoading(true);
    try {
      await closeVoting(props.session.id, props.session.currentRound);
      props.onSessionUpdate?.();
      toast.success("Voting closed");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to close voting");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    setLoading(true);
    try {
      await advanceRound(props.session.id);
      props.onSessionUpdate?.();
      toast.success("Advanced to next round!");
    } catch (err: any) {
      toast.error(err.error ?? "Failed to advance round");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Dashboard</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowQR(true)}>
              📱 QR
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          {/* Round info */}
          <Show when={props.session.totalRounds > 1}>
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-dd-text">
                Round {props.session.currentRound} of {props.session.totalRounds}
              </span>
              <Badge variant={
                roundStatus() === "voting" ? "success" :
                roundStatus() === "uploading" ? "accent" : "secondary"
              }>
                {roundStatus().charAt(0).toUpperCase() + roundStatus().slice(1)}
              </Badge>
            </div>
          </Show>

          {/* Image count */}
          <div class="flex items-center justify-between">
            <span class="font-body text-sm text-dd-text">Images this round</span>
            <Badge variant="secondary">{props.imageCount}</Badge>
          </div>

          {/* Timer info */}
          <Show when={props.session.votingDurationMinutes && roundStatus() === "voting"}>
            <div class="flex items-center justify-between">
              <span class="font-body text-sm text-dd-text">Timer</span>
              <Badge variant="accent">{props.session.votingDurationMinutes}m</Badge>
            </div>
          </Show>

          {/* Round flow action buttons */}
          <div class="space-y-2">
            <Show when={roundStatus() === "uploading"}>
              <Button class="w-full" onClick={handleStartVoting} disabled={loading()}>
                {loading() ? "Starting..." : "Start Voting"}
              </Button>
            </Show>

            <Show when={roundStatus() === "voting"}>
              <Button class="w-full" variant="accent" onClick={handleCloseVoting} disabled={loading()}>
                {loading() ? "Closing..." : "Close Voting"}
              </Button>
            </Show>

            <Show when={roundStatus() === "closed" && props.session.currentRound < props.session.totalRounds}>
              <Button class="w-full" variant="secondary" onClick={handleAdvanceRound} disabled={loading()}>
                {loading() ? "Advancing..." : "Next Round →"}
              </Button>
            </Show>

            <Show when={roundStatus() === "closed" && props.session.currentRound >= props.session.totalRounds}>
              <Badge variant="secondary" class="w-full justify-center py-2">
                All Rounds Complete
              </Badge>
            </Show>
          </div>
        </CardContent>
      </Card>

      <Show when={showQR()}>
        <QRShareDialog sessionCode={props.session.code} onClose={() => setShowQR(false)} />
      </Show>
    </>
  );
}
