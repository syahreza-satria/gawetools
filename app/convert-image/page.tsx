"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import ImageBatchTool from "@/components/ImageBatchTool";
import { OUTPUT_FORMATS, type OutputMime, baseName, decodeImage, extFor, renderBitmap } from "@/lib/image";

export default function ConvertImagePage() {
  const [format, setFormat] = useState<OutputMime>("image/png");
  const [quality, setQuality] = useState(90);

  return (
    <ImageBatchTool
      icon={<Repeat className="w-6 h-6" />}
      title="Konversi Format Gambar"
      description="Ubah gambar antara JPG, PNG, dan WebP langsung di browser tanpa upload ke server."
      actionLabel="Konversi"
      doneLabel="berhasil dikonversi!"
      zipName="converted_images.zip"
      process={async (file) => {
        const bitmap = await decodeImage(file);
        try {
          const blob = await renderBitmap(bitmap, bitmap.width, bitmap.height, format, quality / 100);
          return { blob, filename: `${baseName(file.name)}.${extFor(format)}` };
        } finally {
          bitmap.close();
        }
      }}
      options={
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Format tujuan</label>
            <div className="flex gap-2">
              {OUTPUT_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    format === f.value
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-sky-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {format !== "image/png" && (
            <div>
              <label className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <span>Kualitas</span>
                <span className="text-sky-600 dark:text-sky-400">{quality}%</span>
              </label>
              <input
                type="range"
                min={30}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          )}
          {format === "image/jpeg" && (
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              JPG tidak mendukung transparansi — area transparan akan diisi warna putih.
            </p>
          )}
        </>
      }
    />
  );
}
