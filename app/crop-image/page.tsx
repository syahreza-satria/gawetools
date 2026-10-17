"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "@/lib/download";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { baseName, canvasToBlob, formatBytes, type OutputMime } from "@/lib/image";
import ContinueMenu from "@/components/ContinueMenu";
import {
  Crop,
  ImageIcon,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
} from "lucide-react";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = "move" | "tl" | "t" | "tr" | "r" | "br" | "b" | "bl" | "l";

interface Preset {
  id: string;
  label: string;
  ratio: number | null;
  /** Fixed output size (pixels at 300 dpi) for passport-photo presets. */
  photo?: { w: number; h: number; note: string };
}

const PRESETS: Preset[] = [
  { id: "free", label: "Bebas", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "3:4", label: "3:4 (pas foto 3×4)", ratio: 3 / 4, photo: { w: 354, h: 472, note: "3×4 cm, 354×472 px" } },
  { id: "2:3", label: "2:3 (4×6)", ratio: 2 / 3, photo: { w: 472, h: 709, note: "4×6 cm, 472×709 px" } },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

const MIN_SIZE = 24;

const HANDLES: { id: Handle; cls: string; cursor: string; corner: boolean }[] = [
  { id: "tl", cls: "-top-2 -left-2", cursor: "nwse-resize", corner: true },
  { id: "t", cls: "-top-2 left-1/2 -translate-x-1/2", cursor: "ns-resize", corner: false },
  { id: "tr", cls: "-top-2 -right-2", cursor: "nesw-resize", corner: true },
  { id: "r", cls: "top-1/2 -right-2 -translate-y-1/2", cursor: "ew-resize", corner: false },
  { id: "br", cls: "-bottom-2 -right-2", cursor: "nwse-resize", corner: true },
  { id: "b", cls: "-bottom-2 left-1/2 -translate-x-1/2", cursor: "ns-resize", corner: false },
  { id: "bl", cls: "-bottom-2 -left-2", cursor: "nesw-resize", corner: true },
  { id: "l", cls: "top-1/2 -left-2 -translate-y-1/2", cursor: "ew-resize", corner: false },
];

/** Largest centered rectangle with the given ratio (or 90% of the image when free). */
function fitRect(W: number, H: number, ratio: number | null): Rect {
  if (ratio === null) return { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9 };
  let w = W;
  let h = w / ratio;
  if (h > H) {
    h = H;
    w = h * ratio;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function applyDrag(handle: Handle, start: Rect, dx: number, dy: number, W: number, H: number, ratio: number | null): Rect {
  if (handle === "move") {
    return { ...start, x: clamp(start.x + dx, 0, W - start.w), y: clamp(start.y + dy, 0, H - start.h) };
  }

  const left = handle.includes("l");
  const right = handle.includes("r");
  const top = handle.includes("t");
  const bottom = handle.includes("b");

  if (ratio !== null) {
    // Corner handles only: keep the opposite corner fixed and the ratio constant.
    const ax = left ? start.x + start.w : start.x;
    const ay = top ? start.y + start.h : start.y;
    const px = (left ? start.x : start.x + start.w) + dx;
    const py = (top ? start.y : start.y + start.h) + dy;
    const availX = left ? ax : W - ax;
    const availY = top ? ay : H - ay;
    const maxW = Math.min(availX, availY * ratio);
    let w = Math.max(Math.abs(px - ax), Math.abs(py - ay) * ratio);
    w = clamp(w, Math.min(MIN_SIZE, maxW), maxW);
    const h = w / ratio;
    return { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
  }

  let { x, y, w, h } = start;
  if (left) {
    const nx = clamp(start.x + dx, 0, start.x + start.w - MIN_SIZE);
    w = start.x + start.w - nx;
    x = nx;
  } else if (right) {
    w = clamp(start.w + dx, MIN_SIZE, W - start.x);
  }
  if (top) {
    const ny = clamp(start.y + dy, 0, start.y + start.h - MIN_SIZE);
    h = start.y + start.h - ny;
    y = ny;
  } else if (bottom) {
    h = clamp(start.h + dy, MIN_SIZE, H - start.y);
  }
  return { x, y, w, h };
}

function outputMime(file: File): OutputMime {
  if (file.type === "image/png" || file.type === "image/webp") return file.type;
  return "image/jpeg";
}

const EXT: Record<OutputMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [rotation, setRotation] = useState(0); // quarter turns clockwise
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [presetId, setPresetId] = useState("free");
  const [usePhotoSize, setUsePhotoSize] = useState(true);
  const [rect, setRect] = useState<Rect | null>(null);
  const [displayWidth, setDisplayWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; filename: string; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; rect: Rect } | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const quarter = rotation % 2 === 1;
  const W = bitmap ? (quarter ? bitmap.height : bitmap.width) : 0;
  const H = bitmap ? (quarter ? bitmap.width : bitmap.height) : 0;
  const k = W > 0 && displayWidth > 0 ? displayWidth / W : 0;

  const revokeResult = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }, []);

  useEffect(() => revokeResult, [revokeResult]);
  useEffect(() => () => bitmap?.close(), [bitmap]);

  // Draw the (rotated / flipped) image onto the visible canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rotation * Math.PI) / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    ctx.restore();
  }, [bitmap, rotation, flipH, flipV, W, H, file, result]);

  // Track the displayed width so pointer movement can be converted to image pixels.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setDisplayWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bitmap, result]);

  const handleReset = () => {
    revokeResult();
    setResult(null);
    setFile(null);
    setBitmap(null);
    setRect(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPresetId("free");
    setErrorMessage(null);
  };

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        setErrorMessage("Hanya file JPG, PNG, dan WebP yang diperbolehkan.");
        return;
      }
      const picked = accepted[0];
      if (!picked) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Respect the EXIF orientation so phone photos are not shown sideways.
        const bmp = await createImageBitmap(picked, { imageOrientation: "from-image" });
        revokeResult();
        setResult(null);
        setFile(picked);
        setBitmap(bmp);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setPresetId("free");
        setRect(fitRect(bmp.width, bmp.height, null));
      } catch {
        setErrorMessage("Gagal membaca gambar. Pastikan file tidak rusak.");
      } finally {
        setIsLoading(false);
      }
    },
    [revokeResult]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: isLoading || isSaving,
  });

  useIncomingFiles("image", (files) => onDrop(files, []), isLoading || isSaving);

  const choosePreset = (p: Preset) => {
    setPresetId(p.id);
    if (W > 0) setRect(fitRect(W, H, p.ratio));
  };

  const transform = (change: () => void, nextW: number, nextH: number) => {
    change();
    setRect(fitRect(nextW, nextH, preset.ratio));
  };

  const rotate = () => transform(() => setRotation((r) => (r + 1) % 4), H, W);

  const startDrag = (handle: Handle, e: React.PointerEvent) => {
    if (!rect || k === 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, rect };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || k === 0) return;
    const dx = (e.clientX - d.startX) / k;
    const dy = (e.clientY - d.startY) / k;
    setRect(applyDrag(d.handle, d.rect, dx, dy, W, H, preset.ratio));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleCrop = async () => {
    const source = canvasRef.current;
    if (!source || !file || !rect) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const sx = Math.round(rect.x);
      const sy = Math.round(rect.y);
      const sw = Math.max(1, Math.round(rect.w));
      const sh = Math.max(1, Math.round(rect.h));
      const fixed = preset.photo && usePhotoSize ? preset.photo : null;
      const ow = fixed ? fixed.w : sw;
      const oh = fixed ? fixed.h : sh;

      const out = document.createElement("canvas");
      out.width = ow;
      out.height = oh;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Gagal membuat canvas context");
      const mime = outputMime(file);
      if (mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ow, oh);
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, ow, oh);
      const blob = await canvasToBlob(out, mime, 0.92);

      revokeResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, filename: baseName(file.name) + "_crop." + EXT[mime], w: ow, h: oh });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setErrorMessage("Gagal memotong gambar: " + detail);
    } finally {
      setIsSaving(false);
    }
  };

  const fixedPhoto = preset.photo && usePhotoSize ? preset.photo : null;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <Crop className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Crop Gambar</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Potong gambar dengan area yang bisa digeser dan diubah ukurannya, lengkap dengan preset pas foto 3×4 dan 4×6.
        </p>
      </div>

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

      {!bitmap && (
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
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <ImageIcon className="w-7 h-7" />}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Lepaskan gambar di sini" : "Tarik & Lepas 1 Gambar ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            JPG, PNG, WebP — atau klik untuk memilih, bisa juga tempel dengan Ctrl+V
          </p>
        </div>
      )}

      {bitmap && file && result && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gambar Berhasil Dipotong!</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              {result.w} × {result.h} px · {formatBytes(result.blob.size)}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.url}
            alt="Hasil crop"
            className="mx-auto max-h-80 max-w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)]"
          />
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => saveAs(result.blob, result.filename)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download Gambar
            </button>
            <ContinueMenu kind="image" files={[{ blob: result.blob, name: result.filename }]} />
            <button
              onClick={() => {
                revokeResult();
                setResult(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <Crop className="w-4 h-4" />
              Ubah Area Crop
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Gambar Lain
            </button>
          </div>
        </div>
      )}

      {bitmap && file && !result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-700/70">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {formatBytes(file.size)} · {W} × {H} px
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              title="Ganti Gambar"
              className="p-2 rounded-lg text-gray-400 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-700/70 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Rasio</h3>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choosePreset(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      presetId === p.id
                        ? "bg-sky-600 border-sky-600 text-white"
                        : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-sky-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {preset.photo && (
                <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={usePhotoSize}
                    onChange={(e) => setUsePhotoSize(e.target.checked)}
                    className="accent-sky-600"
                  />
                  Hasilkan ukuran pas foto 300 dpi ({preset.photo.note})
                </label>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={rotate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Putar 90°
              </button>
              <button
                type="button"
                onClick={() => transform(() => setFlipH((f) => !f), W, H)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <FlipHorizontal2 className="w-4 h-4" />
                Balik Horizontal
              </button>
              <button
                type="button"
                onClick={() => transform(() => setFlipV((f) => !f), W, H)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <FlipVertical2 className="w-4 h-4" />
                Balik Vertikal
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-3 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-700/70">
            <div
              ref={stageRef}
              className="relative mx-auto w-full max-w-2xl select-none touch-none bg-zinc-200 dark:bg-zinc-900"
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <canvas ref={canvasRef} className="block w-full h-auto" />
              {rect && k > 0 && (
                <div
                  onPointerDown={(e) => startDrag("move", e)}
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    left: rect.x * k,
                    top: rect.y * k,
                    width: rect.w * k,
                    height: rect.h * k,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    outline: "1px solid rgba(14,165,233,0.9)",
                  }}
                >
                  {HANDLES.filter((h) => preset.ratio === null || h.corner).map((h) => (
                    <span
                      key={h.id}
                      onPointerDown={(e) => startDrag(h.id, e)}
                      className={`absolute w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow ${h.cls}`}
                      style={{ cursor: h.cursor }}
                    />
                  ))}
                </div>
              )}
            </div>
            {rect && (
              <p className="mt-3 text-center text-xs text-gray-500 dark:text-zinc-400">
                Area: {Math.round(rect.w)} × {Math.round(rect.h)} px
                {fixedPhoto ? " → hasil " + fixedPhoto.w + " × " + fixedPhoto.h + " px" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-700/70">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Proses dijalankan langsung di perangkat Anda tanpa upload file.
            </span>
            <button
              type="button"
              onClick={handleCrop}
              disabled={isSaving || !rect}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crop className="w-4 h-4" />}
              <span>Potong Gambar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
