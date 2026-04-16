import { createSignal, onCleanup, Show } from "solid-js";
import { Button } from "./ui/Button";

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function WebcamCapture(props: WebcamCaptureProps) {
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  let videoRef!: HTMLVideoElement;
  let canvasRef!: HTMLCanvasElement;

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef) {
        videoRef.srcObject = s;
        videoRef.play();
      }
    } catch {
      setError("Could not access camera");
    }
  };

  const stopCamera = () => {
    stream()?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const capture = () => {
    if (!videoRef || !canvasRef) return;
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;
    const ctx = canvasRef.getContext("2d")!;
    ctx.drawImage(videoRef, 0, 0);
    canvasRef.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          stopCamera();
          props.onCapture(file);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  startCamera();

  onCleanup(stopCamera);

  return (
    <div class="space-y-3">
      <Show when={!error()} fallback={
        <p class="text-sm font-body text-dd-primary text-center">{error()}</p>
      }>
        <div class="relative rounded-dd-photo overflow-hidden bg-black">
          <video
            ref={videoRef}
            class="w-full aspect-video object-cover"
            autoplay
            playsinline
            muted
          />
        </div>
        <div class="flex gap-2 justify-center">
          <Button onClick={capture}>📸 Capture</Button>
          <Button variant="ghost" onClick={() => { stopCamera(); props.onClose(); }}>
            Cancel
          </Button>
        </div>
      </Show>
      <canvas ref={canvasRef} class="hidden" />
    </div>
  );
}
