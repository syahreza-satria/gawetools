"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ChevronLeft, ChevronRight, EyeOff, Loader2, TriangleAlert, X } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
import { loadPdf } from "@/lib/loadPdf";
import { formatBytes } from "@/lib/image";
import { yieldToUi } from "@/lib/yieldToUi";
import PdfPagePreview from "@/components/PdfPagePreview";
import { ActionBar, Card, ErrorBanner, FileCard, FileDropzone, ResultCard, ToolHeader, primaryBtnCls } from "@/components/tool-ui";

interface Box {
  id: string;
  page: number; // 1-based
  x: number; // fractions of the displayed page
  y: number;
  w: number;
  h: number;
}

const RENDER_SCALE = 2.5; // >= 2 so flattened pages stay sharp
const JPEG_QUALITY = 0.92;
const MIN_BOX = 0.01;

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar halaman"))), "image/jpeg", JPEG_QUALITY);
  });
}

export default function RedactPdfPage() {
  const source = usePdfSource();
  const { file, pdfDoc, pageCount, error, setError } = source;
  const [page, setPage] = useState(1);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draft, setDraft] = useState<Omit<Box, "id" | "page"> | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const drawRef = useRef<{ x0: number; y0: number; left: number; top: number; w: number; h: number } | null>(null);

  const reset = () => {
    source.reset();
    setBoxes([]);
    setDraft(null);
    setPage(1);
    setResult(null);
  };

  const handleFiles = async (files: File[]) => {
    setBoxes([]);
    setPage(1);
    await source.load(files);
  };

  const fractionPoint = (e: React.PointerEvent) => {
    const d = drawRef.current!;
    return {
      x: Math.min(Math.max((e.clientX - d.left) / d.w, 0), 1),
      y: Math.min(Math.max((e.clientY - d.top) / d.h, 0), 1),
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawRef.current = { x0: 0, y0: 0, left: rect.left, top: rect.top, w: rect.width, h: rect.height };
    const p = fractionPoint(e);
    drawRef.current.x0 = p.x;
    drawRef.current.y0 = p.y;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const moveDraw = (e: React.PointerEvent) => {
    const d = drawRef.current;
    if (!d) return;
    const p = fractionPoint(e);
    setDraft({ x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y), w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0) });
  };

  const endDraw = () => {
    if (draft && draft.w >= MIN_BOX && draft.h >= MIN_BOX) {
      setBoxes((prev) => [...prev, { id: Math.random().toString(36).slice(2, 10), page, ...draft }]);
    }
    drawRef.current = null;
    setDraft(null);
  };

  const run = async () => {
    if (!file || !pdfDoc || boxes.length === 0) {
      setError("Gambar minimal satu kotak sensor di halaman terlebih dahulu.");
      return;
    }
    setIsWorking(true);
    setError(null);
    try {
      const redactedPages = new Set(boxes.map((b) => b.page));
      const src = await loadPdf(await file.arrayBuffer());
      const out = await PDFDocument.create();

      for (let n = 1; n <= pageCount; n++) {
        if (!redactedPages.has(n)) {
          const [copied] = await out.copyPages(src, [n - 1]);
          out.addPage(copied);
          continue;
        }
        setProgress("Menyensor halaman " + n + "...");
        const pdfPage = await pdfDoc.getPage(n);
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Gagal menginisialisasi canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;

        // Burn the black boxes into the pixels: the original text is gone from this page.
        ctx.fillStyle = "#000000";
        for (const b of boxes.filter((x) => x.page === n)) {
          ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height);
        }
        const jpg = await out.embedJpg(new Uint8Array(await (await canvasToJpeg(canvas)).arrayBuffer()));
        const newPage = out.addPage([base.width, base.height]);
        newPage.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
        await yieldToUi();
      }

      setProgress("Menyimpan hasil...");
      const bytes = await out.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      setError("Gagal menyensor PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const pageBoxes = boxes.filter((b) => b.page === page);
  const outName = file ? file.name.replace(/\.[^/.]+$/, "") + "_sensor.pdf" : "sensor.pdf";
  const redactedPageCount = new Set(boxes.map((b) => b.page)).size;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<EyeOff className="w-6 h-6" />}
        title="Sensor PDF"
        description="Tutup bagian dokumen yang rahasia dengan kotak hitam. Halaman yang disensor dirender ulang sehingga data di bawahnya benar-benar hilang."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && file && (
        <ResultCard
          title="PDF Berhasil Disensor!"
          subtitle={boxes.length + " kotak di " + redactedPageCount + " halaman · " + formatBytes(result.size)}
          blob={result}
          filename={outName}
          onBack={() => setResult(null)}
          onReset={reset}
        />
      )}

      {!file && <FileDropzone kind="pdf" icon={<EyeOff className="w-7 h-7" />} onFiles={handleFiles} loading={source.isLoading} />}

      {file && pdfDoc && !result && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + pageCount + " halaman"} onRemove={reset} disabled={isWorking} />

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-3 text-amber-200 text-sm">
            <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              Halaman yang punya kotak sensor diubah menjadi gambar, jadi teks di halaman itu tidak bisa lagi diseleksi atau dicari. Ini
              disengaja agar data yang disensor benar-benar hilang. Halaman tanpa kotak tidak diubah.
            </div>
          </div>

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Gambar kotak sensor di halaman</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Halaman sebelumnya"
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-zinc-300 min-w-16 text-center">
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount}
                  aria-label="Halaman berikutnya"
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <PdfPagePreview pdfDoc={pdfDoc} pageNumber={page} width={420} className="select-none max-w-full">
                {(info) => (
                  <div
                    className="absolute inset-0 cursor-crosshair touch-none"
                    onPointerDown={startDraw}
                    onPointerMove={moveDraw}
                    onPointerUp={endDraw}
                    onPointerCancel={endDraw}
                    aria-label="Area menggambar kotak sensor"
                  >
                    {pageBoxes.map((b) => (
                      <div
                        key={b.id}
                        className="absolute bg-black/85 border border-white/70"
                        style={{ left: b.x * info.cssWidth, top: b.y * info.cssHeight, width: b.w * info.cssWidth, height: b.h * info.cssHeight }}
                      >
                        <button
                          type="button"
                          aria-label="Hapus kotak sensor"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setBoxes((prev) => prev.filter((x) => x.id !== b.id))}
                          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {draft && (
                      <div
                        className="absolute bg-black/60 border border-dashed border-white"
                        style={{
                          left: draft.x * info.cssWidth,
                          top: draft.y * info.cssHeight,
                          width: draft.w * info.cssWidth,
                          height: draft.h * info.cssHeight,
                        }}
                      />
                    )}
                  </div>
                )}
              </PdfPagePreview>
            </div>

            <p className="text-xs text-zinc-400 text-center">
              {boxes.length === 0
                ? "Tarik di atas halaman untuk membuat kotak hitam. Bisa banyak kotak per halaman."
                : boxes.length + " kotak di " + redactedPageCount + " halaman. Tekan tanda X pada kotak untuk menghapusnya."}
            </p>
          </Card>

          <ActionBar>
            <button type="button" onClick={run} disabled={isWorking || boxes.length === 0} className={primaryBtnCls}>
              {isWorking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progress || "Memproses..."}</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Sensor &amp; Simpan</span>
                </>
              )}
            </button>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
