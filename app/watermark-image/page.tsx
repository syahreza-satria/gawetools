"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
  Stamp,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
  X,
  Type,
  Image as ImageIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type WatermarkType = "text" | "image";
type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

interface WatermarkResult {
  originalFile: File;
  originalSize: number;
  resultBlob: Blob;
  resultSize: number;
  previewUrl: string;
  filename: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/png", label: "PNG", ext: "png" },
];

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

const FONT_OPTIONS = [
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Verdana", label: "Verdana" },
  { value: "Impact", label: "Impact" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getPositionCoords(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
  margin: number
): { x: number; y: number } {
  const positions: Record<WatermarkPosition, { x: number; y: number }> = {
    "top-left": { x: margin, y: margin },
    "top-center": { x: (canvasW - wmW) / 2, y: margin },
    "top-right": { x: canvasW - wmW - margin, y: margin },
    "center-left": { x: margin, y: (canvasH - wmH) / 2 },
    center: { x: (canvasW - wmW) / 2, y: (canvasH - wmH) / 2 },
    "center-right": { x: canvasW - wmW - margin, y: (canvasH - wmH) / 2 },
    "bottom-left": { x: margin, y: canvasH - wmH - margin },
    "bottom-center": { x: (canvasW - wmW) / 2, y: canvasH - wmH - margin },
    "bottom-right": { x: canvasW - wmW - margin, y: canvasH - wmH - margin },
  };
  return positions[position];
}

async function applyTextWatermark(
  file: File,
  text: string,
  font: string,
  fontSize: number,
  color: string,
  opacity: number,
  position: WatermarkPosition,
  margin: number,
  outputFormat: OutputFormat
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Gagal membuat canvas context"));

      if (outputFormat !== "image/png") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const scaledFontSize = Math.max(
        12,
        Math.round((canvas.width * fontSize) / 100)
      );
      const scaledMargin = Math.round((canvas.width * margin) / 100);

      ctx.save();
      ctx.font = `bold ${scaledFontSize}px "${font}"`;
      ctx.textBaseline = "top";
      const metrics = ctx.measureText(text);
      const wmW = metrics.width;
      const wmH = scaledFontSize * 1.2;

      const { x, y } = getPositionCoords(
        position,
        canvas.width,
        canvas.height,
        wmW,
        wmH,
        scaledMargin
      );

      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();

      const q = outputFormat === "image/png" ? undefined : 0.92;
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Gagal memproses gambar"));
          resolve(blob);
        },
        outputFormat,
        q
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Gagal memuat gambar: ${file.name}`));
    };
    img.src = url;
  });
}

async function applyImageWatermark(
  file: File,
  watermarkFile: File,
  wmScale: number,
  opacity: number,
  position: WatermarkPosition,
  margin: number,
  outputFormat: OutputFormat
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const wm = new Image();
    const url = URL.createObjectURL(file);
    const wmUrl = URL.createObjectURL(watermarkFile);

    img.onload = () => {
      wm.onload = () => {
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(wmUrl);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Gagal membuat canvas context"));

        if (outputFormat !== "image/png") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const wmW = Math.round((canvas.width * wmScale) / 100);
        const wmH = Math.round((wm.naturalHeight / wm.naturalWidth) * wmW);
        const scaledMargin = Math.round((canvas.width * margin) / 100);

        const { x, y } = getPositionCoords(
          position,
          canvas.width,
          canvas.height,
          wmW,
          wmH,
          scaledMargin
        );

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(wm, x, y, wmW, wmH);
        ctx.restore();

        const q = outputFormat === "image/png" ? undefined : 0.92;
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal memproses gambar"));
            resolve(blob);
          },
          outputFormat,
          q
        );
      };
      wm.onerror = () => {
        URL.revokeObjectURL(wmUrl);
        reject(new Error("Gagal memuat gambar watermark"));
      };
      wm.src = wmUrl;
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Gagal memuat gambar: ${file.name}`));
    };
    img.src = url;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WatermarkImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string | null>(null);

  const [wmType, setWmType] = useState<WatermarkType>("text");
  const [wmText, setWmText] = useState("GaweTools");
  const [wmFont, setWmFont] = useState("Arial");
  const [wmFontSize, setWmFontSize] = useState(5);
  const [wmColor, setWmColor] = useState("#ffffff");
  const [wmOpacity, setWmOpacity] = useState(0.7);
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>("bottom-right");
  const [wmMargin, setWmMargin] = useState(3);
  const [wmScale, setWmScale] = useState(25);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<WatermarkResult[]>([]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setErrorMessage("Hanya file JPEG, PNG, dan WebP yang diperbolehkan.");
        return;
      }
      if (acceptedFiles.length > 0) {
        setFiles((prev) => {
          const existing = new Set(prev.map((f) => f.name + f.size));
          const newFiles = acceptedFiles.filter(
            (f) => !existing.has(f.name + f.size)
          );
          return [...prev, ...newFiles];
        });
        setErrorMessage(null);
        setResults([]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: true,
  });

  useEffect(() => {
    if (files.length > 0 && !previewFile) {
      setPreviewFile(files[0]);
    } else if (files.length === 0) {
      setPreviewFile(null);
      setPreviewUrl(null);
    }
  }, [files, previewFile]);

  useEffect(() => {
    if (!previewFile) return;

    let cancelled = false;
    const img = new Image();
    const url = URL.createObjectURL(previewFile);

    img.onload = () => {
      if (cancelled) { URL.revokeObjectURL(url); return; }
      const canvas = previewCanvasRef.current;
      if (!canvas) { URL.revokeObjectURL(url); return; }

      const maxW = 480;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      if (wmType === "text" && wmText.trim()) {
        const scaledFontSize = Math.max(
          8,
          Math.round((canvas.width * wmFontSize) / 100)
        );
        const scaledMargin = Math.round((canvas.width * wmMargin) / 100);
        ctx.save();
        ctx.font = `bold ${scaledFontSize}px "${wmFont}"`;
        ctx.textBaseline = "top";
        const metrics = ctx.measureText(wmText);
        const wmW = metrics.width;
        const wmH = scaledFontSize * 1.2;
        const { x, y } = getPositionCoords(
          wmPosition,
          canvas.width,
          canvas.height,
          wmW,
          wmH,
          scaledMargin
        );
        ctx.globalAlpha = wmOpacity;
        ctx.fillStyle = wmColor;
        ctx.fillText(wmText, x, y);
        ctx.restore();
        setPreviewUrl(canvas.toDataURL());
      } else if (wmType === "image" && watermarkImageFile) {
        const wmImg = new Image();
        const wmUrl = URL.createObjectURL(watermarkImageFile);
        wmImg.onload = () => {
          if (cancelled) { URL.revokeObjectURL(wmUrl); return; }
          const wmW = Math.round((canvas.width * wmScale) / 100);
          const wmH = Math.round((wmImg.naturalHeight / wmImg.naturalWidth) * wmW);
          const scaledMargin = Math.round((canvas.width * wmMargin) / 100);
          const { x, y } = getPositionCoords(
            wmPosition,
            canvas.width,
            canvas.height,
            wmW,
            wmH,
            scaledMargin
          );
          ctx.save();
          ctx.globalAlpha = wmOpacity;
          ctx.drawImage(wmImg, x, y, wmW, wmH);
          ctx.restore();
          URL.revokeObjectURL(wmUrl);
          setPreviewUrl(canvas.toDataURL());
        };
        wmImg.src = wmUrl;
      } else {
        setPreviewUrl(canvas.toDataURL());
      }
    };

    img.src = url;
    return () => { cancelled = true; };
  }, [
    previewFile, wmType, wmText, wmFont, wmFontSize, wmColor,
    wmOpacity, wmPosition, wmMargin, wmScale, watermarkImageFile,
  ]);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (previewFile === prev[index]) {
        setPreviewFile(next.length > 0 ? next[0] : null);
      }
      return next;
    });
    setResults([]);
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setErrorMessage(null);
    setProgressText("");
    setPreviewFile(null);
    setPreviewUrl(null);
    setWatermarkImageFile(null);
    setWatermarkImagePreview(null);
  };

  const handleWatermarkImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setWatermarkImageFile(f);
    const u = URL.createObjectURL(f);
    setWatermarkImagePreview(u);
    setResults([]);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    if (wmType === "text" && !wmText.trim()) {
      setErrorMessage("Teks watermark tidak boleh kosong.");
      return;
    }
    if (wmType === "image" && !watermarkImageFile) {
      setErrorMessage("Pilih gambar watermark terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setResults([]);
    const fmt = FORMAT_OPTIONS.find((f) => f.value === outputFormat)!;
    const newResults: WatermarkResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`Memproses ${i + 1} dari ${files.length}: ${file.name}`);

        let blob: Blob;
        if (wmType === "text") {
          blob = await applyTextWatermark(
            file, wmText, wmFont, wmFontSize, wmColor,
            wmOpacity, wmPosition, wmMargin, outputFormat
          );
        } else {
          blob = await applyImageWatermark(
            file, watermarkImageFile!, wmScale,
            wmOpacity, wmPosition, wmMargin, outputFormat
          );
        }

        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const filename = `${baseName}_watermark.${fmt.ext}`;
        const blobUrl = URL.createObjectURL(blob);
        newResults.push({
          originalFile: file,
          originalSize: file.size,
          resultBlob: blob,
          resultSize: blob.size,
          previewUrl: blobUrl,
          filename,
        });
      }
      setResults(newResults);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal memproses gambar: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDownloadSingle = (result: WatermarkResult) => {
    saveAs(result.resultBlob, result.filename);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.filename, r.resultBlob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "watermarked_images.zip");
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <Stamp className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Watermark Gambar
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Tambahkan watermark teks atau logo ke gambar JPEG, PNG, dan WebP
          langsung di browser tanpa upload ke server.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-start gap-3 text-sky-800 dark:text-sky-200 text-sm">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    {results.length} gambar berhasil diberi watermark!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Unduh satu per satu atau sekaligus dalam ZIP.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
                  >
                    <PackageOpen className="w-4 h-4" />
                    Download ZIP
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Proses File Lain
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.previewUrl}
                  alt={r.originalFile.name}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-xs text-gray-900 dark:text-white truncate"
                    title={r.originalFile.name}
                  >
                    {r.originalFile.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    <span>{formatBytes(r.originalSize)}</span>
                    <span>→</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      {formatBytes(r.resultSize)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadSingle(r)}
                  title="Download"
                  className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors shrink-0"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main UI */}
      {results.length === 0 && (
        <>
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
              <Stamp className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {isDragActive ? "Lepaskan gambar di sini" : "Tarik & Lepas Gambar ke Sini"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
              atau klik untuk memilih — support JPEG, PNG, WebP (bisa banyak file)
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
              >
                <Stamp className="w-4 h-4" />
                Pilih Gambar
              </button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* File list */}
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        title="Preview file ini"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          previewFile === file
                            ? "bg-sky-500 text-white"
                            : "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Settings + Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-6">
                  {/* Watermark type */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Jenis Watermark
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setWmType("text")}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                          wmType === "text"
                            ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500 text-sky-600 dark:text-sky-400"
                            : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <Type className="w-4 h-4" />
                        Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setWmType("image")}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                          wmType === "image"
                            ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500 text-sky-600 dark:text-sky-400"
                            : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Logo / Gambar
                      </button>
                    </div>
                  </div>

                  {/* Text options */}
                  {wmType === "text" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Teks Watermark
                        </label>
                        <input
                          type="text"
                          value={wmText}
                          onChange={(e) => setWmText(e.target.value)}
                          placeholder="Contoh: © GaweTools 2025"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Font
                        </label>
                        <select
                          value={wmFont}
                          onChange={(e) => setWmFont(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                            Warna Teks
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={wmColor}
                              onChange={(e) => setWmColor(e.target.value)}
                              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer bg-transparent"
                            />
                            <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{wmColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                            Ukuran ({wmFontSize}%)
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={20}
                            value={wmFontSize}
                            onChange={(e) => setWmFontSize(Number(e.target.value))}
                            className="w-full accent-sky-500 mt-2"
                          />
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
                          ref={watermarkInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleWatermarkImageChange}
                          className="hidden"
                        />
                        {watermarkImagePreview ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={watermarkImagePreview}
                              alt="watermark preview"
                              className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-zinc-700"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {watermarkImageFile?.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                {watermarkImageFile && formatBytes(watermarkImageFile.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setWatermarkImageFile(null); setWatermarkImagePreview(null); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => watermarkInputRef.current?.click()}
                            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500 dark:text-zinc-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Pilih Logo / Gambar
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Ukuran Logo ({wmScale}% lebar gambar)
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={60}
                          value={wmScale}
                          onChange={(e) => setWmScale(Number(e.target.value))}
                          className="w-full accent-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Opacity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Transparansi ({Math.round(wmOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round(wmOpacity * 100)}
                      onChange={(e) => setWmOpacity(Number(e.target.value) / 100)}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  {/* Margin */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Jarak dari tepi ({wmMargin}% lebar gambar)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      value={wmMargin}
                      onChange={(e) => setWmMargin(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Posisi Watermark
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5 w-36">
                      {POSITION_GRID.map((row) =>
                        row.map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setWmPosition(pos.id)}
                            title={pos.id}
                            className={`w-10 h-10 rounded-lg text-base font-bold transition-all ${
                              wmPosition === pos.id
                                ? "bg-sky-500 text-white ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-zinc-950"
                                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-600 dark:hover:text-sky-400"
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Format output */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Format Output
                    </h3>
                    <div className="flex items-center gap-2">
                      {FORMAT_OPTIONS.map((fmt) => (
                        <button
                          key={fmt.value}
                          type="button"
                          onClick={() => setOutputFormat(fmt.value)}
                          disabled={isProcessing}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            outputFormat === fmt.value
                              ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500"
                              : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    {outputFormat === "image/png" && (
                      <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                        PNG mendukung transparansi — cocok jika gambar sumber memiliki latar belakang transparan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Live preview */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Preview Langsung
                  </h3>
                  <div className="flex-1 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center min-h-48">
                    {previewFile ? (
                      previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="max-w-full max-h-72 object-contain rounded"
                        />
                      ) : (
                        <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                      )
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-zinc-500 text-center px-4">
                        Pilih gambar untuk melihat preview watermark
                      </p>
                    )}
                  </div>
                  <canvas ref={previewCanvasRef} className="hidden" />
                  {files.length > 1 && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500 text-center">
                      Preview: {previewFile?.name}. Klik ikon gambar di file list untuk ganti preview.
                    </p>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Proses dijalankan langsung di perangkat Anda tanpa upload file.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={isProcessing || files.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{progressText || "Memproses..."}</span>
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4" />
                        <span>
                          Tambah Watermark{files.length > 1 ? ` (${files.length} Gambar)` : ""}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
