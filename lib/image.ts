export type OutputMime = "image/jpeg" | "image/png" | "image/webp";

export const OUTPUT_FORMATS: { value: OutputMime; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function baseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function extFor(mime: OutputMime): string {
  return OUTPUT_FORMATS.find((f) => f.value === mime)?.ext ?? "png";
}

/** Decode an image file into a bitmap that can be drawn on a canvas. */
export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("Gagal membaca gambar. Pastikan file tidak rusak.");
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: OutputMime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal membuat file gambar"))),
      mime,
      mime === "image/png" ? undefined : quality
    );
  });
}

/** Draw a bitmap at the given size and encode it. JPEG gets a white background (no alpha). */
export async function renderBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  mime: OutputMime,
  quality = 0.9
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal membuat canvas context");
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, mime, quality);
}
