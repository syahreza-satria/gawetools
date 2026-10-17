import type { Worker as TesseractWorker } from "tesseract.js";

// tesseract.js (Apache-2.0) with every asset hosted on this site: worker + WASM cores are copied to
// public/tesseract on postinstall, and the tessdata_fast language files live in public/tesseract/lang.
export type OcrLang = "ind+eng" | "ind" | "eng";

export const OCR_LANGS: { id: OcrLang; label: string }[] = [
  { id: "ind+eng", label: "Indonesia + Inggris" },
  { id: "ind", label: "Indonesia" },
  { id: "eng", label: "Inggris" },
];

export interface OcrPageResult {
  text: string;
  /** Single-page searchable PDF (image + invisible text layer), when requested. */
  pdf: Uint8Array | null;
}

export async function createOcrWorker(lang: OcrLang, onProgress: (fraction: number, status: string) => void): Promise<TesseractWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(lang.split("+"), 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
    gzip: false,
    workerBlobURL: false,
    cacheMethod: "none",
    logger: (m) => onProgress(m.progress ?? 0, m.status ?? ""),
  });
}

export async function recognizePage(worker: TesseractWorker, image: Blob, withPdf: boolean): Promise<OcrPageResult> {
  const { data } = await worker.recognize(image, {}, { text: true, pdf: withPdf });
  return { text: data.text.trim(), pdf: data.pdf ? new Uint8Array(data.pdf) : null };
}
