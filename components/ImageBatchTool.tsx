"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "@/lib/download";
import JSZip from "jszip";
import {
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
  Play,
  UploadCloud,
} from "lucide-react";
import { formatBytes } from "@/lib/image";

interface BatchResult {
  originalSize: number;
  blob: Blob;
  filename: string;
  previewUrl: string;
}

interface ImageBatchToolProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  doneLabel: string;
  zipName: string;
  /** Option controls rendered between the file list and the action button. */
  options: ReactNode;
  /** Return an error message to block processing, or null when options are valid. */
  validate?: () => string | null;
  process: (file: File) => Promise<{ blob: Blob; filename: string }>;
}

/** Shared shell for batch image tools: dropzone → file list → options → results (+ZIP). */
export default function ImageBatchTool({
  icon,
  title,
  description,
  actionLabel,
  doneLabel,
  zipName,
  options,
  validate,
  process,
}: ImageBatchToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  const revokeUrls = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  }, []);

  const clearResults = useCallback(() => {
    revokeUrls();
    setResults([]);
  }, [revokeUrls]);

  useEffect(() => revokeUrls, [revokeUrls]);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        setErrorMessage("Hanya file JPG, PNG, dan WebP yang diperbolehkan.");
        return;
      }
      if (accepted.length === 0) return;
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => f.name + f.size));
        return [...prev, ...accepted.filter((f) => !seen.has(f.name + f.size))];
      });
      setErrorMessage(null);
      clearResults();
    },
    [clearResults]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: true,
    disabled: isProcessing,
  });

  const handleReset = () => {
    setFiles([]);
    clearResults();
    setErrorMessage(null);
    setProgressText("");
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    const invalid = validate?.() ?? null;
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    clearResults();

    const out: BatchResult[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgressText(`Memproses ${i + 1} dari ${files.length}: ${files[i].name}`);
        const { blob, filename } = await process(files[i]);
        const previewUrl = URL.createObjectURL(blob);
        urlsRef.current.push(previewUrl);
        out.push({ originalSize: files[i].size, blob, filename, previewUrl });
      }
      setResults(out);
    } catch (err: unknown) {
      revokeUrls();
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const used = new Set<string>();
    results.forEach((r) => {
      let name = r.filename;
      let n = 1;
      while (used.has(name)) name = r.filename.replace(/(\.[^.]+)$/, `_${n++}$1`);
      used.add(name);
      zip.file(name, r.blob);
    });
    saveAs(await zip.generateAsync({ type: "blob" }), zipName);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">{description}</p>
      </div>

      <AnimatePresence>{errorMessage && (
        <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-start gap-3 text-sky-800 dark:text-sky-200 text-sm">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </motion.div>
      )}</AnimatePresence>

      {results.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                {results.length} gambar {doneLabel}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {results.length > 1 && (
                <button
                  onClick={handleDownloadZip}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
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
                Mulai Lagi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-700/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.previewUrl}
                  alt={r.filename}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={r.filename}>
                    {r.filename}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    {formatBytes(r.originalSize)} → {formatBytes(r.blob.size)}
                  </p>
                </div>
                <button
                  onClick={() => saveAs(r.blob, r.filename)}
                  title="Download"
                  className="p-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
<div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-2 p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-sky-400"
            }`}
          >
            <input {...getInputProps()} />
            <motion.div animate={{ y: isDragActive ? -8 : [0, -4, 0], scale: isDragActive ? 1.2 : 1 }} transition={isDragActive ? { type: "spring", stiffness: 300 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}><UploadCloud className="w-9 h-9 text-sky-500" /></motion.div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {isDragActive ? "Lepaskan gambar di sini" : "Tarik & lepas gambar, atau klik untuk memilih"}
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">JPG, PNG, WebP — bisa banyak file sekaligus</p>
          </div>
</motion.div>

          {files.length > 0 && (
            <>
              <ul className="space-y-2">
<AnimatePresence initial={false}>
                {files.map((f, i) => (
                  <motion.li layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    key={f.name + f.size}
                    className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-700/70"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{formatBytes(f.size)}</p>
                    </div>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={isProcessing}
                      title="Hapus"
                      className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
</ul>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700/70 space-y-4">
                {options}
              </div>

              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {progressText || "Memproses..."}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {actionLabel} ({files.length} gambar)
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
