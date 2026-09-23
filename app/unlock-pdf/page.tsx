"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "file-saver";
import {
  LockOpen,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ShieldOff,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [resultSize, setResultSize] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      setOriginalSize(selected.size);
      setErrorMessage(null);
      setResultBlob(null);
      setPassword("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleReset = () => {
    setFile(null);
    setPassword("");
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText("");
    setOriginalSize(0);
    setResultSize(0);
  };

  const handleUnlock = async () => {
    if (!file) return;
    if (!password) {
      setErrorMessage("Silakan masukkan password PDF yang ingin dihapus proteksinya.");
      return;
    }

    setIsUnlocking(true);
    setErrorMessage(null);
    setProgressText("Memverifikasi password dan mendekripsi PDF...");

    try {
      // Dynamically import to avoid SSR issues
      const { decryptPDF, isEncrypted } = await import("@pdfsmaller/pdf-decrypt");

      const fileBytes = new Uint8Array(await file.arrayBuffer());

      // Check if actually encrypted first
      if (!isEncrypted(fileBytes)) {
        setErrorMessage("File PDF ini tidak memiliki proteksi password. Tidak perlu di-unlock.");
        return;
      }

      setProgressText("Mendekripsi file PDF...");
      const decryptedBytes = await decryptPDF(fileBytes, password);

      const outputBlob = new Blob([decryptedBytes as Uint8Array<ArrayBuffer>], {
        type: "application/pdf",
      });
      const baseName = file.name.replace(/\.pdf$/i, "");

      setResultSize(outputBlob.size);
      setDownloadFilename(`${baseName}_unlocked.pdf`);
      setResultBlob(outputBlob);
    } catch (err: unknown) {
      console.error("Gagal unlock PDF:", err);
      const detail = err instanceof Error ? err.message : String(err);

      // Provide user-friendly error messages
      if (
        detail.toLowerCase().includes("password") ||
        detail.toLowerCase().includes("incorrect") ||
        detail.toLowerCase().includes("wrong") ||
        detail.toLowerCase().includes("invalid")
      ) {
        setErrorMessage("Password salah. Pastikan password yang dimasukkan benar.");
      } else {
        setErrorMessage(`Gagal membuka proteksi PDF: ${detail}`);
      }
    } finally {
      setIsUnlocking(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    saveAs(resultBlob, downloadFilename);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <LockOpen className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Buka Kunci PDF
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Hapus proteksi password dari file PDF Anda secara instan langsung di browser — tanpa upload ke server.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:underline font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Success State */}
      {resultBlob && file && (
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              PDF Berhasil Dibuka Kuncinya!
            </h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Proteksi password telah dihapus. File siap digunakan tanpa password.
            </p>
            {/* Size info */}
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-3 py-1.5 rounded-full">
              <span>{formatBytes(originalSize)}</span>
              <span>→</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatBytes(resultSize)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download PDF ({downloadFilename})
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Buka File Lain
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
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
            <LockOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas File PDF Terproteksi"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih dokumen PDF yang memiliki password
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Pilih File PDF
            </button>
          </div>
        </div>
      )}

      {/* Form when file is selected but not yet unlocked */}
      {file && !resultBlob && (
        <div className="space-y-6">
          {/* File info card */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
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
              onClick={handleReset}
              disabled={isUnlocking}
              title="Ganti File"
              className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Password input card */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldOff className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Masukkan Password PDF
              </h3>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="unlock-pdf-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password && !isUnlocking) handleUnlock();
                  }}
                  placeholder="Masukkan password PDF"
                  disabled={isUnlocking}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm disabled:opacity-60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Password hanya digunakan secara lokal di browser Anda dan tidak dikirim ke server mana pun.
            </p>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Dekripsi dijalankan langsung di perangkat Anda.
            </span>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isUnlocking || !password}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressText || "Membuka Kunci..."}</span>
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" />
                  <span>Buka Kunci PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
