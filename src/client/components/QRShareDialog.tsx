import { createSignal, onMount, Show } from "solid-js";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { badgeAppear } from "../lib/animations";
import QRCode from "qrcode";
import toast from "solid-toast";

interface QRShareDialogProps {
  sessionCode: string;
  onClose: () => void;
}

export function QRShareDialog(props: QRShareDialogProps) {
  const [svgHtml, setSvgHtml] = createSignal("");
  let qrRef!: HTMLDivElement;

  const sessionUrl = `${window.location.origin}/sessions/${props.sessionCode}`;

  onMount(async () => {
    try {
      const svg = await QRCode.toString(sessionUrl, {
        type: "svg",
        width: 256,
        margin: 2,
        color: { dark: "#E05A47", light: "#FFFFFF" },
      });
      setSvgHtml(svg);
      requestAnimationFrame(() => {
        if (qrRef) badgeAppear(qrRef);
      });
    } catch {
      toast.error("Failed to generate QR code");
    }
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join DouDou Session",
          text: `Join session ${props.sessionCode}`,
          url: sessionUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <Card class="max-w-xs w-full">
        <CardContent class="pt-6 text-center space-y-4">
          <Show when={svgHtml()}>
            <div
              ref={qrRef}
              class="mx-auto w-64 h-64"
              innerHTML={svgHtml()}
            />
          </Show>

          <p class="font-display font-bold text-2xl tracking-[4px] text-dd-text">
            {props.sessionCode}
          </p>

          <div class="flex gap-2 justify-center">
            <Show when={"share" in navigator}>
              <Button onClick={handleShare}>Share</Button>
            </Show>
            <Button variant={("share" in navigator) ? "ghost" : "primary"} onClick={handleCopy}>
              Copy Link
            </Button>
          </div>

          <Button variant="ghost" size="sm" class="w-full" onClick={props.onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
