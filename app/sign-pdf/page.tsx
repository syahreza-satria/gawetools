"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { StandardFonts, degrees, rgb, type PDFImage } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { loadPdf } from "@/lib/loadPdf";
import { describeVisualPage } from "@/lib/pdfVisual";
import { saveAs } from "@/lib/download";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { yieldToUi } from "@/lib/yieldToUi";
import ContinueMenu from "@/components/ContinueMenu";
import PdfPagePreview from "@/components/PdfPagePreview";
import SignatureMaker, { type SignatureAsset } from "@/components/SignatureMaker";
import {
  PenLine,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

interface Placement {
  id: string;
  page: number; // 1-based
  /** Position and width as fractions of the page as displayed. */
  fx: number;
  fy: number;
  fw: number;
  dataUrl: string;
  /** height / width of the signature image */
  aspect: number;
}

type DragMode = "move" | "resize";

const DATE_SIZE_PT = 10;
const MIN_FW = 0.05;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), Math.max(lo, hi));
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function SignPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [signature, setSignature] = useState<SignatureAsset | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addDate, setAddDate] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(360);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    mode: DragMode;
    startX: number;
    startY: number;
    fx: number;
    fy: number;
    fw: number;
    cssW: number;
    cssH: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      void pdfDoc?.loadingTask.destroy();
    };
  }, [pdfDoc]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setPreviewWidth(Math.round(clamp(el.clientWidth, 240, 560)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfDoc]);

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setCurrentPage(1);
    setPlacements([]);
    setSelectedId(null);
    setResultBlob(null);
    setErrorMessage(null);
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
      setCurrentPage(1);
      setPlacements([]);
      setSelectedId(null);
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

  const addPlacement = () => {
    if (!signature) return;
    const onPage = placements.filter((p) => p.page === currentPage).length;
    const fw = 0.3;
    const placement: Placement = {
      id: Math.random().toString(36).slice(2, 10),
      page: currentPage,
      fx: clamp(0.55 - onPage * 0.04, 0, 1 - fw),
      fy: clamp(0.75 - onPage * 0.04, 0, 0.8),
      fw,
      dataUrl: signature.dataUrl,
      aspect: signature.aspect,
    };
    setPlacements((prev) => [...prev, placement]);
    setSelectedId(placement.id);
  };

  const removePlacement = (id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const startDrag = (e: React.PointerEvent, p: Placement, mode: DragMode, cssW: number, cssH: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(p.id);
    dragRef.current = { id: p.id, mode, startX: e.clientX, startY: e.clientY, fx: p.fx, fy: p.fy, fw: p.fw, cssW, cssH };
  };

  const onDragMove = (e: React.PointerEvent, aspect: number) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setPlacements((prev) =>
      prev.map((p) => {
        if (p.id !== d.id) return p;
        if (d.mode === "move") {
          const fh = (d.fw * d.cssW * aspect) / d.cssH;
          return { ...p, fx: clamp(d.fx + dx / d.cssW, 0, 1 - d.fw), fy: clamp(d.fy + dy / d.cssH, 0, 1 - fh) };
        }
        const maxFw = Math.min(1 - d.fx, ((1 - d.fy) * d.cssH) / (d.cssW * aspect));
        return { ...p, fw: clamp(d.fw + dx / d.cssW, MIN_FW, maxFw) };
      })
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleApply = async () => {
    if (!file || placements.length === 0) {
      setErrorMessage("Tempel minimal satu tanda tangan di halaman terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const doc = await loadPdf(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const images = new Map<string, PDFImage>();
      const dateText = todayLabel();

      for (const p of placements) {
        let image = images.get(p.dataUrl);
        if (!image) {
          image = await doc.embedPng(dataUrlToBytes(p.dataUrl));
          images.set(p.dataUrl, image);
        }
        const page = doc.getPage(p.page - 1);
        const visual = describeVisualPage(page);
        const width = p.fw * visual.width;
        const height = width * p.aspect;
        const vx = p.fx * visual.width;
        const vyBottom = visual.height - p.fy * visual.height - height;
        const origin = visual.toPage(vx, vyBottom);
        page.drawImage(image, { x: origin.x, y: origin.y, width, height, rotate: degrees(visual.rotation) });

        if (addDate) {
          const tw = font.widthOfTextAtSize(dateText, DATE_SIZE_PT);
          const dvx = vx + (width - tw) / 2;
          let dvy = vyBottom - DATE_SIZE_PT - 2;
          if (dvy < 2) dvy = Math.min(vyBottom + height + 4, visual.height - DATE_SIZE_PT);
          const at = visual.toPage(dvx, dvy);
          page.drawText(dateText, {
            x: at.x,
            y: at.y,
            size: DATE_SIZE_PT,
            font,
            color: rgb(0.1, 0.1, 0.1),
            rotate: degrees(visual.rotation),
          });
        }
        await yieldToUi();
      }

      const bytes = await doc.save();
      setResultBlob(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error("Gagal menempel tanda tangan:", err);
      const detail = err instanceof Error ? err.message : String(err);
      setErrorMessage("Gagal menempel tanda tangan: " + detail);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputName = file ? file.name.replace(/\.[^/.]+$/, "") + "_signed.pdf" : "signed.pdf";
  const pagePlacements = placements.filter((p) => p.page === currentPage);
  const pagesWithSignature = new Set(placements.map((p) => p.page)).size;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <div className="mb-10 border-b border-zinc-900 pb-8 text-left">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-white mb-5">
          <PenLine className="w-6 h-6" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-medium leading-[1.04] text-white">Tanda Tangan PDF</h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl">
          Gambar, ketik, atau unggah tanda tangan, lalu tempel di halaman mana pun. Tanda tangan tidak disimpan di mana pun.
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
            <h3 className="text-xl font-bold text-white">Tanda Tangan Ditempel!</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {placements.length} tanda tangan di {pagesWithSignature} halaman · {formatBytes(resultBlob.size)}
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
              onClick={() => setResultBlob(null)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm hover:bg-zinc-700 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Ubah Tanda Tangan
            </button>
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
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <PenLine className="w-7 h-7" />}
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

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-700/70 space-y-5">
              <h3 className="text-sm font-semibold text-white">1. Buat tanda tangan</h3>
              <SignatureMaker onUse={setSignature} />

              {signature && (
                <div className="p-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 space-y-3">
                  <div className="rounded-lg p-2 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:12px_12px] bg-[repeating-conic-gradient(#3f3f46_0%_25%,#27272a_0%_50%)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signature.dataUrl} alt="Tanda tangan siap dipakai" className="mx-auto max-h-16 max-w-full" />
                  </div>
                  <button
                    type="button"
                    onClick={addPlacement}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tempel di halaman {currentPage}
                  </button>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={addDate}
                  onChange={(e) => setAddDate(e.target.checked)}
                  className="accent-sky-600"
                />
                Tambahkan tanggal hari ini di bawah tanda tangan ({todayLabel()})
              </label>
            </div>

            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-700/70 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">2. Atur posisi di halaman</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Halaman sebelumnya"
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-zinc-300 min-w-16 text-center">
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage >= pageCount}
                    aria-label="Halaman berikutnya"
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div ref={stageRef} className="flex justify-center">
                <PdfPagePreview pdfDoc={pdfDoc} pageNumber={currentPage} width={previewWidth} className="select-none">
                  {(info) => (
                    <div className="absolute inset-0" onPointerDown={() => setSelectedId(null)}>
                      {pagePlacements.map((p) => {
                        const boxW = p.fw * info.cssWidth;
                        const boxH = boxW * p.aspect;
                        const selected = selectedId === p.id;
                        const f = info.cssWidth / info.ptWidth;
                        return (
                          <div key={p.id}>
                            <div
                              onPointerDown={(e) => startDrag(e, p, "move", info.cssWidth, info.cssHeight)}
                              onPointerMove={(e) => onDragMove(e, p.aspect)}
                              onPointerUp={endDrag}
                              onPointerCancel={endDrag}
                              className={`absolute cursor-move touch-none ${
                                selected ? "outline-2 outline-dashed outline-sky-500" : "hover:outline-1 hover:outline-dashed hover:outline-sky-400"
                              }`}
                              style={{ left: p.fx * info.cssWidth, top: p.fy * info.cssHeight, width: boxW, height: boxH }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.dataUrl} alt="Tanda tangan" draggable={false} className="w-full h-full pointer-events-none" />
                              {selected && (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Hapus tanda tangan"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => removePlacement(p.id)}
                                    className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <span
                                    onPointerDown={(e) => startDrag(e, p, "resize", info.cssWidth, info.cssHeight)}
                                    onPointerMove={(e) => onDragMove(e, p.aspect)}
                                    onPointerUp={endDrag}
                                    onPointerCancel={endDrag}
                                    className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow cursor-nwse-resize touch-none"
                                  />
                                </>
                              )}
                            </div>
                            {addDate && (
                              <span
                                className="absolute whitespace-nowrap text-black leading-none pointer-events-none"
                                style={{
                                  left: p.fx * info.cssWidth + boxW / 2,
                                  top: p.fy * info.cssHeight + boxH + 2,
                                  transform: "translateX(-50%)",
                                  fontSize: DATE_SIZE_PT * f,
                                  fontFamily: "Helvetica, Arial, sans-serif",
                                }}
                              >
                                {todayLabel()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </PdfPagePreview>
              </div>

              <p className="text-xs text-zinc-400 text-center">
                {placements.length === 0
                  ? "Buat tanda tangan, lalu tekan \"Tempel di halaman\". Geser untuk memindahkan, tarik titik biru untuk mengubah ukuran."
                  : placements.length + " tanda tangan di " + pagesWithSignature + " halaman. Pilih satu untuk menggeser, mengubah ukuran, atau menghapusnya."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-700/70">
            <span className="text-xs text-zinc-400">
              Proses dijalankan langsung di perangkat Anda tanpa upload file.
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || placements.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4" />
                  <span>Terapkan Tanda Tangan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
