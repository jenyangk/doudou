export async function compressImage(file: File, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxDim = 2048;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (
    file.type !== "image/heic" &&
    file.type !== "image/heif" &&
    !file.name.toLowerCase().endsWith(".heic")
  ) {
    return file;
  }

  const { default: heic2any } = await import("heic2any");

  const blob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 1.0,
  });

  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  return new File(
    [resultBlob],
    file.name.replace(/\.(heic|HEIC|heif|HEIF)$/, ".jpg"),
    { type: "image/jpeg" }
  );
}

export async function processImageForUpload(file: File): Promise<File> {
  let processed = await convertHeicToJpeg(file);
  processed = await compressImage(processed);
  return processed;
}
