"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
  ImageDown,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
  X,
} from "lucide-react";

type CompressionLevel = "low" | "medium" | "high";
type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

interface LevelOption {
  id: CompressionLevel;
  title: string;
  desc: string;
  quality: number;
}

interface ImageResult {
  originalFile: File;
  originalSize: number;
  resultBlob: Blob;
  resultSize: number;
  previewUrl: string;
  filename: string;
}

const COMPRESSION_LEVELS: LevelOption[] = [
  {
    id: "low",
    title: "Kompresi Ringan",
    desc: "Kualitas tertinggi, ukuran berkurang sedikit",
    quality: 0.85,
  },
  {
    id: "medium",
    title: "Kompresi Sedang (Rekomendasi)",
    desc: "Keseimbangan terbaik antara kualitas & ukuran",
    quality: 0.65,
  },
  {
    id: "high",
    title: "Kompresi Kuat",
    desc: "Ukuran file paling kecil, kualitas diturunkan",
    quality: 0.4,
  },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/png", label: "PNG", ext: "png" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function savingsPercent(original: number, result: number): number {
  if (original === 0) return 0;
  return Math.max(0, Math.round(((original - result) / original) * 100));
}

async function compressImage(
  file: File,
  quality: number,
  format: OutputFormat
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
      // Untuk PNG kita tetap render dengan white bg agar transparan tidak rusak
      if (format === "image/png") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const q = format === "image/png" ? undefined : quality;
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Gagal mengompres gambar"));
          resolve(blob);
        },
        format,
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

export default function CompressImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<ImageResult[]>([]);

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

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResults([]);
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setErrorMessage(null);
    setProgressText("");
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsCompressing(true);
    setErrorMessage(null);
    setResults([]);

    const selectedLevel =
      COMPRESSION_LEVELS.find((l) => l.id === level) || COMPRESSION_LEVELS[1];
    const fmt = FORMAT_OPTIONS.find((f) => f.value === outputFormat)!;
    const newResults: ImageResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`Mengompres ${i + 1} dari ${files.length}: ${file.name}`);
        const blob = await compressImage(
          file,
          selectedLevel.quality,
          outputFormat
        );
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const filename = `${baseName}_compressed.${fmt.ext}`;
        const previewUrl = URL.createObjectURL(blob);
        newResults.push({
          originalFile: file,
          originalSize: file.size,
          resultBlob: blob,
          resultSize: blob.size,
          previewUrl,
          filename,
        });
      }
      setResults(newResults);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal mengompres gambar: ${msg}`);
    } finally {
      setIsCompressing(false);
      setProgressText("");
    }
  };

  const handleDownloadSingle = (result: ImageResult) => {
    saveAs(result.resultBlob, result.filename);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.filename, r.resultBlob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "compressed_images.zip");
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalResult = results.reduce((s, r) => s + r.resultSize, 0);
  const totalSavings = savingsPercent(totalOriginal, totalResult);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <ImageDown className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Kompres Gambar
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Kecilkan ukuran file gambar JPEG, PNG, dan WebP secara instan di
          browser tanpa upload ke server.
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
          {/* Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    {results.length} gambar berhasil dikompres!
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    <span>{formatBytes(totalOriginal)}</span>
                    <span>→</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(totalResult)}
                    </span>
                    {totalSavings > 0 && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Hemat {totalSavings}%
                      </span>
                    )}
                  </div>
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
                  Kompres File Lain
                </button>
              </div>
            </div>
          </div>

          {/* Individual results */}
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
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatBytes(r.resultSize)}
                    </span>
                    {savingsPercent(r.originalSize, r.resultSize) > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        (-{savingsPercent(r.originalSize, r.resultSize)}%)
                      </span>
                    )}
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

      {/* Upload Zone */}
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
              <ImageDown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {isDragActive
                ? "Lepaskan gambar di sini"
                : "Tarik & Lepas Gambar ke Sini"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
              atau klik untuk memilih — support JPEG, PNG, WebP (bisa banyak file)
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
              >
                <ImageDown className="w-4 h-4" />
                Pilih Gambar
              </button>
            </div>
          </div>

          {/* File list preview */}
          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* File list */}
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <ImageDown className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-sm text-gray-900 dark:text-white truncate"
                          title={file.name}
                        >
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
                      disabled={isCompressing}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-5">
                {/* Compression level */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Tingkat Kompresi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COMPRESSION_LEVELS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLevel(opt.id)}
                        disabled={isCompressing}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          level === opt.id
                            ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500"
                            : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          {opt.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output format */}
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
                        disabled={isCompressing}
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
                      PNG adalah format lossless, pengurangan ukuran lebih terbatas dibanding JPEG/WebP.
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Proses dijalankan langsung di perangkat Anda tanpa upload file.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isCompressing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleCompress}
                    disabled={isCompressing || files.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{progressText || "Mengompres..."}</span>
                      </>
                    ) : (
                      <>
                        <ImageDown className="w-4 h-4" />
                        <span>
                          Kompres {files.length > 1 ? `${files.length} Gambar` : "Gambar"}
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
