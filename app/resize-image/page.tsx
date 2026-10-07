"use client";

import { useState } from "react";
import { Scaling } from "lucide-react";
import ImageBatchTool from "@/components/ImageBatchTool";
import { OUTPUT_FORMATS, type OutputMime, baseName, decodeImage, extFor, renderBitmap } from "@/lib/image";

type Mode = "pixel" | "percent";

const inputCls =
  "w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

function mimeOf(file: File): OutputMime {
  if (file.type === "image/png" || file.type === "image/webp") return file.type;
  return "image/jpeg";
}

export default function ResizeImagePage() {
  const [mode, setMode] = useState<Mode>("pixel");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [percent, setPercent] = useState(50);
  const [format, setFormat] = useState<OutputMime | "original">("original");

  const w = parseInt(width, 10);
  const h = parseInt(height, 10);

  return (
    <ImageBatchTool
      icon={<Scaling className="w-6 h-6" />}
      title="Resize Gambar"
      description="Ubah dimensi gambar (lebar × tinggi atau persentase) secara massal di browser."
      actionLabel="Resize"
      doneLabel="berhasil diubah ukurannya!"
      zipName="resized_images.zip"
      validate={() => {
        if (mode === "percent") return null;
        if (!(w > 0) && !(h > 0)) return "Isi minimal lebar atau tinggi (dalam piksel).";
        if (!keepRatio && (!(w > 0) || !(h > 0))) return "Isi lebar dan tinggi, atau aktifkan 'Kunci rasio'.";
        if (w > 10000 || h > 10000) return "Dimensi maksimal 10.000 piksel.";
        return null;
      }}
      process={async (file) => {
        const bitmap = await decodeImage(file);
        try {
          let tw: number;
          let th: number;
          if (mode === "percent") {
            tw = (bitmap.width * percent) / 100;
            th = (bitmap.height * percent) / 100;
          } else if (!keepRatio) {
            tw = w;
            th = h;
          } else {
            // Fit within the given box, keeping aspect ratio
            const ratio = Math.min(w > 0 ? w / bitmap.width : Infinity, h > 0 ? h / bitmap.height : Infinity);
            tw = bitmap.width * ratio;
            th = bitmap.height * ratio;
          }
          const mime = format === "original" ? mimeOf(file) : format;
          const blob = await renderBitmap(bitmap, tw, th, mime, 0.92);
          return { blob, filename: `${baseName(file.name)}_${Math.round(tw)}x${Math.round(th)}.${extFor(mime)}` };
        } finally {
          bitmap.close();
        }
      }}
      options={
        <>
          <div className="flex gap-2">
            {(
              [
                ["pixel", "Dalam piksel"],
                ["percent", "Persentase"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  mode === key
                    ? "bg-sky-600 border-sky-600 text-white"
                    : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-sky-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "pixel" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Lebar (px)</label>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="cth: 1280"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Tinggi (px)</label>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="cth: 720"
                    className={inputCls}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={keepRatio}
                  onChange={(e) => setKeepRatio(e.target.checked)}
                  className="accent-sky-600"
                />
                Kunci rasio (gambar dimuat dalam kotak lebar × tinggi, boleh isi salah satu)
              </label>
            </>
          ) : (
            <div>
              <label className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <span>Skala</span>
                <span className="text-sky-600 dark:text-sky-400">{percent}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Format hasil</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as OutputMime | "original")}
              className={inputCls}
            >
              <option value="original">Sama seperti aslinya</option>
              {OUTPUT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    />
  );
}
