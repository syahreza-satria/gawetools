"use client";

import { useRef, useState } from "react";
import { Crop, Loader2 } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
import { loadPdf } from "@/lib/loadPdf";
import { describeVisualPage } from "@/lib/pdfVisual";
import { parseRangeInput } from "@/lib/parseRanges";
import { HANDLES, applyDrag, fitRect, type Handle, type Rect } from "@/lib/cropRect";
import { formatBytes } from "@/lib/image";
import PdfPagePreview from "@/components/PdfPagePreview";
import {
  ActionBar,
  Card,
  ErrorBanner,
  FileCard,
  FileDropzone,
  ResultCard,
  SegmentedButtons,
  ToolHeader,
  inputCls,
  primaryBtnCls,
} from "@/components/tool-ui";

type Mode = "area" | "margin";
type Scope = "all" | "range";

const MM_TO_PT = 72 / 25.4;
const MIN_FRACTION = 0.05;
const PREVIEW_WIDTH = 320;
const SIDE_LABEL = { top: "Atas", right: "Kanan", bottom: "Bawah", left: "Kiri" } as const;

export default function CropPdfPage() {
  const source = usePdfSource();
  const { file, pdfDoc, pageCount, error, setError } = source;
  const [mode, setMode] = useState<Mode>("area");
  const [rect, setRect] = useState<Rect>(() => fitRect(1, 1, null));
  const [margins, setMargins] = useState({ top: "10", right: "10", bottom: "10", left: "10" });
  const [scope, setScope] = useState<Scope>("all");
  const [rangeText, setRangeText] = useState("");
  const [alsoMediaBox, setAlsoMediaBox] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [isWorking, setIsWorking] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const dragRef = useRef<{ handle: Handle; x: number; y: number; rect: Rect; w: number; h: number } | null>(null);

  const reset = () => {
    source.reset();
    setResult(null);
    setRect(fitRect(1, 1, null));
    setPreviewPage(1);
  };

  const startDrag = (e: React.PointerEvent, handle: Handle, cssW: number, cssH: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { handle, x: e.clientX, y: e.clientY, rect, w: cssW, h: cssH };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setRect(applyDrag(d.handle, d.rect, (e.clientX - d.x) / d.w, (e.clientY - d.y) / d.h, 1, 1, null, MIN_FRACTION));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const run = async () => {
    if (!file) return;
    let targets: number[] = Array.from({ length: pageCount }, (_, i) => i + 1);
    if (scope === "range") {
      const parsed = parseRangeInput(rangeText, pageCount);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      targets = Array.from(new Set(parsed.ranges.flatMap((r) => r.pages))).sort((a, b) => a - b);
    }
    const m = {
      top: parseFloat(margins.top) || 0,
      right: parseFloat(margins.right) || 0,
      bottom: parseFloat(margins.bottom) || 0,
      left: parseFloat(margins.left) || 0,
    };

    setIsWorking(true);
    setError(null);
    try {
      const doc = await loadPdf(await file.arrayBuffer());
      for (const n of targets) {
        const page = doc.getPage(n - 1);
        const v = describeVisualPage(page);
        // Visual crop rectangle in points, origin bottom-left, in the page as displayed.
        let left: number, bottom: number, width: number, height: number;
        if (mode === "area") {
          left = rect.x * v.width;
          width = rect.w * v.width;
          height = rect.h * v.height;
          bottom = v.height - (rect.y + rect.h) * v.height;
        } else {
          left = m.left * MM_TO_PT;
          bottom = m.bottom * MM_TO_PT;
          width = v.width - (m.left + m.right) * MM_TO_PT;
          height = v.height - (m.top + m.bottom) * MM_TO_PT;
        }
        if (width < 10 || height < 10) throw new Error("Area crop di halaman " + n + " terlalu kecil. Kurangi margin.");

        // Map two opposite corners back to the unrotated page space.
        const a = v.toPage(left, bottom);
        const b = v.toPage(left + width, bottom + height);
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.abs(a.x - b.x);
        const h = Math.abs(a.y - b.y);
        page.setCropBox(x, y, w, h);
        if (alsoMediaBox) page.setMediaBox(x, y, w, h);
      }
      const bytes = await doc.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      setError("Gagal memotong PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
    }
  };

  const outName = file ? file.name.replace(/\.[^/.]+$/, "") + "_crop.pdf" : "crop.pdf";

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<Crop className="w-6 h-6" />}
        title="Crop PDF"
        description="Pangkas margin halaman PDF dengan memilih area di pratinjau atau mengisi margin dalam milimeter."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && file && (
        <ResultCard
          title="PDF Berhasil Dipangkas!"
          subtitle={formatBytes(result.size)}
          blob={result}
          filename={outName}
          onBack={() => setResult(null)}
          onReset={reset}
        />
      )}

      {!file && (
        <FileDropzone kind="pdf" icon={<Crop className="w-7 h-7" />} onFiles={(f) => void source.load(f)} loading={source.isLoading} />
      )}

      {file && pdfDoc && !result && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + pageCount + " halaman"} onRemove={reset} disabled={isWorking} />

          <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] gap-6">
            <div className="flex flex-col items-center gap-3">
              <PdfPagePreview pdfDoc={pdfDoc} pageNumber={previewPage} width={PREVIEW_WIDTH} className="select-none">
                {(info) => {
                  const ml = (parseFloat(margins.left) || 0) * MM_TO_PT;
                  const mr = (parseFloat(margins.right) || 0) * MM_TO_PT;
                  const mt = (parseFloat(margins.top) || 0) * MM_TO_PT;
                  const mb = (parseFloat(margins.bottom) || 0) * MM_TO_PT;
                  const box: Rect =
                    mode === "area"
                      ? rect
                      : { x: ml / info.ptWidth, y: mt / info.ptHeight, w: 1 - (ml + mr) / info.ptWidth, h: 1 - (mt + mb) / info.ptHeight };
                  return (
                    <div className="absolute inset-0 touch-none overflow-hidden" onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
                      <div
                        onPointerDown={mode === "area" ? (e) => startDrag(e, "move", info.cssWidth, info.cssHeight) : undefined}
                        className={"absolute border-2 border-white " + (mode === "area" ? "cursor-move" : "")}
                        style={{
                          left: box.x * info.cssWidth,
                          top: box.y * info.cssHeight,
                          width: Math.max(box.w, 0) * info.cssWidth,
                          height: Math.max(box.h, 0) * info.cssHeight,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                          outline: "1px solid rgba(0,0,0,0.6)",
                        }}
                      >
                        {mode === "area" &&
                          HANDLES.map((h) => (
                            <span
                              key={h.id}
                              onPointerDown={(e) => startDrag(e, h.id, info.cssWidth, info.cssHeight)}
                              className={"absolute w-4 h-4 rounded-full bg-sky-500 border-2 border-zinc-900 shadow " + h.cls}
                              style={{ cursor: h.cursor }}
                            />
                          ))}
                      </div>
                    </div>
                  );
                }}
              </PdfPagePreview>
              {pageCount > 1 && (
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  Pratinjau halaman
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={previewPage}
                    onChange={(e) => setPreviewPage(Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), pageCount))}
                    className="w-20 px-2 py-1 rounded-lg text-sm bg-zinc-900 border border-zinc-700"
                  />
                </label>
              )}
            </div>

            <Card className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Cara memilih area</h3>
                <SegmentedButtons
                  value={mode}
                  onChange={setMode}
                  options={[
                    { id: "area", label: "Pilih di pratinjau" },
                    { id: "margin", label: "Margin (mm)" },
                  ]}
                />
              </div>

              {mode === "margin" && (
                <div className="grid grid-cols-2 gap-3">
                  {(["top", "right", "bottom", "left"] as const).map((side) => (
                    <div key={side}>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">{SIDE_LABEL[side]} (mm)</label>
                      <input
                        type="number"
                        min={0}
                        value={margins[side]}
                        onChange={(e) => setMargins((prev) => ({ ...prev, [side]: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Terapkan ke</h3>
                <SegmentedButtons
                  value={scope}
                  onChange={setScope}
                  options={[
                    { id: "all", label: "Semua halaman" },
                    { id: "range", label: "Halaman tertentu" },
                  ]}
                />
                {scope === "range" && (
                  <input
                    type="text"
                    value={rangeText}
                    onChange={(e) => setRangeText(e.target.value)}
                    placeholder="cth: 1-3, 5, 7-9"
                    className={inputCls + " mt-3"}
                  />
                )}
              </div>

              <label className="flex items-start gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={alsoMediaBox} onChange={(e) => setAlsoMediaBox(e.target.checked)} className="accent-sky-600 mt-1" />
                <span>
                  Pangkas juga ukuran kertas (MediaBox)
                  <span className="block text-xs text-zinc-400">
                    Aktifkan bila hasil crop tidak terlihat di aplikasi pembaca PDF tertentu. Area di luar crop tidak bisa dikembalikan.
                  </span>
                </span>
              </label>
            </Card>
          </div>

          <ActionBar>
            <button type="button" onClick={run} disabled={isWorking} className={primaryBtnCls}>
              {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crop className="w-4 h-4" />}
              <span>Pangkas PDF</span>
            </button>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
