"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ImageIcon, Loader2, RefreshCw, UserRound } from "lucide-react";
import { loadSegmenter, personMask } from "@/lib/segmentPerson";
import { baseName, canvasToBlob, formatBytes } from "@/lib/image";
import { saveAs } from "@/lib/download";
import ContinueMenu from "@/components/ContinueMenu";
import {
  ActionBar,
  Card,
  ErrorBanner,
  FileCard,
  FileDropzone,
  SegmentedButtons,
  ToolHeader,
  primaryBtnCls,
  secondaryBtnCls,
} from "@/components/tool-ui";

const MAX_SIDE = 1600;

const BACKGROUNDS = [
  { id: "red", label: "Merah", value: "#d91e18" },
  { id: "blue", label: "Biru", value: "#0a5fd0" },
  { id: "white", label: "Putih", value: "#ffffff" },
];

type SizeId = "original" | "3x4" | "4x6";
const SIZES: Record<SizeId, { label: string; w: number; h: number } | null> = {
  original: null,
  "3x4": { label: "3×4", w: 354, h: 472 },
  "4x6": { label: "4×6", w: 472, h: 709 },
};

interface Segmented {
  src: HTMLCanvasElement;
  mask: HTMLCanvasElement;
}

/** Draws the person over a solid background, optionally cover-cropped to a passport photo size. */
function compose(target: HTMLCanvasElement, seg: Segmented, bg: string, feather: number, size: SizeId) {
  const fixed = SIZES[size];
  const sw = seg.src.width;
  const sh = seg.src.height;

  // Person cut-out: photo masked by the (feathered) person mask.
  const cut = document.createElement("canvas");
  cut.width = sw;
  cut.height = sh;
  const cctx = cut.getContext("2d");
  if (!cctx) return;
  cctx.drawImage(seg.src, 0, 0);
  cctx.globalCompositeOperation = "destination-in";
  if (feather > 0) cctx.filter = "blur(" + feather + "px)";
  cctx.drawImage(seg.mask, 0, 0);
  cctx.filter = "none";

  // Source rectangle: whole image, or a cover crop with the face area kept near the top.
  let cropX = 0;
  let cropY = 0;
  let cropW = sw;
  let cropH = sh;
  if (fixed) {
    const ratio = fixed.w / fixed.h;
    if (sw / sh > ratio) {
      cropW = sh * ratio;
      cropX = (sw - cropW) / 2;
    } else {
      cropH = sw / ratio;
      cropY = (sh - cropH) * 0.3;
    }
  }

  target.width = fixed ? fixed.w : sw;
  target.height = fixed ? fixed.h : sh;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(cut, cropX, cropY, cropW, cropH, 0, 0, target.width, target.height);
}

