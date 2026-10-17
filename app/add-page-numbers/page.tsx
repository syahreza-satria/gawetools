"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { loadPdf } from "@/lib/loadPdf";
import { describeVisualPage } from "@/lib/pdfVisual";
import { saveAs } from "@/lib/download";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { yieldToUi } from "@/lib/yieldToUi";
import ContinueMenu from "@/components/ContinueMenu";
import PdfPagePreview from "@/components/PdfPagePreview";
import {
  ListOrdered,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

type VAlign = "top" | "bottom";
type HAlign = "left" | "center" | "right";
type NumberFormat = "plain" | "hal" | "slash" | "full";

const FORMATS: { id: NumberFormat; label: string }[] = [
  { id: "plain", label: "1" },
  { id: "hal", label: "Hal. 1" },
  { id: "slash", label: "1 / 10" },
  { id: "full", label: "Halaman 1 dari 10" },
];

const POSITIONS: { v: VAlign; h: HAlign; label: string }[] = [
  { v: "top", h: "left", label: "Atas kiri" },
  { v: "top", h: "center", label: "Atas tengah" },
  { v: "top", h: "right", label: "Atas kanan" },
  { v: "bottom", h: "left", label: "Bawah kiri" },
  { v: "bottom", h: "center", label: "Bawah tengah" },
  { v: "bottom", h: "right", label: "Bawah kanan" },
];

const MM_TO_PT = 72 / 25.4;
const PREVIEW_WIDTH = 256;

function formatLabel(format: NumberFormat, n: number, total: number): string {
  switch (format) {
    case "hal":
      return "Hal. " + n;
    case "slash":
      return n + " / " + total;
    case "full":
      return "Halaman " + n + " dari " + total;
    default:
      return String(n);
  }
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

/** Draws text at a spot given on the page as displayed (origin bottom-left), also on /Rotate pages. */
function drawOnVisualPage(
  page: PDFPage,
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  v: VAlign,
  h: HAlign,
  marginPt: number
) {
  const visual = describeVisualPage(page);
  const textWidth = font.widthOfTextAtSize(text, size);
  const vx = h === "left" ? marginPt : h === "center" ? (visual.width - textWidth) / 2 : visual.width - marginPt - textWidth;
  const vy = v === "bottom" ? marginPt : visual.height - marginPt - size * 0.75;
  const { x, y } = visual.toPage(vx, vy);

  page.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2), rotate: degrees(visual.rotation) });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const [position, setPosition] = useState(5);
  const [format, setFormat] = useState<NumberFormat>("plain");
  const [startNumber, setStartNumber] = useState(1);
  const [firstPage, setFirstPage] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [marginMm, setMarginMm] = useState(10);

  // Release the pdfjs document when it is replaced or the page unmounts.
  useEffect(() => {
    return () => {
      void pdfDoc?.loadingTask.destroy();
    };
  }, [pdfDoc]);

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText("");
  };

  const onDrop = useCallback(async (accepted: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }
    const picked = accepted[0];
    if (!picked) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResultBlob(null);
    try {
      const data = new Uint8Array(await picked.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      setFile(picked);
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setFirstPage(1);
    } catch (err) {
      console.error(err);
      setErrorMessage("Gagal membaca PDF. File mungkin rusak atau terkunci password.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isLoading || isProcessing,
  });

  useIncomingFiles("pdf", (files) => onDrop(files, []), isLoading || isProcessing);

  const pos = POSITIONS[position];
  const firstIndex = Math.min(Math.max(firstPage, 1), Math.max(pageCount, 1)) - 1;
  const numberedCount = Math.max(pageCount - firstIndex, 0);
  const totalLabel = startNumber + numberedCount - 1;
  const sample = formatLabel(format, startNumber, totalLabel);

  const handleApply = async () => {
    if (!file) return;
    if (!Number.isFinite(startNumber) || startNumber < 0) {
      setErrorMessage("Nomor mulai harus berupa angka 0 atau lebih.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressText("Memberi nomor halaman...");
    try {
      const doc = await loadPdf(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      for (let i = firstIndex; i < pages.length; i++) {
        const n = startNumber + (i - firstIndex);
        drawOnVisualPage(pages[i], formatLabel(format, n, totalLabel), font, fontSize, pos.v, pos.h, marginMm * MM_TO_PT);
        if (i % 25 === 0) await yieldToUi();
      }
      const bytes = await doc.save();
      setResultBlob(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error("Gagal memberi nomor halaman:", err);
      const detail = err instanceof Error ? err.message : String(err);
      setErrorMessage("Gagal memberi nomor halaman: " + detail);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const outputName = file ? file.name.replace(/\.[^/.]+$/, "") + "_bernomor.pdf" : "bernomor.pdf";

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-950/50 text-sky-400 mb-3 shadow-xs">
          <ListOrdered className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Nomor Halaman PDF</h1>
        <p className="mt-2 text-base text-zinc-400 max-w-xl mx-auto">
          Tambahkan nomor halaman ke dokumen PDF: pilih posisi, format, nomor mulai, dan lewati halaman sampul.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-sky-950/40 border border-sky-900/60 flex items-start gap-3 text-sky-200 text-sm">
          <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-sky-400 hover:underline font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {resultBlob && (
        <div className="mb-8 p-6 rounded-2xl bg-zinc-950 border border-emerald-900/50 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Nomor Halaman Ditambahkan!</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {numberedCount} dari {pageCount} halaman diberi nomor · {formatBytes(resultBlob.size)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => saveAs(resultBlob, outputName)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download PDF
            </button>
            <ContinueMenu kind="pdf" files={[{ blob: resultBlob, name: outputName }]} />
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              File Lain
            </button>
          </div>
        </div>
      )}

      {!file && !resultBlob && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-zinc-950 ${
            isDragActive
              ? "border-sky-500 bg-sky-950/30"
              : "border-zinc-800 hover:border-sky-400 hover:bg-sky-950/10"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-xl bg-sky-950/50 text-sky-400 flex items-center justify-center mx-auto mb-4">
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <ListOrdered className="w-7 h-7" />}
          </div>
          <h3 className="text-base font-semibold text-white">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas 1 File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih, bisa juga tempel dengan Ctrl+V
          </p>
        </div>
      )}

      {file && pdfDoc && !resultBlob && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-700/70">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatBytes(file.size)} · {pageCount} halaman
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              title="Ganti File"
              className="p-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6">
            <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-700/70 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Posisi</h3>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((p, i) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setPosition(i)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        position === i
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-sky-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Format</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        format === f.id
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-sky-400"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Nomor mulai</label>
                  <input
                    type="number"
                    min={0}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 0)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Mulai dari halaman
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={firstPage}
                    onChange={(e) => setFirstPage(Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), pageCount))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Ukuran font ({fontSize} pt)
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Margin ({marginMm} mm)
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={40}
                    value={marginMm}
                    onChange={(e) => setMarginMm(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                {firstIndex === 0
                  ? "Semua halaman diberi nomor."
                  : "Halaman 1 sampai " + firstIndex + " dilewati tanpa nomor. Penomoran dimulai dari halaman " + (firstIndex + 1) + "."}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <PdfPagePreview pdfDoc={pdfDoc} pageNumber={firstIndex + 1} width={PREVIEW_WIDTH}>
                {(info) => {
                  const f = info.cssWidth / info.ptWidth;
                  const m = marginMm * MM_TO_PT * f;
                  return (
                    <span
                      className="absolute text-[#333] leading-none whitespace-nowrap pointer-events-none"
                      style={{
                        fontSize: fontSize * f,
                        fontFamily: "Helvetica, Arial, sans-serif",
                        ...(pos.v === "top" ? { top: m } : { bottom: m }),
                        ...(pos.h === "left"
                          ? { left: m }
                          : pos.h === "right"
                            ? { right: m }
                            : { left: "50%", transform: "translateX(-50%)" }),
                      }}
                    >
                      {sample}
                    </span>
                  );
                }}
              </PdfPagePreview>
              <p className="text-xs text-zinc-400">Pratinjau halaman {firstIndex + 1}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-700/70">
            <span className="text-xs text-zinc-400">
              Proses dijalankan langsung di perangkat Anda tanpa upload file.
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressText || "Memproses..."}</span>
                </>
              ) : (
                <>
                  <ListOrdered className="w-4 h-4" />
                  <span>Beri Nomor Halaman</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
