"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import PageThumbnail from "@/components/PageThumbnail";
import { parseRangeInput, PageRangeGroup } from "@/lib/parseRanges";
import {
  Scissors,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileArchive,
  Layers,
  HelpCircle,
} from "lucide-react";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

type SplitMode = "all" | "range";

interface DownloadResult {
  blob: Blob;
  filename: string;
  isZip: boolean;
  totalFiles: number;
}

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const [splitMode, setSplitMode] = useState<SplitMode>("all");
  const [rangeInput, setRangeInput] = useState<string>("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);

  const cleanCurrentFile = useCallback(() => {
    setPdfDocProxy(null);
    setFile(null);
    setTotalPages(0);
    setDownloadResult(null);
    setErrorMessage(null);
    setRangeInput("");
  }, []);

  const loadPdfDocument = useCallback(async (selectedFile: File) => {
    setIsLoadingPdf(true);
    setErrorMessage(null);
    setDownloadResult(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      });

      const proxy = await loadingTask.promise;
      setPdfDocProxy(proxy);
      setTotalPages(proxy.numPages);
      setFile(selectedFile);

      // Default range placeholder or suggestion
      if (proxy.numPages > 1) {
        setRangeInput(`1-${Math.min(proxy.numPages, 2)}`);
      } else {
        setRangeInput("1");
      }
    } catch (err: unknown) {
      console.error("Gagal membaca PDF:", err);
      const errDetail = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal membuka file PDF: ${errDetail}`);
      setFile(null);
    } finally {
      setIsLoadingPdf(false);
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
        return;
      }

      if (acceptedFiles.length > 0) {
        loadPdfDocument(acceptedFiles[0]);
      }
    },
    [loadPdfDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleSplit = async () => {
    if (!file || totalPages === 0) return;

    setIsSplitting(true);
    setErrorMessage(null);
    setProgressText("Membaca dokumen PDF...");

    try {
      const fileBytes = await file.arrayBuffer();
      const originalPdfDoc = await PDFDocument.load(fileBytes);
      const baseFilename = file.name.replace(/\.[^/.]+$/, "");

      if (splitMode === "all") {
        if (totalPages === 1) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(originalPdfDoc, [0]);
          singleDoc.addPage(copiedPage);
          const pdfBytes = await singleDoc.save();
          const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });

          setDownloadResult({
            blob,
            filename: `${baseFilename}_page_1.pdf`,
            isZip: false,
            totalFiles: 1,
          });
          return;
        }

        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          setProgressText(`Mengekstrak halaman ${i + 1} dari ${totalPages}...`);
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(originalPdfDoc, [i]);
          singleDoc.addPage(copiedPage);

          const pdfBytes = await singleDoc.save();
          zip.file(`${baseFilename}_page_${i + 1}.pdf`, pdfBytes);
        }

        setProgressText("Membuat file ZIP hasil split...");
        const zipBlob = await zip.generateAsync({ type: "blob" });

        setDownloadResult({
          blob: zipBlob,
          filename: `${baseFilename}_split_pages.zip`,
          isZip: true,
          totalFiles: totalPages,
        });
      } else {
        const parsed = parseRangeInput(rangeInput, totalPages);
        if (parsed.error || !parsed.ranges || parsed.ranges.length === 0) {
          setErrorMessage(parsed.error || "Range tidak valid.");
          return;
        }

        const ranges: PageRangeGroup[] = parsed.ranges;

        if (ranges.length === 1) {
          const group = ranges[0];
          setProgressText(`Mengekstrak range ${group.label}...`);

          const targetDoc = await PDFDocument.create();
          const zeroBasedIndices = group.pages.map((p) => p - 1);
          const copiedPages = await targetDoc.copyPages(originalPdfDoc, zeroBasedIndices);
          copiedPages.forEach((p) => targetDoc.addPage(p));

          const pdfBytes = await targetDoc.save();
          const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });

          setDownloadResult({
            blob,
            filename: `${baseFilename}_range_${group.label}.pdf`,
            isZip: false,
            totalFiles: 1,
          });
        } else {
          const zip = new JSZip();

          for (let i = 0; i < ranges.length; i++) {
            const group = ranges[i];
            setProgressText(`Mengekstrak range ${group.label} (${i + 1}/${ranges.length})...`);

            const targetDoc = await PDFDocument.create();
            const zeroBasedIndices = group.pages.map((p) => p - 1);
            const copiedPages = await targetDoc.copyPages(originalPdfDoc, zeroBasedIndices);
            copiedPages.forEach((p) => targetDoc.addPage(p));

            const pdfBytes = await targetDoc.save();
            zip.file(`${baseFilename}_range_${group.label}.pdf`, pdfBytes);
          }

          setProgressText("Mengompresi file ke dalam ZIP...");
          const zipBlob = await zip.generateAsync({ type: "blob" });

          setDownloadResult({
            blob: zipBlob,
            filename: `${baseFilename}_ranges.zip`,
            isZip: true,
            totalFiles: ranges.length,
          });
        }
      }
    } catch (err: unknown) {
      console.error("Gagal memisahkan PDF:", err);
      const errDetail = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal memisahkan PDF: ${errDetail}`);
    } finally {
      setIsSplitting(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (!downloadResult) return;
    saveAs(downloadResult.blob, downloadResult.filename);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <Scissors className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Pisah PDF (Split)</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Ekstrak tiap halaman menjadi dokumen mandiri (ZIP) atau pisahkan berdasarkan rentang halaman yang Anda inginkan.
        </p>
      </div>

      {/* Error Message */}
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

      {/* Success Download Card */}
      {downloadResult && (
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">PDF Berhasil Dipisahkan!</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Hasil ekstraksi: <span className="font-semibold text-gray-900 dark:text-white">{downloadResult.totalFiles} berkas</span> siap diunduh
              {downloadResult.isZip ? " sebagai arsip ZIP." : " langsung sebagai PDF."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
            >
              {downloadResult.isZip ? <FileArchive className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
              Download {downloadResult.isZip ? "ZIP" : "PDF"} ({downloadResult.filename})
            </button>
            <button
              onClick={() => setDownloadResult(null)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Pisah File Lain
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoadingPdf && (
        <div className="p-12 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Membaca dokumen PDF...</p>
        </div>
      )}

      {/* Upload Zone */}
      {!file && !isLoadingPdf && (
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
            <Scissors className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas 1 File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih dokumen dari komputer Anda
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

      {/* File Loaded State */}
      {file && pdfDocProxy && !isLoadingPdf && (
        <div className="space-y-6">
          {/* File summary top card */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  <span className="font-medium text-sky-600 dark:text-sky-400">
                    {totalPages} Halaman
                  </span>
                  <span>•</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={cleanCurrentFile}
              disabled={isSplitting}
              title="Ganti File"
              className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selection Card */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pilih Mode Pemisahan</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSplitMode("all")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  splitMode === "all"
                    ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-red-500"
                    : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Ekstrak Semua Halaman</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      splitMode === "all" ? "border-sky-600 bg-sky-600" : "border-gray-300 dark:border-zinc-700"
                    }`}
                  >
                    {splitMode === "all" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Setiap halaman jadi file PDF terpisah, dikemas dalam format ZIP.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode("range")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  splitMode === "range"
                    ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-red-500"
                    : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Pisahkan Berdasarkan Range</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      splitMode === "range" ? "border-sky-600 bg-sky-600" : "border-gray-300 dark:border-zinc-700"
                    }`}
                  >
                    {splitMode === "range" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Tentukan rentang halaman khusus (contoh: 1-3, 5, 7-9).
                </p>
              </button>
            </div>

            {/* Range Input Field */}
            {splitMode === "range" && (
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Ketik Rentang Halaman:
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="misal: 1-3, 5, 7-9"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-sky-500 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Masukkan nomor halaman dari 1 sampai {totalPages}.
                </p>
              </div>
            )}
          </div>

          {/* Page Thumbnails Preview Gallery */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Preview Halaman ({totalPages})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto p-2 bg-slate-50 dark:bg-zinc-950/50 rounded-xl border border-gray-100 dark:border-zinc-800">
              {Array.from({ length: totalPages }, (_, idx) => (
                <PageThumbnail key={idx + 1} pdfDoc={pdfDocProxy} pageNumber={idx + 1} />
              ))}
            </div>
          </div>

          {/* Action Split Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {splitMode === "all"
                ? `Akan menghasilkan ${totalPages} file PDF dalam ZIP.`
                : `Range: ${rangeInput || "-"}`}
            </span>

            <button
              type="button"
              onClick={handleSplit}
              disabled={isSplitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressText || "Memproses..."}</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Pisahkan PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
