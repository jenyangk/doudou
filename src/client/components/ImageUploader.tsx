import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import { WebcamCapture } from "./WebcamCapture";
import { pageEnter, badgeAppear } from "../lib/animations";
import toast from "solid-toast";

interface ImageUploaderProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

type State = "idle" | "preview" | "webcam" | "converting" | "uploading" | "success" | "error";

export function ImageUploader(props: ImageUploaderProps) {
  const [state, setState] = createSignal<State>("idle");
  const [file, setFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [progress, setProgress] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  let fileInput!: HTMLInputElement;
  let previewRef!: HTMLDivElement;
  let successRef!: HTMLDivElement;

  const reset = () => {
    setState("idle");
    setFile(null);
    if (previewUrl()) URL.revokeObjectURL(previewUrl()!);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInput) fileInput.value = "";
  };

  const processFile = async (f: File) => {
    // HEIC conversion
    if (f.name.toLowerCase().match(/\.heic|\.heif$/) || f.type === "image/heic") {
      setState("converting");
      try {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.9 });
        const converted = Array.isArray(blob) ? blob[0] : blob;
        f = new File([converted], f.name.replace(/\.heic|\.heif$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        toast.error("Failed to convert HEIC image");
        reset();
        return;
      }
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setState("preview");

    // Animate preview in
    requestAnimationFrame(() => {
      if (previewRef) pageEnter(previewRef);
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];

    if (!f.type.startsWith("image/") && !f.name.toLowerCase().match(/\.heic|\.heif$/)) {
      toast.error("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    processFile(f);
  };

  const startUpload = async () => {
    const f = file();
    if (!f) return;

    setState("uploading");
    setProgress(0);

    try {
      await uploadImage(props.sessionId, f, (pct) => setProgress(pct));
      setState("success");
      requestAnimationFrame(() => {
        if (successRef) badgeAppear(successRef);
      });
      toast.success("Image uploaded!");
      props.onUploadComplete?.();
      setTimeout(reset, 1500);
    } catch (err: any) {
      setState("error");
      toast.error(err.error ?? "Upload failed");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      class={`border-[3px] border-dashed rounded-dd-card p-4 text-center transition-colors ${
        dragging() ? "border-dd-primary bg-dd-accent/10" : "border-dd-muted-border bg-white"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* Idle state */}
      <Show when={state() === "idle"}>
        <p class="text-sm font-body text-dd-text-muted mb-3">
          Drag & drop an image, or
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <div class="flex gap-2 justify-center">
          <Button variant="ghost" size="sm" onClick={() => fileInput.click()}>
            Choose File
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setState("webcam")}>
            📸 Take Photo
          </Button>
        </div>
      </Show>

      {/* Webcam state */}
      <Show when={state() === "webcam"}>
        <WebcamCapture
          onCapture={(f) => processFile(f)}
          onClose={reset}
        />
      </Show>

      {/* Converting state */}
      <Show when={state() === "converting"}>
        <p class="text-sm font-body font-medium text-dd-text">Converting HEIC...</p>
      </Show>

      {/* Preview state */}
      <Show when={state() === "preview"}>
        <div ref={previewRef} style={{ opacity: 0 }}>
          <img
            src={previewUrl()!}
            alt="Preview"
            class="w-full h-32 object-cover rounded-dd-photo mb-2"
          />
          <p class="text-xs font-body text-dd-text-muted mb-2">
            {file()?.name} ({formatSize(file()?.size ?? 0)})
          </p>
          <div class="flex gap-2 justify-center">
            <Button size="sm" onClick={startUpload}>Upload</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
          </div>
        </div>
      </Show>

      {/* Uploading state */}
      <Show when={state() === "uploading"}>
        <div class="space-y-3">
          <p class="text-sm font-body font-medium text-dd-text">
            Uploading... {progress()}%
          </p>
          <ProgressBar percent={progress()} />
        </div>
      </Show>

      {/* Success state */}
      <Show when={state() === "success"}>
        <div ref={successRef} class="text-dd-success">
          <span class="text-3xl">✓</span>
          <p class="text-sm font-display font-bold mt-1">Uploaded!</p>
        </div>
      </Show>

      {/* Error state with retry */}
      <Show when={state() === "error"}>
        <div>
          <img
            src={previewUrl()!}
            alt="Preview"
            class="w-full h-32 object-cover rounded-dd-photo mb-2 opacity-60"
          />
          <p class="text-sm font-body text-dd-primary mb-2">Upload failed</p>
          <div class="flex gap-2 justify-center">
            <Button size="sm" onClick={startUpload}>Retry</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
