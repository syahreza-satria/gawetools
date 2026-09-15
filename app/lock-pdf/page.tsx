"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { encryptPDF, AlreadyEncryptedError } from "@pdfsmaller/pdf-encrypt";
import { saveAs } from "file-saver";
import {
  Lock,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function LockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }

    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      setErrorMessage(null);
      setResultBlob(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleReset = () => {
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText("");
  };

  const handleLock = async () => {
    if (!file) return;

    if (!password) {
      setErrorMessage("Silakan masukkan password untuk mengunci PDF.");
      return;
    }

    if (password.length < 3) {
      setErrorMessage("Password minimal terdiri dari 3 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok dengan password yang dimasukkan.");
      return;
    }

    setIsLocking(true);
    setErrorMessage(null);
    setProgressText("Mengenkripsi dan mengunci file PDF...");

    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      const encryptedBytes = await encryptPDF(fileBytes, password, {
        algorithm: "AES-256",
      });

      const outputBlob = new Blob([encryptedBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const baseName = file.name.replace(/\.[^/.]+$/, "");

      setDownloadFilename(`${baseName}_protected.pdf`);
      setResultBlob(outputBlob);
    } catch (err: unknown) {
      console.error("Gagal mengunci PDF:", err);
      if (err instanceof AlreadyEncryptedError) {
        setErrorMessage("File PDF ini sudah terkunci/terenkripsi sebelumnya.");
      } else {
        const detail = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Gagal mengunci file PDF: ${detail}`);
      }
    } finally {
      setIsLocking(false);
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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-3 shadow-xs">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Kunci PDF</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Lindungi dokumen PDF penting Anda dengan enkripsi password (AES-256) langsung di peramban.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 dark:text-red-400 hover:underline font-semibold text-xs ml-2"
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">PDF Berhasil Dikunci!</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Dokumen kini dilindungi enkripsi AES-256. Password diperlukan setiap kali dokumen dibuka.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:scale-98 transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download PDF Terkunci ({downloadFilename})
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Kunci File Lain
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
              ? "border-red-500 bg-red-50/50 dark:bg-red-950/30"
              : "border-gray-300 dark:border-zinc-800 hover:border-red-400 hover:bg-red-50/10 dark:hover:bg-red-950/10"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas 1 File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih dokumen PDF dari komputer Anda
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Pilih File PDF
            </button>
          </div>
        </div>
      )}

      {/* Password Form when File Selected */}
      {file && !resultBlob && (
        <div className="space-y-6">
          {/* File Card */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isLocking}
              title="Ganti File"
              className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Password Inputs Card */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Atur Password PDF</h3>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Ulangi Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-zinc-400 pt-1">
              Catatan: Pastikan Anda mengingat password ini. Berkas tidak dapat dibuka kembali jika password terlupa.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Enkripsi AES-256 langsung diproses di browser Anda.
            </span>
            <button
              type="button"
              onClick={handleLock}
              disabled={isLocking || !password || !confirmPassword}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressText || "Mengunci..."}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Kunci PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
