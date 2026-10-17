"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { ArrowDownToLine, Check, Copy, FileText, ImageIcon, Loader2, PackageOpen, ScanText, Square, Trash2, TriangleAlert } from "lucide-react";
import { OCR_LANGS, createOcrWorker, recognizePage, type OcrLang } from "@/lib/ocr";
import { formatBytes } from "@/lib/image";
import { saveAs } from "@/lib/download";
import { fileKind } from "@/lib/tools";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { yieldToUi } from "@/lib/yieldToUi";
import ContinueMenu from "@/components/ContinueMenu";
import {
  ActionBar,
  Card,
  ErrorBanner,
  FileDropzone,
  SegmentedButtons,
  ToolHeader,
  primaryBtnCls,
  secondaryBtnCls,
} from "@/components/tool-ui";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const PDF_RENDER_SCALE = 2;
const MOBILE_PAGE_WARNING = 20;

interface PageText {
  label: string;
  text: string;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar halaman"))), "image/jpeg", 0.9);
  });
}

function isSmallTouchDevice() {
  return typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
}

export default function OcrPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfPages, setPdfPages] = useState(0);
  const [lang, setLang] = useState<OcrLang>("ind+eng");
  const [makePdf, setMakePdf] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [fraction, setFraction] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageText[] | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState<number | "all" | null>(null);
  const cancelRef = useRef(false);
  const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);

  const addFiles = async (incoming: File[]) => {
    const valid = incoming.filter((f) => fileKind(f) === "pdf" || fileKind(f) === "image");
    if (valid.length === 0) return;
    setPages(null);
    setPdfBlob(null);
    setError(null);
    const hasPdf = valid.some((f) => fileKind(f) === "pdf");
    // One PDF at a time; images can be combined.
    const next = hasPdf ? [valid.find((f) => fileKind(f) === "pdf")!] : [...files.filter((f) => fileKind(f) === "image"), ...valid];
    setFiles(next);
    setPdfPages(0);
    if (hasPdf) {
      try {
        const task = pdfjsLib.getDocument({ data: new Uint8Array(await next[0].arrayBuffer()) });
        const doc = await task.promise;
        setPdfPages(doc.numPages);
        void task.destroy();
      } catch {
        setError("Gagal membaca PDF. File mungkin rusak atau terkunci password.");
        setFiles([]);
      }
    }
  };

  useIncomingFiles("image", addFiles, isWorking);
  useIncomingFiles("pdf", addFiles, isWorking);

  const reset = () => {
    setFiles([]);
    setPdfPages(0);
    setPages(null);
    setPdfBlob(null);
    setError(null);
  };

  const cancel = () => {
    cancelRef.current = true;
    setStatus("Membatalkan...");
    void workerRef.current?.terminate();
  };

  const run = async () => {
    if (files.length === 0) return;
    cancelRef.current = false;
    setIsWorking(true);
    setError(null);
    setFraction(0);
    setPages(null);
    setPdfBlob(null);
    let currentPage = 0;
    let totalPages = 0;
    const texts: PageText[] = [];
    const parts: Uint8Array[] = [];
    try {
      setStatus("Menyiapkan mesin OCR...");
      let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
      const first = files[0];
      if (fileKind(first) === "pdf") {
        pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(await first.arrayBuffer()) }).promise;
        totalPages = pdfDoc.numPages;
      } else {
        totalPages = files.length;
      }

      const worker = await createOcrWorker(lang, (f, st) => {
        setFraction((currentPage + f) / Math.max(totalPages, 1));
        if (st) setStatus("Halaman " + (currentPage + 1) + " dari " + totalPages + ": " + st);
      });
      workerRef.current = worker;

      for (let i = 0; i < totalPages; i++) {
        if (cancelRef.current) break;
        currentPage = i;
        let image: Blob;
        let label: string;
        if (pdfDoc) {
          const page = await pdfDoc.getPage(i + 1);
          const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Gagal menginisialisasi canvas context");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          image = await canvasToJpeg(canvas);
          label = "Halaman " + (i + 1);
        } else {
          image = files[i];
          label = files[i].name;
        }
        const result = await recognizePage(worker, image, makePdf);
        if (cancelRef.current) break;
        texts.push({ label, text: result.text });
        if (result.pdf) parts.push(result.pdf);
        setPages([...texts]);
        setFraction((i + 1) / totalPages);
        await yieldToUi();
      }

      await worker.terminate().catch(() => {});
      workerRef.current = null;
      void pdfDoc?.loadingTask.destroy();

      if (cancelRef.current) {
        setError(texts.length > 0 ? "Dibatalkan. " + texts.length + " halaman yang sudah selesai tetap ditampilkan." : "Proses OCR dibatalkan.");
        setPdfBlob(null);
        return;
      }

      if (makePdf && parts.length > 0) {
        setStatus("Menyusun PDF yang bisa dicari...");
        const merged = await PDFDocument.create();
        for (const part of parts) {
          const src = await PDFDocument.load(part);
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach((p) => merged.addPage(p));
        }
        setPdfBlob(new Blob([(await merged.save()) as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
      }
    } catch (err) {
      console.error(err);
      if (!cancelRef.current) setError("Gagal menjalankan OCR: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setStatus("");
      workerRef.current = null;
    }
  };

  const baseName = files.length > 0 ? files[0].name.replace(/\.[^/.]+$/, "") : "ocr";
  const allText = pages ? pages.map((p) => (pages.length > 1 ? "--- " + p.label + " ---\n" : "") + p.text).join("\n\n") : "";

  const copy = async (text: string, which: number | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Gagal menyalin ke clipboard. Salin manual dari kotak teks.");
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    (pages ?? []).forEach((p, i) => zip.file(baseName + "_" + String(i + 1).padStart(3, "0") + ".txt", p.text));
    saveAs(await zip.generateAsync({ type: "blob" }), baseName + "_ocr.zip");
  };

  const showMobileWarning = pdfPages > MOBILE_PAGE_WARNING && isSmallTouchDevice();
  const done = pages !== null && !isWorking;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<ScanText className="w-6 h-6" />}
        title="OCR: Gambar & PDF Scan ke Teks"
        description="Kenali teks dari foto atau PDF hasil scan, lalu salin, unduh .txt, atau buat PDF yang bisa dicari. Mesin OCR berjalan di browser Anda."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {files.length === 0 && (
        <FileDropzone
          kind="image"
          accept={ACCEPT}
          multiple
          icon={<ScanText className="w-7 h-7" />}
          onFiles={addFiles}
          onReject={setError}
          title="Tarik & Lepas Gambar atau PDF Scan ke Sini"
          hint="JPG, PNG, WebP, atau satu PDF — bisa juga tempel dengan Ctrl+V"
        />
      )}

      {files.length > 0 && (
        <div className="space-y-6">
          <Card className="space-y-2">
            {files.map((f, i) => (
              <div key={f.name + i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
                  {fileKind(f) === "pdf" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatBytes(f.size)}
                    {fileKind(f) === "pdf" && pdfPages > 0 ? " · " + pdfPages + " halaman" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={() => (files.length === 1 ? reset() : setFiles((prev) => prev.filter((_, idx) => idx !== i)))}
                  title="Hapus"
                  className="p-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </Card>

          {showMobileWarning && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-3 text-amber-200 text-sm">
              <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                PDF ini {pdfPages} halaman. OCR di HP bisa lambat dan memakan banyak memori; pertimbangkan memprosesnya di komputer atau
                memotong PDF-nya dulu.
              </div>
            </div>
          )}

          {!done && !isWorking && (
            <Card className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Bahasa teks</h3>
                <SegmentedButtons
                  value={lang}
                  onChange={setLang}
                  options={OCR_LANGS.map((l) => ({ id: l.id, label: l.label }))}
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={makePdf} onChange={(e) => setMakePdf(e.target.checked)} className="accent-sky-600 mt-1" />
                <span>
                  Buat juga PDF yang bisa dicari
                  <span className="block text-xs text-zinc-400">Gambar asli tetap terlihat, dengan lapisan teks tak terlihat di atasnya.</span>
                </span>
              </label>
              <p className="text-xs text-zinc-400">
                Pertama kali dipakai, data bahasa (sekitar 1–5 MB) dimuat dari situs ini. Semakin banyak halaman, semakin lama prosesnya.
              </p>
            </Card>
          )}

          {isWorking && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-zinc-200">
                <span className="flex items-center gap-2 min-w-0">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">{status || "Memproses..."}</span>
                </span>
                <span className="text-zinc-400 shrink-0">{Math.round(fraction * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: Math.round(fraction * 100) + "%" }} />
              </div>
              <button type="button" onClick={cancel} className={secondaryBtnCls + " !py-2"}>
                <Square className="w-4 h-4" />
                Batalkan
              </button>
            </Card>
          )}

          {pages && pages.length > 0 && (
            <>
              <Card className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveAs(new Blob([allText], { type: "text/plain;charset=utf-8" }), baseName + ".txt")}
                  className={primaryBtnCls}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Unduh .txt
                </button>
                {pdfBlob && (
                  <>
                    <button type="button" onClick={() => saveAs(pdfBlob, baseName + "_ocr.pdf")} className={secondaryBtnCls + " !py-2.5"}>
                      <ArrowDownToLine className="w-4 h-4" />
                      PDF yang bisa dicari
                    </button>
                    <ContinueMenu kind="pdf" files={[{ blob: pdfBlob, name: baseName + "_ocr.pdf" }]} />
                  </>
                )}
                {pages.length > 1 && (
                  <button type="button" onClick={downloadZip} className={secondaryBtnCls + " !py-2.5"}>
                    <PackageOpen className="w-4 h-4" />
                    ZIP per halaman
                  </button>
                )}
                <button type="button" onClick={() => copy(allText, "all")} className={secondaryBtnCls + " !py-2.5"}>
                  {copied === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Salin semua
                </button>
              </Card>

              {pages.map((p, i) => (
                <Card key={i} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="label-mono text-zinc-300 truncate">{p.label}</h3>
                    <button
                      type="button"
                      onClick={() => copy(p.text, i)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors shrink-0"
                    >
                      {copied === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Salin
                    </button>
                  </div>
                  <textarea
                    value={p.text}
                    onChange={(e) => setPages((prev) => prev && prev.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))}
                    placeholder="(tidak ada teks yang dikenali)"
                    rows={Math.min(Math.max(p.text.split("\n").length, 3), 14)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </Card>
              ))}
            </>
          )}

          <ActionBar note="Teks hasil OCR bisa dikoreksi langsung di kotak teks sebelum disalin atau diunduh.">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {done || (pages && pages.length > 0 && !isWorking) ? (
                <button type="button" onClick={reset} className={primaryBtnCls}>
                  <ScanText className="w-4 h-4" />
                  <span>OCR File Lain</span>
                </button>
              ) : (
                <button type="button" onClick={run} disabled={isWorking} className={primaryBtnCls}>
                  {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                  <span>{isWorking ? "Memproses..." : "Mulai OCR"}</span>
                </button>
              )}
            </div>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
