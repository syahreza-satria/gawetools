"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
  PDFFont,
} from "pdf-lib";
import {
  Stamp,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Type,
  Image as ImageIcon,
  X,
} from "lucide-react";

// ─── pdfjs worker ─────────────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type WatermarkType = "text" | "image";
type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITION_GRID: { id: WatermarkPosition; label: string }[][] = [
  [
    { id: "top-left", label: "↖" },
    { id: "top-center", label: "↑" },
    { id: "top-right", label: "↗" },
  ],
  [
    { id: "center-left", label: "←" },
    { id: "center", label: "●" },
    { id: "center-right", label: "→" },
  ],
  [
    { id: "bottom-left", label: "↙" },
    { id: "bottom-center", label: "↓" },
    { id: "bottom-right", label: "↘" },
  ],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

function getTextXY(
  position: WatermarkPosition,
  pageW: number,
  pageH: number,
  textW: number,
  textH: number,
  margin: number
): { x: number; y: number } {
  const m = margin;
  switch (position) {
    case "top-left": return { x: m, y: pageH - textH - m };
    case "top-center": return { x: (pageW - textW) / 2, y: pageH - textH - m };
    case "top-right": return { x: pageW - textW - m, y: pageH - textH - m };
    case "center-left": return { x: m, y: (pageH - textH) / 2 };
    case "center": return { x: (pageW - textW) / 2, y: (pageH - textH) / 2 };
    case "center-right": return { x: pageW - textW - m, y: (pageH - textH) / 2 };
    case "bottom-left": return { x: m, y: m };
    case "bottom-center": return { x: (pageW - textW) / 2, y: m };
    case "bottom-right": return { x: pageW - textW - m, y: m };
  }
}

function getImageXY(
  position: WatermarkPosition,
  pageW: number,
  pageH: number,
  imgW: number,
  imgH: number,
  margin: number
): { x: number; y: number } {
  const m = margin;
  switch (position) {
    case "top-left": return { x: m, y: pageH - imgH - m };
    case "top-center": return { x: (pageW - imgW) / 2, y: pageH - imgH - m };
    case "top-right": return { x: pageW - imgW - m, y: pageH - imgH - m };
    case "center-left": return { x: m, y: (pageH - imgH) / 2 };
    case "center": return { x: (pageW - imgW) / 2, y: (pageH - imgH) / 2 };
    case "center-right": return { x: pageW - imgW - m, y: (pageH - imgH) / 2 };
    case "bottom-left": return { x: m, y: m };
    case "bottom-center": return { x: (pageW - imgW) / 2, y: m };
    case "bottom-right": return { x: pageW - imgW - m, y: m };
  }
}

// Convert hex color to CSS rgba string
function hexToRgbaCss(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${opacity})`;
}

// ─── PDF Watermark Logic ──────────────────────────────────────────────────────

async function applyTextWatermarkToPdf(
  fileBytes: Uint8Array,
  text: string,
  color: string,
  opacity: number,
  fontSize: number, // as % of page width
  position: WatermarkPosition,
  marginPct: number, // as % of page width
  rotation: number,
  allPages: boolean,
  targetPageIndices: number[] // 0-based, used when allPages=false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBytes);
  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { r, g, b } = hexToRgb(color);
  const pages = pdfDoc.getPages();

  const indicesToWatermark = allPages
    ? pages.map((_, i) => i)
    : targetPageIndices;

  for (const idx of indicesToWatermark) {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const scaledFontSize = Math.max(8, Math.round((width * fontSize) / 100));
    const margin = Math.round((width * marginPct) / 100);
    const textWidth = font.widthOfTextAtSize(text, scaledFontSize);
    const textHeight = font.heightAtSize(scaledFontSize);

    const { x, y } = getTextXY(position, width, height, textWidth, textHeight, margin);

    page.drawText(text, {
      x,
      y,
      size: scaledFontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return pdfDoc.save();
}

async function applyImageWatermarkToPdf(
  fileBytes: Uint8Array,
  imageBytes: ArrayBuffer,
  imageType: "png" | "jpg",
  scalePct: number, // % of page width
  opacity: number,
  position: WatermarkPosition,
  marginPct: number,
  allPages: boolean,
  targetPageIndices: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBytes);
  const embeddedImage =
    imageType === "png"
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

  const pages = pdfDoc.getPages();
  const indicesToWatermark = allPages
    ? pages.map((_, i) => i)
    : targetPageIndices;

  for (const idx of indicesToWatermark) {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const margin = Math.round((width * marginPct) / 100);
    const imgW = Math.round((width * scalePct) / 100);
    const imgH = Math.round((embeddedImage.height / embeddedImage.width) * imgW);

    const { x, y } = getImageXY(position, width, height, imgW, imgH, margin);

    page.drawImage(embeddedImage, {
      x,
      y,
      width: imgW,
      height: imgH,
      opacity,
    });
  }

  return pdfDoc.save();
}

// ─── Live Preview using Canvas ────────────────────────────────────────────────
// Renders page 1 of the PDF via pdfjs and overlays the watermark

async function renderPreview(
  pdfBytes: Uint8Array,
  wmType: WatermarkType,
  wmText: string,
  wmColor: string,
  wmOpacity: number,
  wmFontSize: number,
  wmPosition: WatermarkPosition,
  wmMargin: number,
  wmRotation: number,
  wmImageUrl: string | null,
  wmImageScale: number
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  const unscaled = page.getViewport({ scale: 1 });
  const maxW = 420;
  const scale = Math.min(maxW / unscaled.width, 1.5);
  const vp = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  (pdfDoc as unknown as { destroy?: () => void })?.destroy?.();

  // Overlay watermark
  if (wmType === "text" && wmText.trim()) {
    const scaledFontSize = Math.max(8, Math.round((canvas.width * wmFontSize) / 100));
    const margin = Math.round((canvas.width * wmMargin) / 100);
    ctx.save();
    ctx.font = `bold ${scaledFontSize}px Arial`;
    ctx.textBaseline = "top";
    const tw = ctx.measureText(wmText).width;
    const th = scaledFontSize * 1.2;
    const { x, y } = getTextXY(wmPosition, canvas.width, canvas.height, tw, th, margin);
    ctx.globalAlpha = wmOpacity;
    ctx.fillStyle = hexToRgbaCss(wmColor, 1);
    if (wmRotation !== 0) {
      ctx.translate(x + tw / 2, y + th / 2);
      ctx.rotate((wmRotation * Math.PI) / 180);
      ctx.fillText(wmText, -tw / 2, -th / 2);
    } else {
      ctx.fillText(wmText, x, y);
    }
    ctx.restore();
  } else if (wmType === "image" && wmImageUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const imgW = Math.round((canvas.width * wmImageScale) / 100);
        const imgH = Math.round((img.naturalHeight / img.naturalWidth) * imgW);
        const margin = Math.round((canvas.width * wmMargin) / 100);
        const { x, y } = getImageXY(wmPosition, canvas.width, canvas.height, imgW, imgH, margin);
        ctx.save();
        ctx.globalAlpha = wmOpacity;
        ctx.drawImage(img, x, y, imgW, imgH);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = wmImageUrl;
    });
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WatermarkPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Watermark settings
  const [wmType, setWmType] = useState<WatermarkType>("text");
  const [wmText, setWmText] = useState("RAHASIA");
  const [wmColor, setWmColor] = useState("#ff0000");
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmFontSize, setWmFontSize] = useState(8); // % of page width
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>("center");
  const [wmMargin, setWmMargin] = useState(5);
  const [wmRotation, setWmRotation] = useState(0);
  const [wmAllPages, setWmAllPages] = useState(true);

  // Image watermark
  const [wmImageFile, setWmImageFile] = useState<File | null>(null);
  const [wmImageUrl, setWmImageUrl] = useState<string | null>(null);
  const [wmImageScale, setWmImageScale] = useState(30);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const wmImageInputRef = useRef<HTMLInputElement>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load PDF on drop ──
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }
    const picked = acceptedFiles[0];
    if (!picked) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResultBlob(null);
    setPreviewDataUrl(null);

    try {
      const ab = await picked.arrayBuffer();
      const bytes = new Uint8Array(ab);
      // Quick check with pdfjs to get page count
      const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
      const doc = await task.promise;
      setPageCount(doc.numPages);
      (doc as unknown as { destroy?: () => void })?.destroy?.();
      setPdfBytes(bytes);
      setFile(picked);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal membuka PDF: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // ── Refresh preview with debounce ──
  useEffect(() => {
    if (!pdfBytes) return;
    if (wmType === "text" && !wmText.trim()) return;
    if (wmType === "image" && !wmImageUrl) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const url = await renderPreview(
          pdfBytes, wmType, wmText, wmColor, wmOpacity,
          wmFontSize, wmPosition, wmMargin, wmRotation, wmImageUrl, wmImageScale
        );
        setPreviewDataUrl(url);
      } catch {
        // silent preview errors
      } finally {
        setIsPreviewLoading(false);
      }
    }, 400);

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [pdfBytes, wmType, wmText, wmColor, wmOpacity, wmFontSize, wmPosition, wmMargin, wmRotation, wmImageUrl, wmImageScale]);

  // ── Image watermark file selection ──
  const handleWmImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setWmImageFile(f);
    if (wmImageUrl) URL.revokeObjectURL(wmImageUrl);
    setWmImageUrl(URL.createObjectURL(f));
    setResultBlob(null);
  };

  const handleReset = () => {
    setFile(null);
    setPdfBytes(null);
    setPageCount(0);
    setResultBlob(null);
    setPreviewDataUrl(null);
    setErrorMessage(null);
    setProgressText("");
    if (wmImageUrl) URL.revokeObjectURL(wmImageUrl);
    setWmImageFile(null);
    setWmImageUrl(null);
  };

  // ── Apply watermark ──
  const handleApply = async () => {
    if (!pdfBytes || !file) return;
    if (wmType === "text" && !wmText.trim()) {
      setErrorMessage("Teks watermark tidak boleh kosong.");
      return;
    }
    if (wmType === "image" && !wmImageFile) {
      setErrorMessage("Pilih gambar watermark terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setResultBlob(null);
    setProgressText("Menerapkan watermark ke semua halaman...");

    try {
      let resultBytes: Uint8Array;

      if (wmType === "text") {
        resultBytes = await applyTextWatermarkToPdf(
          pdfBytes, wmText, wmColor, wmOpacity, wmFontSize,
          wmPosition, wmMargin, wmRotation, wmAllPages, []
        );
      } else {
        const imageAb = await wmImageFile!.arrayBuffer();
        const isJpg =
          wmImageFile!.type === "image/jpeg" ||
          wmImageFile!.name.toLowerCase().endsWith(".jpg") ||
          wmImageFile!.name.toLowerCase().endsWith(".jpeg");
        resultBytes = await applyImageWatermarkToPdf(
          pdfBytes, imageAb, isJpg ? "jpg" : "png",
          wmImageScale, wmOpacity, wmPosition, wmMargin, wmAllPages, []
        );
      }

      const blob = new Blob([resultBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const baseName = file.name.replace(/\.pdf$/i, "");
      setResultBlob(blob);
      setResultFilename(`${baseName}_watermark.pdf`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal menerapkan watermark: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (resultBlob) saveAs(resultBlob, resultFilename);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <Stamp className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Watermark PDF
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Tambahkan watermark teks atau logo ke seluruh halaman PDF langsung di browser
          — tanpa upload ke server.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:underline font-semibold text-xs ml-2">
            Tutup
          </button>
        </div>
      )}

      {/* Success banner */}
      {resultBlob && (
        <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Watermark berhasil diterapkan!</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {pageCount} halaman · {formatBytes(resultBlob.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                File Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-white dark:bg-zinc-950 ${
            isDragActive
              ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/30"
              : "border-gray-300 dark:border-zinc-800 hover:border-sky-400 hover:bg-sky-50/10 dark:hover:bg-sky-950/10"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Stamp className="w-7 h-7" />}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isLoading ? "Memuat PDF..." : isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih — satu file PDF
          </p>
          {!isLoading && (
            <div className="mt-6">
              <button type="button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors">
                <FileText className="w-4 h-4" />
                Pilih File PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor — shown after PDF loaded */}
      {file && pdfBytes && (
        <div className="space-y-5">
          {/* File info bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatBytes(file.size)} · {pageCount} halaman</p>
              </div>
            </div>
            <button onClick={handleReset} disabled={isProcessing} className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Settings + Preview side-by-side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── Settings Panel ── */}
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-5">

              {/* Watermark type toggle */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Jenis Watermark</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(["text", "image"] as WatermarkType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWmType(t)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        wmType === t
                          ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500 text-sky-600 dark:text-sky-400"
                          : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {t === "text" ? <Type className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      {t === "text" ? "Teks" : "Logo / Gambar"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text watermark options */}
              {wmType === "text" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Teks Watermark</label>
                    <input
                      type="text"
                      value={wmText}
                      onChange={(e) => { setWmText(e.target.value); setResultBlob(null); }}
                      placeholder="Contoh: RAHASIA, DRAFT, © 2025"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Warna Teks</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={wmColor}
                          onChange={(e) => { setWmColor(e.target.value); setResultBlob(null); }}
                          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{wmColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Ukuran ({wmFontSize}%)</label>
                      <input
                        type="range" min={2} max={25} value={wmFontSize}
                        onChange={(e) => { setWmFontSize(Number(e.target.value)); setResultBlob(null); }}
                        className="w-full accent-sky-500 mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Rotasi ({wmRotation}°)
                    </label>
                    <input
                      type="range" min={-90} max={90} step={5} value={wmRotation}
                      onChange={(e) => { setWmRotation(Number(e.target.value)); setResultBlob(null); }}
                      className="w-full accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      <span>-90°</span><span>0°</span><span>+90°</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image watermark options */}
              {wmType === "image" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Gambar Watermark (PNG transparan disarankan)
                    </label>
                    <input
                      ref={wmImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleWmImageChange}
                      className="hidden"
                    />
                    {wmImageFile ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {wmImageUrl && <img src={wmImageUrl} alt="watermark" className="w-10 h-10 object-contain rounded" />}
                        <span className="flex-1 text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{wmImageFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setWmImageFile(null); if (wmImageUrl) URL.revokeObjectURL(wmImageUrl); setWmImageUrl(null); setResultBlob(null); }}
                          className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => wmImageInputRef.current?.click()}
                        className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500 dark:text-zinc-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        + Pilih gambar watermark
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Ukuran Logo ({wmImageScale}%)</label>
                    <input
                      type="range" min={5} max={80} value={wmImageScale}
                      onChange={(e) => { setWmImageScale(Number(e.target.value)); setResultBlob(null); }}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Common options */}
              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">Posisi</label>
                  <div className="inline-grid grid-cols-3 gap-1">
                    {POSITION_GRID.map((row, ri) =>
                      row.map((cell) => (
                        <button
                          key={cell.id}
                          type="button"
                          onClick={() => { setWmPosition(cell.id); setResultBlob(null); }}
                          className={`w-9 h-9 rounded-lg text-base font-bold transition-all ${
                            wmPosition === cell.id
                              ? "bg-sky-500 text-white shadow"
                              : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400"
                          }`}
                          title={cell.id}
                        >
                          {cell.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Transparansi ({Math.round(wmOpacity * 100)}%)
                  </label>
                  <input
                    type="range" min={5} max={100} value={Math.round(wmOpacity * 100)}
                    onChange={(e) => { setWmOpacity(Number(e.target.value) / 100); setResultBlob(null); }}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    <span>Sangat transparan</span><span>Solid</span>
                  </div>
                </div>

                {/* Margin */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Jarak dari tepi ({wmMargin}%)</label>
                  <input
                    type="range" min={0} max={20} value={wmMargin}
                    onChange={(e) => { setWmMargin(Number(e.target.value)); setResultBlob(null); }}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* ── Preview Panel ── */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Preview (Halaman 1)</h3>
                {isPreviewLoading && <Loader2 className="w-4 h-4 animate-spin text-sky-500" />}
              </div>
              <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-zinc-900 p-4 min-h-[260px]">
                {previewDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDataUrl}
                    alt="PDF watermark preview"
                    className="max-w-full max-h-[400px] object-contain rounded shadow-sm border border-gray-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="text-center text-gray-400 dark:text-zinc-600 text-sm">
                    {wmType === "image" && !wmImageUrl
                      ? "Pilih gambar watermark untuk melihat preview"
                      : "Preview akan muncul setelah pengaturan diubah"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {isProcessing ? progressText : "Proses sepenuhnya di browser — file tidak dikirim ke server."}
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || (wmType === "text" && !wmText.trim()) || (wmType === "image" && !wmImageFile)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Stamp className="w-4 h-4" />
                  <span>Terapkan Watermark</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
