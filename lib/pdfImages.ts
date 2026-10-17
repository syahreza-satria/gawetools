import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, type PDFObject } from "pdf-lib";
import { loadPdf } from "@/lib/loadPdf";
import { yieldToUi } from "@/lib/yieldToUi";

export interface RecompressResult {
  bytes: Uint8Array;
  /** JPEG images found in the document. */
  total: number;
  /** Images actually replaced with a smaller version. */
  replaced: number;
}

const name = (n: string) => PDFName.of(n);

function isDctFilter(filter: PDFObject | undefined): boolean {
  if (filter instanceof PDFName) return filter.toString() === "/DCTDecode";
  if (filter instanceof PDFArray && filter.size() === 1) return filter.get(0)?.toString() === "/DCTDecode";
  return false;
}

/** True for RGB / gray JPEGs, which a canvas can decode and re-encode without changing their colors. */
function hasSafeColorSpace(dict: PDFDict): boolean {
  const cs = dict.get(name("ColorSpace"));
  if (cs instanceof PDFName) return cs.toString() === "/DeviceRGB" || cs.toString() === "/DeviceGray";
  if (cs instanceof PDFArray && cs.get(0)?.toString() === "/ICCBased") {
    const profile = dict.context.lookup(cs.get(1));
    const n = profile instanceof PDFRawStream ? profile.dict.get(name("N")) : undefined;
    return n instanceof PDFNumber && (n.asNumber() === 3 || n.asNumber() === 1);
  }
  return false;
}

async function reencode(jpeg: Uint8Array, maxDim: number, quality: number) {
  const bitmap = await createImageBitmap(new Blob([jpeg as Uint8Array<ArrayBuffer>], { type: "image/jpeg" }));
  try {
    const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Gagal menginisialisasi canvas context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal mengompres gambar"))), "image/jpeg", quality)
    );
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
  } finally {
    bitmap.close();
  }
}

/**
 * Shrinks the embedded JPEG images of a PDF in place, leaving text, fonts and layout untouched.
 * Images in other formats (Flate, CMYK, masks, ...) are skipped.
 */
export async function recompressPdfImages(
  data: ArrayBuffer,
  options: { maxDim: number; quality: number },
  onProgress?: (done: number, total: number) => void
): Promise<RecompressResult> {
  const doc = await loadPdf(data, { updateMetadata: false });
  const context = doc.context;

  const candidates = context
    .enumerateIndirectObjects()
    .filter(([, obj]) => obj instanceof PDFRawStream && obj.dict.get(name("Subtype"))?.toString() === "/Image" && isDctFilter(obj.dict.get(name("Filter"))));

  let replaced = 0;
  for (let i = 0; i < candidates.length; i++) {
    onProgress?.(i + 1, candidates.length);
    const [ref, obj] = candidates[i] as [typeof candidates[number][0], PDFRawStream];
    const dict = obj.dict;
    if (!hasSafeColorSpace(dict) || dict.has(name("Decode")) || dict.has(name("Mask"))) continue;

    try {
      const out = await reencode(obj.contents, options.maxDim, options.quality);
      if (out.bytes.length >= obj.contents.length * 0.95) continue;
      const next = dict.clone(context);
      next.set(name("Width"), PDFNumber.of(out.w));
      next.set(name("Height"), PDFNumber.of(out.h));
      next.set(name("ColorSpace"), name("DeviceRGB"));
      next.set(name("BitsPerComponent"), PDFNumber.of(8));
      next.delete(name("DecodeParms"));
      context.assign(ref, PDFRawStream.of(next, out.bytes));
      replaced++;
    } catch (err) {
      console.warn("Gambar dilewati:", err);
    }
    await yieldToUi();
  }

  return { bytes: await doc.save(), total: candidates.length, replaced };
}
