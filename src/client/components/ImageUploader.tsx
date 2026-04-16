import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import toast from "solid-toast";

interface ImageUploaderProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

export function ImageUploader(props: ImageUploaderProps) {
  const [dragging, setDragging] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  let fileInput!: HTMLInputElement;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadImage(props.sessionId, file, (pct) => setProgress(pct));
      toast.success("Image uploaded!");
      props.onUploadComplete?.();
    } catch (err: any) {
      toast.error(err.error ?? "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      fileInput.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  return (
    <div
      class={`border-[3px] border-dashed rounded-dd-card p-6 text-center transition-colors ${
        dragging() ? "border-dd-primary bg-dd-accent/10" : "border-dd-muted-border bg-white"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Show
        when={!uploading()}
        fallback={
          <div class="space-y-3">
            <p class="text-sm font-body font-medium text-dd-text">
              Uploading... {progress()}%
            </p>
            <ProgressBar percent={progress()} />
          </div>
        }
      >
        <p class="text-sm font-body text-dd-text-muted mb-3">
          Drag & drop an image here, or click to browse
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <Button variant="ghost" size="sm" onClick={() => fileInput.click()}>
          Choose File
        </Button>
      </Show>
    </div>
  );
}
