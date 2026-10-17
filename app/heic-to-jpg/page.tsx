"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import ImageBatchTool from "@/components/ImageBatchTool";
import { baseName } from "@/lib/image";

type HeicOutput = "image/jpeg" | "image/png";

const HEIC_ACCEPT = {
  "image/heic": [".heic"],
  "image/heif": [".heif"],
};

export default function HeicToJpgPage() {
  const [format, setFormat] = useState<HeicOutput>("image/jpeg");
  const [quality, setQuality] = useState(90);

  return (
    <ImageBatchTool
      icon={<Smartphone className="w-6 h-6" />}
      title="HEIC ke JPG"
      description="Ubah foto HEIC/HEIF dari iPhone menjadi JPG atau PNG langsung di browser, tanpa upload."
      actionLabel="Konversi"
      doneLabel="berhasil dikonversi!"
      zipName="heic_converted.zip"
      accept={HEIC_ACCEPT}
      acceptLabel="HEIC, HEIF"
      incomingKind="heic"
      process={async (file) => {
        // Heavy decoder: only loaded when a conversion actually starts.
        const { default: heic2any } = await import("heic2any");
        let result: Blob | Blob[];
        try {
          result = await heic2any({ blob: file, toType: format, quality: quality / 100 });
        } catch {
          throw new Error(`Gagal membaca ${file.name}. Pastikan file HEIC/HEIF tidak rusak.`);
        }
        const blob = Array.isArray(result) ? result[0] : result;
        return { blob, filename: `${baseName(file.name)}.${format === "image/png" ? "png" : "jpg"}` };
      }}
      options={
        <>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Format tujuan</label>
            <div className="flex gap-2">
              {(
                [
                  ["image/jpeg", "JPG"],
                  ["image/png", "PNG"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    format === value
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-sky-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {format === "image/jpeg" && (
            <div>
              <label className="flex justify-between text-sm font-semibold text-white mb-2">
                <span>Kualitas</span>
                <span className="text-sky-400">{quality}%</span>
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
          <p className="text-xs text-zinc-400">
            Konversi HEIC cukup berat; foto besar bisa memakan beberapa detik per file.
          </p>
        </>
      }
    />
  );
}