export default function PhotoBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [seg, setSeg] = useState<Segmented | null>(null);
  const [bg, setBg] = useState(BACKGROUNDS[0].value);
  const [size, setSize] = useState<SizeId>("3x4");
  const [feather, setFeather] = useState(2);
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // Re-compose whenever an option changes; the (slow) segmentation result is reused.
  useEffect(() => {
    if (seg && previewRef.current) compose(previewRef.current, seg, bg, feather, size);
  }, [seg, bg, feather, size]);

  const reset = () => {
    setFile(null);
    setSeg(null);
    setError(null);
  };

  const handleFiles = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    setFile(picked);
    setSeg(null);
    setError(null);
    setIsWorking(true);
    try {
      setStatus("Membaca foto...");
      const bitmap = await createImageBitmap(picked, { imageOrientation: "from-image" });
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const src = document.createElement("canvas");
      src.width = Math.round(bitmap.width * scale);
      src.height = Math.round(bitmap.height * scale);
      src.getContext("2d")?.drawImage(bitmap, 0, 0, src.width, src.height);
      bitmap.close();

      const segmenter = await loadSegmenter(setStatus);
      setStatus("Memisahkan orang dari latar...");
      await new Promise((r) => setTimeout(r, 30));
      const mask = await personMask(segmenter, src);
      setSeg({ src, mask });
    } catch (err) {
      console.error(err);
      setFile(null);
      setError("Gagal memproses foto: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setStatus("");
    }
  };

  const download = async () => {
    if (!previewRef.current || !file) return;
    const blob = await canvasToBlob(previewRef.current, "image/jpeg", 0.95);
    saveAs(blob, baseName(file.name) + "_latar.jpg");
  };

  const [continueBlob, setContinueBlob] = useState<Blob | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!seg || !previewRef.current) return;
    const t = setTimeout(() => {
      const canvas = previewRef.current;
      if (!canvas) return;
      canvasToBlob(canvas, "image/jpeg", 0.95).then((b) => {
        if (!cancelled) setContinueBlob(b);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [seg, bg, feather, size]);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <ToolHeader
        icon={<UserRound className="w-6 h-6" />}
        title="Ganti Latar Pas Foto"
        description="Hapus latar foto dan ganti dengan merah, biru, putih, atau warna lain. Model AI berjalan di browser Anda, foto tidak diunggah."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {!file && <FileDropzone kind="image" icon={<ImageIcon className="w-7 h-7" />} onFiles={handleFiles} onReject={setError} />}

      {file && (
        <div className="space-y-6">
          <FileCard
            name={file.name}
            meta={formatBytes(file.size)}
            onRemove={reset}
            disabled={isWorking}
            icon={<ImageIcon className="w-5 h-5" />}
          />

          {isWorking && (
            <Card className="flex items-center justify-center gap-3 py-10 text-sm text-zinc-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              {status || "Memproses..."}
            </Card>
          )}

          {seg && (
            <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] gap-6">
              <div className="flex justify-center">
                <canvas
                  ref={previewRef}
                  className="max-w-full max-h-[28rem] w-auto h-auto rounded-lg border border-zinc-700 bg-zinc-900"
                />
              </div>

              <Card className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Warna latar</h3>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {BACKGROUNDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBg(b.value)}
                        title={b.label}
                        aria-label={"Latar " + b.label}
                        className={
                          "w-10 h-10 rounded-full border-2 transition-all " +
                          (bg === b.value ? "border-white ring-2 ring-white/40 scale-110" : "border-zinc-600")
                        }
                        style={{ background: b.value }}
                      />
                    ))}
                    <label className="flex items-center gap-2 text-xs text-zinc-300 ml-2">
                      Kustom
                      <input
                        type="color"
                        value={bg}
                        onChange={(e) => setBg(e.target.value)}
                        className="w-10 h-10 rounded-full bg-transparent border-2 border-zinc-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Ukuran pas foto (300 dpi)</h3>
                  <SegmentedButtons
                    value={size}
                    onChange={setSize}
                    options={[
                      { id: "original", label: "Asli" },
                      { id: "3x4", label: "3×4 (354×472)" },
                      { id: "4x6", label: "4×6 (472×709)" },
                    ]}
                  />
                </div>

                <div>
                  <label className="flex justify-between text-sm font-semibold text-white mb-2">
                    <span>Haluskan tepi</span>
                    <span className="text-zinc-400">{feather} px</span>
                  </label>
                  <input type="range" min={0} max={8} value={feather} onChange={(e) => setFeather(Number(e.target.value))} className="w-full" />
                </div>
              </Card>
            </div>
          )}

          {seg && (
            <ActionBar note="Hasil dilihat langsung di pratinjau; untuk potong manual, lanjutkan ke Crop Gambar.">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={download} className={primaryBtnCls}>
                  <ArrowDownToLine className="w-4 h-4" />
                  Download JPG
                </button>
                {continueBlob && <ContinueMenu kind="image" files={[{ blob: continueBlob, name: baseName(file.name) + "_latar.jpg" }]} />}
                <button type="button" onClick={reset} className={secondaryBtnCls + " !py-2.5"}>
                  <RefreshCw className="w-4 h-4" />
                  Foto Lain
                </button>
              </div>
            </ActionBar>
          )}
        </div>
      )}
    </div>
  );
}
