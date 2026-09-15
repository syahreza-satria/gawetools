"use client";

import { useState, useCallback, useRef } from "react";
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
  Sparkles,
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
        // Mode 1: Split every single page into an individual PDF
        if (totalPages === 1) {
          // Only 1 page anyway, direct PDF
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
        // Mode 2: Split by range
        const parsed = parseRangeInput(rangeInput, totalPages);
        if (parsed.error || !parsed.ranges || parsed.ranges.length === 0) {
          setErrorMessage(parsed.error || "Range tidak valid.");
          return;
        }

        const ranges: PageRangeGroup[] = parsed.ranges;

        if (ranges.length === 1) {
          // If only 1 range group, deliver as a single PDF directly
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
          // Multiple ranges: deliver as ZIP containing each range as a PDF
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
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mb-3 shadow-xs">
          <Scissors className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Pisah PDF (Split)</h1>
        <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
          Ekstrak tiap halaman menjadi dokumen mandiri (ZIP) atau pisahkan berdasarkan rentang halaman yang Anda inginkan.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm animate-in fade-in">
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

      {/* Success Download Card */}
      {downloadResult && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-950">PDF Berhasil Dipisahkan!</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Hasil ekstraksi: <span className="font-semibold">{downloadResult.totalFiles} berkas</span> siap diunduh
              {downloadResult.isZip ? " sebagai arsip ZIP." : " langsung sebagai PDF."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 active:scale-98 transition-all"
            >
              {downloadResult.isZip ? <FileArchive className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
              Download {downloadResult.isZip ? "ZIP" : "PDF"} ({downloadResult.filename})
            </button>
            <button
              onClick={() => setDownloadResult(null)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-medium text-sm hover:bg-emerald-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Pisah dengan Pengaturan Lain
            </button>
          </div>
        </div>
      )}

      {/* Loading state for initial document render */}
      {isLoadingPdf && (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-700">Membaca dan membuat thumbnail halaman PDF...</p>
        </div>
      )}

      {/* Upload Zone when no file */}
      {!file && !isLoadingPdf && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 bg-white ${
            isDragActive
              ? "border-rose-500 bg-rose-50/50 scale-[0.99] shadow-inner"
              : "border-gray-300 hover:border-rose-400 hover:bg-rose-50/20 shadow-xs"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Scissors className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas 1 File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            atau klik tombol di bawah untuk memilih dokumen dari perangkat Anda
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm shadow-md shadow-rose-500/20 hover:bg-rose-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Pilih File PDF
            </button>
          </div>
        </div>
      )}

      {/* File Loaded State */}
      {file && pdfDocProxy && !isLoadingPdf && (
        <div className="space-y-8">
          {/* File summary top card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate max-w-md sm:max-w-lg" title={file.name}>
                  {file.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              Ganti File
            </button>
          </div>

          {/* Mode Selection and Settings Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-600" />
              Pilih Mode Pemisahan
            </h3>

            {/* Split Mode Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSplitMode("all")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  splitMode === "all"
                    ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-400/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-gray-900">Ekstrak Semua Halaman</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        splitMode === "all" ? "border-rose-600 bg-rose-600" : "border-gray-300"
                      }`}
                    >
                      {splitMode === "all" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Setiap halaman akan dipotong menjadi file PDF terpisah satu per satu dan diunduh dalam arsip ZIP.
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-rose-700 bg-rose-100/70 inline-block px-2 py-0.5 rounded-md self-start">
                  Akan menghasilkan {totalPages} file PDF
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode("range")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  splitMode === "range"
                    ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-400/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-gray-900">Pisahkan Berdasarkan Range</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        splitMode === "range" ? "border-rose-600 bg-rose-600" : "border-gray-300"
                      }`}
                    >
                      {splitMode === "range" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tentukan rentang halaman yang ingin Anda ambil. Pisahkan dengan koma untuk beberapa segmen.
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-rose-700 bg-rose-100/70 inline-block px-2 py-0.5 rounded-md self-start">
                  Custom pages (contoh: 1-3, 5)
                </div>
              </button>
            </div>

            {/* Range Input Field when Range mode active */}
            {splitMode === "range" && (
              <div className="pt-2 border-t border-gray-100 space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Ketik Rentang Halaman:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="misal: 1-3, 5, 7-9"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono"
                  />
                </div>
                <div className="flex items-start gap-1.5 text-xs text-gray-500 pt-1">
                  <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>
                    Tips: Masukkan halaman dari <strong>1</strong> sampai <strong>{totalPages}</strong>.
                    Jika Anda hanya memasukkan 1 rentang (misal <code>1-3</code>), file akan langsung didownload sebagai PDF tunggal.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Page Thumbnails Preview Gallery */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Preview Halaman PDF</h3>
                <p className="text-xs text-gray-500">Pratinjau visual seluruh {totalPages} halaman dokumen</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[460px] overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-gray-200/70">
              {Array.from({ length: totalPages }, (_, idx) => (
                <PageThumbnail key={idx + 1} pdfDoc={pdfDocProxy} pageNumber={idx + 1} />
              ))}
            </div>
          </div>

          {/* Action Split Button */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              {splitMode === "all" ? (
                <span>
                  Akan mengekstrak <strong>{totalPages} file PDF</strong> ke dalam 1 berkas ZIP.
                </span>
              ) : (
                <span>
                  Akan memproses rentang: <strong className="font-mono">{rangeInput || "-"}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSplit}
              disabled={isSplitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/25 hover:bg-rose-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{progressText || "Memproses..."}</span>
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  <span>Pisahkan PDF Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
