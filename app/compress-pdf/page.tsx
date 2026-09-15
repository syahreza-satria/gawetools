"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import {
  Minimize2,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

type CompressionLevel = "low" | "medium" | "high";

interface LevelOption {
  id: CompressionLevel;
  title: string;
  desc: string;
  scale: number;
  quality: number;
}

const COMPRESSION_LEVELS: LevelOption[] = [
  {
    id: "low",
    title: "Kompresi Ringan",
    desc: "Kualitas tertinggi, ukuran berkurang sedikit",
    scale: 1.5,
    quality: 0.85,
  },
  {
    id: "medium",
    title: "Kompresi Sedang (Rekomendasi)",
    desc: "Keseimbangan terbaik antara kualitas & ukuran",
    scale: 1.2,
    quality: 0.65,
  },
  {
    id: "high",
    title: "Kompresi Kuat",
    desc: "Ukuran file paling kecil, kualitas gambar diturunkan",
    scale: 0.9,
    quality: 0.45,
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
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
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText("");
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage(null);
    setProgressText("Membaca dokumen PDF...");

    try {
      const selectedLevel = COMPRESSION_LEVELS.find((l) => l.id === level) || COMPRESSION_LEVELS[1];
      const arrayBuffer = await file.arrayBuffer();

      // Load with pdfjs to render each page as compressed image canvas
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      // Create new output PDF via pdf-lib
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Mengompres halaman ${i} dari ${numPages}...`);
        const page = await pdf.getPage(i);
        const originalViewport = page.getViewport({ scale: 1.0 });

        // Apply scale factor for compression
        const renderViewport = page.getViewport({ scale: selectedLevel.scale });

        const canvas = document.createElement("canvas");
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Gagal menginisialisasi canvas context");

        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          canvas: canvas,
        }).promise;

        // Export as JPEG image with quality setting
        const jpegDataUrl = canvas.toDataURL("image/jpeg", selectedLevel.quality);
        const base64Data = jpegDataUrl.split(",")[1];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const embeddedImage = await newPdfDoc.embedJpg(imageBytes);

        // Add page matching original dimensions
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });
      }

      setProgressText("Menyimpan dokumen PDF hasil kompresi...");
      const compressedBytes = await newPdfDoc.save();
      const outputBlob = new Blob([compressedBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setDownloadFilename(`${baseName}_compressed.pdf`);
      setResultBlob(outputBlob);
      setResultSize(outputBlob.size);
    } catch (err: unknown) {
      console.error("Gagal mengompres PDF:", err);
      const errDetail = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal mengompres PDF: ${errDetail}`);
    } finally {
      setIsCompressing(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    saveAs(resultBlob, downloadFilename);
  };

  const savingsPercent =
    file && resultSize > 0 ? Math.round(((file.size - resultSize) / file.size) * 100) : 0;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-600 mb-3 shadow-xs">
          <Minimize2 className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Kompres PDF</h1>
        <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
          Kecilkan ukuran file PDF Anda secara instan di browser tanpa mengurangi keterbacaan dokumen.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Success State */}
      {resultBlob && file && (
        <div className="mb-8 p-6 rounded-2xl bg-white border border-emerald-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">PDF Berhasil Dikompres!</h3>
            <div className="flex items-center justify-center gap-4 mt-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Ukuran Awal</span>
                <span className="font-semibold text-gray-700">{formatBytes(file.size)}</span>
              </div>
              <div className="text-gray-300">→</div>
              <div>
                <span className="text-xs text-gray-500 block">Ukuran Baru</span>
                <span className="font-bold text-emerald-600">{formatBytes(resultSize)}</span>
              </div>
              {savingsPercent > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  Hemat {savingsPercent}%
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm shadow-xs hover:bg-red-700 active:scale-98 transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download PDF ({formatBytes(resultSize)})
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Kompres File Lain
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-white ${
            isDragActive
              ? "border-red-500 bg-red-50/50"
              : "border-gray-300 hover:border-red-400 hover:bg-red-50/10"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Minimize2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas 1 File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
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

      {/* Settings when file selected */}
      {file && !resultBlob && (
        <div className="space-y-6">
          {/* Selected File Card */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isCompressing}
              title="Ganti File"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Compression Level Options */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Tingkat Kompresi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COMPRESSION_LEVELS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLevel(opt.id)}
                  disabled={isCompressing}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    level === opt.id
                      ? "border-red-500 bg-red-50/40 ring-1 ring-red-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-900 mb-1">{opt.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500">
              Proses dijalankan langsung di perangkat Anda tanpa upload file.
            </span>
            <button
              type="button"
              onClick={handleCompress}
              disabled={isCompressing}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressText || "Mengompres..."}</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Kompres PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
