import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
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
      class={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragging() ? "border-gray-900 bg-gray-50" : "border-gray-300"
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
          <div class="space-y-2">
            <p class="text-sm text-gray-600">Uploading... {progress()}%</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-gray-900 h-2 rounded-full transition-all"
                style={{ width: `${progress()}%` }}
              />
            </div>
          </div>
        }
      >
        <p class="text-sm text-gray-500 mb-2">
          Drag & drop an image here, or click to browse
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <Button variant="outline" size="sm" onClick={() => fileInput.click()}>
          Choose File
        </Button>
      </Show>
    </div>
  );
}
