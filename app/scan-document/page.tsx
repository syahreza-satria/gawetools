"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ImagePlus,
  Loader2,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import { applyScanFilter, warpPerspective, type Pt, type Quad, type ScanFilter } from "@/lib/scanImage";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { yieldToUi } from "@/lib/yieldToUi";
import { formatBytes } from "@/lib/image";
import { ActionBar, Card, ErrorBanner, ResultCard, SegmentedButtons, ToolHeader, primaryBtnCls, secondaryBtnCls } from "@/components/tool-ui";

const MAX_SOURCE_SIDE = 2600;
const PREVIEW_DIM = 900;
const EXPORT_DIM = 2000;
const A4 = { w: 595.28, h: 841.89 };
const HANDLE_NAMES = ["Kiri atas", "Kanan atas", "Kanan bawah", "Kiri bawah"];

interface ScanPage {
  id: string;
  /** Downscaled source photo (pixels used for warping). */
  canvas: HTMLCanvasElement;
  url: string;
  /** Corner positions as fractions of the photo: TL, TR, BR, BL. */
  corners: [Pt, Pt, Pt, Pt];
  filter: ScanFilter;
}

const DEFAULT_CORNERS: ScanPage["corners"] = [
  { x: 0.06, y: 0.06 },
  { x: 0.94, y: 0.06 },
  { x: 0.94, y: 0.94 },
  { x: 0.06, y: 0.94 },
];

function toQuad(page: ScanPage): Quad {
  const { width, height } = page.canvas;
  return page.corners.map((c) => ({ x: c.x * width, y: c.y * height })) as Quad;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar"))), "image/jpeg", quality);
  });
}

async function makePage(source: ImageBitmap | HTMLVideoElement): Promise<ScanPage> {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  const url = URL.createObjectURL(await canvasToBlob(canvas, 0.9));
  return { id: Math.random().toString(36).slice(2, 10), canvas, url, corners: DEFAULT_CORNERS.map((c) => ({ ...c })) as ScanPage["corners"], filter: "bw" };
}

