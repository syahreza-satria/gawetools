// Person segmentation with MediaPipe Image Segmenter (Apache-2.0).
// The model (public/models) and the WASM runtime (public/mediapipe, copied on postinstall) are both
// served from this site, and the library is imported lazily so it is only fetched on this tool.
import type { ImageSegmenter } from "@mediapipe/tasks-vision";

const MODEL_URL = "/models/selfie_segmenter.tflite";
const WASM_BASE = "/mediapipe/wasm";

let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function fetchWithProgress(url: string, onProgress: (fraction: number) => void): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error("Gagal mengunduh model (" + res.status + ")");
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(Math.min(received / total, 1));
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  onProgress(1);
  return out;
}

export function loadSegmenter(onStatus: (text: string) => void): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      onStatus("Memuat mesin AI...");
      const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      const model = await fetchWithProgress(MODEL_URL, (f) => onStatus("Mengunduh model (" + Math.round(f * 100) + "%)..."));
      onStatus("Menyiapkan model...");
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetBuffer: model },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    })().catch((err) => {
      segmenterPromise = null; // allow a retry after a failed load
      throw err;
    });
  }
  return segmenterPromise;
}

/** Returns a canvas whose alpha channel is the person mask (same size as `source`). */
export async function personMask(
  segmenter: ImageSegmenter,
  source: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const result = segmenter.segment(source);
  try {
    const masks = result.confidenceMasks ?? [];
    if (masks.length === 0) throw new Error("Model tidak menghasilkan mask.");
    // Binary selfie model: index 0 = background, 1 = person (some builds expose only the person mask).
    const mask = masks.length > 1 ? masks[1] : masks[0];
    const values = mask.getAsFloat32Array();

    const small = document.createElement("canvas");
    small.width = mask.width;
    small.height = mask.height;
    const sctx = small.getContext("2d");
    if (!sctx) throw new Error("Gagal membuat canvas context");
    const img = sctx.createImageData(mask.width, mask.height);
    for (let i = 0; i < values.length; i++) {
      // Tighten the soft probability edge a little before feathering.
      const a = Math.min(Math.max((values[i] - 0.3) / 0.4, 0), 1);
      img.data[i * 4 + 3] = Math.round(a * 255);
    }
    sctx.putImageData(img, 0, 0);

    const full = document.createElement("canvas");
    full.width = source.width;
    full.height = source.height;
    const fctx = full.getContext("2d");
    if (!fctx) throw new Error("Gagal membuat canvas context");
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = "high";
    fctx.drawImage(small, 0, 0, full.width, full.height);
    return full;
  } finally {
    result.close();
  }
}
