"use client";

import { useMemo, useRef, useState } from "react";
import { Dancing_Script, Great_Vibes, Caveat } from "next/font/google";
import { Eraser, Upload, PenLine, Type, Check } from "lucide-react";

// Handwriting fonts are bundled and self-hosted by next/font at build time.
const dancing = Dancing_Script({ subsets: ["latin"], display: "swap" });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], display: "swap" });

const SCRIPT_FONTS = [
  { id: "dancing", label: "Dancing Script", family: dancing.style.fontFamily },
  { id: "vibes", label: "Great Vibes", family: vibes.style.fontFamily },
  { id: "caveat", label: "Caveat", family: caveat.style.fontFamily },
];

const INK_COLORS = [
  { id: "black", label: "Hitam", value: "#111827" },
  { id: "blue", label: "Biru", value: "#1d4ed8" },
];

export interface SignatureAsset {
  dataUrl: string;
  /** height / width */
  aspect: number;
}

type Tab = "draw" | "type" | "upload";
type Point = { x: number; y: number };

const DRAW_W = 800;
const DRAW_H = 280;
const PAD = 10;

const tabs: { id: Tab; label: string; icon: typeof PenLine }[] = [
  { id: "draw", label: "Gambar", icon: PenLine },
  { id: "type", label: "Ketik", icon: Type },
  { id: "upload", label: "Unggah", icon: Upload },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

/** Crops transparent margins off a canvas and returns it as a PNG signature asset. */
function toAsset(source: HTMLCanvasElement): SignatureAsset | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1 + PAD * 2;
  const h = maxY - minY + 1 + PAD * 2;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(source, minX - PAD, minY - PAD);
  return { dataUrl: out.toDataURL("image/png"), aspect: h / w };
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {INK_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          aria-label={"Warna " + c.label}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            value === c.value ? "border-sky-500 ring-2 ring-sky-500/40 scale-110" : "border-gray-300 dark:border-zinc-600"
          }`}
          style={{ background: c.value }}
        />
      ))}
    </div>
  );
}

function DrawPanel({ onUse }: { onUse: (a: SignatureAsset) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(INK_COLORS[0].value);
  const [hasInk, setHasInk] = useState(false);

  const paint = (ink: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, DRAW_W, DRAW_H);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mx = (stroke[i].x + stroke[i + 1].x) / 2;
        const my = (stroke[i].y + stroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mx, my);
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  };

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * DRAW_W, y: ((e.clientY - rect.top) / rect.height) * DRAW_H };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([pointFrom(e)]);
    setHasInk(true);
    paint(color);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.push(pointFrom(e));
    paint(color);
  };

  const up = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    strokesRef.current = [];
    setHasInk(false);
    paint(color);
  };

  const changeColor = (value: string) => {
    setColor(value);
    paint(value);
  };

  const use = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asset = toAsset(canvas);
    if (asset) onUse(asset);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-100 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={DRAW_W}
          height={DRAW_H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="block w-full h-auto touch-none cursor-crosshair"
          aria-label="Area menggambar tanda tangan"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ColorPicker value={color} onChange={changeColor} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            disabled={!hasInk}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            <Eraser className="w-4 h-4" />
            Ulang
          </button>
          <button
            type="button"
            onClick={use}
            disabled={!hasInk}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Gunakan
          </button>
        </div>
      </div>
    </div>
  );
}

function TypePanel({ onUse }: { onUse: (a: SignatureAsset) => void }) {
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState(SCRIPT_FONTS[0].id);
  const [color, setColor] = useState(INK_COLORS[0].value);
  const [busy, setBusy] = useState(false);
  const font = SCRIPT_FONTS.find((f) => f.id === fontId) ?? SCRIPT_FONTS[0];

  const use = async () => {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    try {
      const size = 120;
      // Canvas does not trigger font loading by itself.
      await document.fonts.load(size + "px " + font.family, value);
      const measure = document.createElement("canvas").getContext("2d");
      if (!measure) return;
      measure.font = size + "px " + font.family;
      const textWidth = Math.ceil(measure.measureText(value).width);
      const canvas = document.createElement("canvas");
      canvas.width = textWidth + size;
      canvas.height = Math.ceil(size * 2);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = size + "px " + font.family;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(value, size / 2, canvas.height / 2);
      const asset = toAsset(canvas);
      if (asset) onUse(asset);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={text}
        maxLength={40}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ketik nama Anda"
        className={inputCls}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SCRIPT_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFontId(f.id)}
            className={`px-3 py-3 rounded-xl border text-center transition-colors overflow-hidden ${
              fontId === f.id
                ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500"
                : "border-gray-200 dark:border-zinc-700 hover:border-sky-400"
            }`}
          >
            <span className="block text-2xl truncate text-gray-900 dark:text-zinc-100" style={{ fontFamily: f.family, color }}>
              {text.trim() || "Tanda Tangan"}
            </span>
            <span className="block text-[11px] text-gray-500 dark:text-zinc-400 mt-1">{f.label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ColorPicker value={color} onChange={setColor} />
        <button
          type="button"
          onClick={use}
          disabled={!text.trim() || busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
          Gunakan
        </button>
      </div>
    </div>
  );
}

const MAX_UPLOAD_WIDTH = 900;

/** Draws the bitmap (downscaled) and optionally turns near-white pixels transparent. */
function processUpload(bitmap: ImageBitmap, removeWhite: boolean, threshold: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_UPLOAD_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (removeWhite) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const feather = 40;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (lum >= threshold) {
        d[i + 3] = 0;
      } else if (lum > threshold - feather) {
        d[i + 3] = Math.round((d[i + 3] * (threshold - lum)) / feather);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  return canvas;
}

function UploadPanel({ onUse }: { onUse: (a: SignatureAsset) => void }) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [threshold, setThreshold] = useState(200);
  const [error, setError] = useState<string | null>(null);

  const processed = useMemo(
    () => (bitmap ? processUpload(bitmap, removeWhite, threshold) : null),
    [bitmap, removeWhite, threshold]
  );
  const previewUrl = useMemo(() => (processed ? processed.toDataURL("image/png") : null), [processed]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Gunakan gambar JPG, PNG, atau WebP.");
      return;
    }
    try {
      setBitmap(await createImageBitmap(file, { imageOrientation: "from-image" }));
      setError(null);
    } catch {
      setError("Gagal membaca gambar tanda tangan.");
    }
  };

  const use = () => {
    if (!processed) return;
    const asset = toAsset(processed);
    if (asset) onUse(asset);
    else setError("Tidak ada goresan yang terdeteksi. Coba turunkan ambang latar putih.");
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 cursor-pointer hover:border-sky-400 transition-colors">
        <Upload className="w-4 h-4" />
        {bitmap ? "Ganti gambar tanda tangan" : "Pilih foto/scan tanda tangan"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-xs text-sky-700 dark:text-sky-300">{error}</p>}
      {previewUrl && (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#3f3f46_0%_25%,#27272a_0%_50%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Pratinjau tanda tangan" className="mx-auto max-h-32 max-w-full" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={removeWhite}
              onChange={(e) => setRemoveWhite(e.target.checked)}
              className="accent-sky-600"
            />
            Hapus latar putih (jadikan transparan)
          </label>
          {removeWhite && (
            <div>
              <label className="flex justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                <span>Ambang putih</span>
                <span className="text-sky-600 dark:text-sky-400">{threshold}</span>
              </label>
              <input
                type="range"
                min={100}
                max={250}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={use}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Gunakan
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Three ways to make a signature (draw, type, upload). Signatures are kept in memory only. */
export default function SignatureMaker({ onUse }: { onUse: (asset: SignatureAsset) => void }) {
  const [tab, setTab] = useState<Tab>("draw");

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              tab === id
                ? "bg-sky-600 border-sky-600 text-white"
                : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-sky-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === "draw" && <DrawPanel onUse={onUse} />}
      {tab === "type" && <TypePanel onUse={onUse} />}
      {tab === "upload" && <UploadPanel onUse={onUse} />}
    </div>
  );
}