export default function ScanDocumentPage() {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageMode, setPageMode] = useState<"a4" | "fit">("a4");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ index: number; rect: DOMRect } | null>(null);
  const urlsRef = useRef<string[]>([]);

  const selected = pages.find((p) => p.id === selectedId) ?? pages[0] ?? null;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const addPages = useCallback(async (files: File[]) => {
    setResult(null);
    try {
      const created: ScanPage[] = [];
      for (const file of files) {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        created.push(await makePage(bitmap));
        bitmap.close();
      }
      created.forEach((p) => urlsRef.current.push(p.url));
      setPages((prev) => [...prev, ...created]);
      if (created.length > 0) setSelectedId((cur) => cur ?? created[0].id);
    } catch {
      setError("Gagal membaca foto. Pastikan file tidak rusak.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => void addPages(accepted),
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    multiple: true,
    disabled: isWorking,
  });

  useIncomingFiles("image", (files) => void addPages(files), isWorking);

  const openCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser ini tidak mendukung kamera. Gunakan tombol unggah foto.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Kamera tidak bisa diakses. Izinkan akses kamera di browser, atau unggah foto dari galeri.");
    }
  };

  // Attach the stream once the <video> exists.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const page = await makePage(video);
    urlsRef.current.push(page.url);
    setResult(null);
    setPages((prev) => [...prev, page]);
    setSelectedId((cur) => cur ?? page.id);
  };

  const updatePage = (id: string, patch: Partial<ScanPage>) => setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePage = (id: string) => {
    setResult(null);
    setPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const next = prev.filter((p) => p.id !== id);
      setSelectedId((cur) => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
  };

  const movePage = (id: string, delta: number) => {
    setResult(null);
    setPages((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // Corner dragging
  const startDrag = (e: React.PointerEvent, index: number) => {
    if (!stageRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { index, rect: stageRef.current.getBoundingClientRect() };
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !selected) return;
    const x = Math.min(Math.max((e.clientX - d.rect.left) / d.rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - d.rect.top) / d.rect.height, 0), 1);
    const corners = selected.corners.map((c, i) => (i === d.index ? { x, y } : c)) as ScanPage["corners"];
    updatePage(selected.id, { corners });
    setResult(null);
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  // Live preview of the flattened result for the selected page.
  const previewCanvas = useMemo(() => {
    if (!selected) return null;
    try {
      const c = warpPerspective(selected.canvas, toQuad(selected), PREVIEW_DIM);
      applyScanFilter(c, selected.filter);
      return c;
    } catch {
      return null;
    }
  }, [selected]);

  useEffect(() => {
    const target = previewRef.current;
    if (!target || !previewCanvas) return;
    target.width = previewCanvas.width;
    target.height = previewCanvas.height;
    target.getContext("2d")?.drawImage(previewCanvas, 0, 0);
  }, [previewCanvas]);

  const exportPdf = async () => {
    if (pages.length === 0) return;
    setIsWorking(true);
    setError(null);
    try {
      const doc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        setProgress("Memproses halaman " + (i + 1) + " dari " + pages.length + "...");
        await yieldToUi();
        const page = pages[i];
        const flat = warpPerspective(page.canvas, toQuad(page), EXPORT_DIM);
        applyScanFilter(flat, page.filter);
        const jpg = await doc.embedJpg(new Uint8Array(await (await canvasToBlob(flat, 0.85)).arrayBuffer()));
        if (pageMode === "a4") {
          const margin = 24;
          const ratio = Math.min((A4.w - margin * 2) / flat.width, (A4.h - margin * 2) / flat.height);
          const w = flat.width * ratio;
          const h = flat.height * ratio;
          const p = doc.addPage([A4.w, A4.h]);
          p.drawImage(jpg, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
        } else {
          const w = A4.w;
          const h = (flat.height / flat.width) * w;
          const p = doc.addPage([w, h]);
          p.drawImage(jpg, { x: 0, y: 0, width: w, height: h });
        }
      }
      setProgress("Menyimpan PDF...");
      const bytes = await doc.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      setError("Gagal membuat PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const reset = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setPages([]);
    setSelectedId(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<ScanLine className="w-6 h-6" />}
        title="Scan Dokumen"
        description="Foto dokumen dengan kamera atau unggah foto, luruskan sudutnya, pilih filter, lalu simpan sebagai PDF. Semua diproses di perangkat Anda."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && (
        <ResultCard
          title="PDF Scan Siap!"
          subtitle={pages.length + " halaman · " + formatBytes(result.size)}
          blob={result}
          filename="scan-dokumen.pdf"
          onBack={() => setResult(null)}
          backLabel="Ubah Halaman"
          onReset={reset}
          resetLabel="Scan Baru"
        />
      )}

      {cameraOpen && (
        <Card className="mb-6 space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} playsInline muted className="w-full max-h-[70vh] object-contain" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={capture} className={primaryBtnCls}>
              <Camera className="w-4 h-4" />
              Ambil Foto
            </button>
            <button type="button" onClick={stopCamera} className={secondaryBtnCls + " !py-2.5"}>
              <X className="w-4 h-4" />
              Tutup Kamera
            </button>
          </div>
          <p className="text-xs text-zinc-400 text-center">Letakkan dokumen di permukaan gelap dengan cahaya merata. Foto bisa diambil berkali-kali untuk beberapa halaman.</p>
        </Card>
      )}

      {!result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => (cameraOpen ? stopCamera() : void openCamera())}
              disabled={isWorking}
              className="flex items-center justify-center gap-2 p-5 rounded-xl bg-zinc-950 border border-zinc-700/70 text-white font-semibold text-sm hover:border-sky-400 transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              {cameraOpen ? "Tutup Kamera" : "Buka Kamera"}
            </button>
            <div
              {...getRootProps()}
              className={
                "flex items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer text-sm font-semibold transition-colors " +
                (isDragActive ? "border-sky-500 bg-sky-950/30 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-sky-400")
              }
            >
              <input {...getInputProps()} />
              <ImagePlus className="w-5 h-5" />
              Unggah Foto
            </div>
          </div>
          {cameraError && <p className="text-sm text-amber-300">{cameraError}</p>}

          {pages.length === 0 && (
            <p className="text-center text-sm text-zinc-400">Belum ada halaman. Ambil foto dengan kamera atau unggah foto dokumen (bisa tempel dengan Ctrl+V).</p>
          )}

          {pages.length > 0 && selected && (
            <>
              <Card className="space-y-2">
                <h3 className="label-mono text-zinc-300">Halaman ({pages.length})</h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {pages.map((p, i) => (
                    <div key={p.id} className="shrink-0 w-24 space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={"block w-24 h-28 rounded-lg overflow-hidden border-2 bg-zinc-900 " + (p.id === selected.id ? "border-white" : "border-zinc-700")}
                        aria-label={"Pilih halaman " + (i + 1)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={"Halaman " + (i + 1)} className="w-full h-full object-cover" />
                      </button>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">{i + 1}</span>
                        <div className="flex">
                          <button type="button" onClick={() => movePage(p.id, -1)} disabled={i === 0} aria-label="Geser ke kiri" className="p-1 text-zinc-400 hover:text-white disabled:opacity-30">
                            <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                          <button type="button" onClick={() => movePage(p.id, 1)} disabled={i === pages.length - 1} aria-label="Geser ke kanan" className="p-1 text-zinc-400 hover:text-white disabled:opacity-30">
                            <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                          <button type="button" onClick={() => removePage(p.id)} aria-label="Hapus halaman" className="p-1 text-zinc-400 hover:text-sky-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">1. Atur 4 sudut dokumen</h3>
                  <div
                    ref={stageRef}
                    className="relative mx-auto w-full max-w-md select-none touch-none"
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selected.url} alt="Foto dokumen" draggable={false} className="block w-full h-auto" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="none">
                      <polygon
                        points={selected.corners.map((c) => c.x + "," + c.y).join(" ")}
                        fill="rgba(255,255,255,0.12)"
                        stroke="white"
                        strokeWidth="0.004"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {selected.corners.map((c, i) => (
                      <span
                        key={i}
                        role="slider"
                        aria-label={"Sudut " + HANDLE_NAMES[i]}
                        aria-valuenow={Math.round(c.x * 100)}
                        onPointerDown={(e) => startDrag(e, i)}
                        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-sky-500 border-2 border-zinc-900 shadow cursor-grab touch-none"
                        style={{ left: c.x * 100 + "%", top: c.y * 100 + "%" }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePage(selected.id, { corners: DEFAULT_CORNERS.map((c) => ({ ...c })) as ScanPage["corners"] })}
                    className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                  >
                    Reset sudut
                  </button>
                </Card>

                <Card className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">2. Hasil &amp; filter</h3>
                  <div className="flex justify-center rounded-lg bg-zinc-900 p-2 min-h-40">
                    <canvas ref={previewRef} className="max-w-full max-h-96 w-auto h-auto bg-white" />
                  </div>
                  <SegmentedButtons
                    value={selected.filter}
                    onChange={(f) => {
                      updatePage(selected.id, { filter: f });
                      setResult(null);
                    }}
                    options={[
                      { id: "original", label: "Asli" },
                      { id: "gray", label: "Grayscale" },
                      { id: "bw", label: "Hitam-putih" },
                    ]}
                  />
                </Card>
              </div>

              <Card className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Ukuran halaman PDF</h3>
                <SegmentedButtons
                  value={pageMode}
                  onChange={setPageMode}
                  options={[
                    { id: "a4", label: "A4 (dengan margin)" },
                    { id: "fit", label: "Sesuai hasil scan" },
                  ]}
                />
              </Card>

              <ActionBar>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={reset} disabled={isWorking} className={secondaryBtnCls + " !py-2.5"}>
                    Hapus Semua
                  </button>
                  <button type="button" onClick={exportPdf} disabled={isWorking} className={primaryBtnCls}>
                    {isWorking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{progress || "Memproses..."}</span>
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4" />
                        <span>Buat PDF ({pages.length} halaman)</span>
                      </>
                    )}
                  </button>
                </div>
              </ActionBar>
            </>
          )}
        </div>
      )}
    </div>
  );
}
