import { yieldToUi } from "@/lib/yieldToUi";

export type SizeUnit = "KB" | "MB";

export const TARGET_CHIPS: { label: string; value: string; unit: SizeUnit }[] = [
  { label: "100 KB", value: "100", unit: "KB" },
  { label: "200 KB", value: "200", unit: "KB" },
  { label: "500 KB", value: "500", unit: "KB" },
  { label: "1 MB", value: "1", unit: "MB" },
  { label: "2 MB", value: "2", unit: "MB" },
];

/** Converts the typed target into bytes; NaN when the input is empty or not a positive number. */
export function targetToBytes(value: string, unit: SizeUnit): number {
  const n = parseFloat(value.replace(",", "."));
  if (!(n > 0)) return NaN;
  return Math.round(n * (unit === "MB" ? 1024 * 1024 : 1024));
}

export interface TargetResult {
  blob: Blob;
  /** true when the final size is at or below the requested target. */
  reached: boolean;
}

const MIN_QUALITY = 0.1;
const MAX_QUALITY = 0.95;
const MAX_QUALITY_ITERATIONS = 8;
const SHRINK_FACTOR = 0.9;
const MIN_DIMENSION = 48;

function encode(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat file gambar"))), mime, quality);
  });
}

/**
 * Re-encodes a bitmap as JPEG/WebP so it fits within `targetBytes`.
 * Binary-searches quality (0.1–0.95, max 8 iterations); if even the lowest quality is too big,
 * shrinks the dimensions by ×0.9 and tries again. Returns the smallest result when the target is unreachable.
 */
export async function compressBitmapToTarget(
  bitmap: ImageBitmap,
  mime: "image/jpeg" | "image/webp",
  targetBytes: number
): Promise<TargetResult> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal membuat canvas context");

  let width = bitmap.width;
  let height = bitmap.height;
  let smallest: Blob | null = null;

  const render = async (q: number): Promise<Blob> => {
    const blob = await encode(canvas, mime, q);
    if (!smallest || blob.size < smallest.size) smallest = blob;
    await yieldToUi();
    return blob;
  };

  for (;;) {
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const best = await render(MAX_QUALITY);
    if (best.size <= targetBytes) return { blob: best, reached: true };

    const worst = await render(MIN_QUALITY);
    if (worst.size <= targetBytes) {
      let lo = MIN_QUALITY; // fits
      let hi = MAX_QUALITY; // too big
      let fitting = worst;
      for (let i = 0; i < MAX_QUALITY_ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        const blob = await render(mid);
        if (blob.size <= targetBytes) {
          lo = mid;
          fitting = blob;
        } else {
          hi = mid;
        }
      }
      return { blob: fitting, reached: true };
    }

    if (Math.min(width, height) * SHRINK_FACTOR < MIN_DIMENSION) {
      return { blob: smallest ?? worst, reached: false };
    }
    width *= SHRINK_FACTOR;
    height *= SHRINK_FACTOR;
  }
}

/**
 * Searches an ordered ladder of settings (index 0 = best quality, largest output; last = smallest)
 * for the highest-quality step whose output fits `targetBytes`, using a binary search.
 * When even the last step is too big, that smallest output is returned with `reached: false`.
 */
export async function searchLadder<T extends { size: number }>(
  steps: number,
  build: (index: number) => Promise<T>,
  targetBytes: number
): Promise<{ result: T; reached: boolean }> {
  const first = await build(0);
  if (first.size <= targetBytes) return { result: first, reached: true };

  const last = await build(steps - 1);
  if (last.size > targetBytes) return { result: last, reached: false };

  let lo = 0; // too big
  let hi = steps - 1; // fits
  let best = last;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const attempt = await build(mid);
    if (attempt.size <= targetBytes) {
      hi = mid;
      best = attempt;
    } else {
      lo = mid;
    }
  }
  return { result: best, reached: true };
}
