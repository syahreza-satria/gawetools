"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "@/lib/download";
import {
  FileImage,
  ArrowUp,
  ArrowDown,
  Trash2,
  ArrowDownToLine,
  AlertCircle,
  Loader2,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { baseName, decodeImage, formatBytes, renderBitmap } from "@/lib/image";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

type PageSize = "fit" | "a4";
type Margin = 0 | 24 | 48;

const A4 = { w: 595.28, h: 841.89 };
const PX_TO_PT = 0.75;

const segBtn = (active: boolean) =>
  `flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
    active
      ? "bg-sky-600 border-sky-600 text-white"
      : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-sky-400"
  }`;

/** Returns bytes + kind that pdf-lib can embed. JPEGs are re-encoded to honour EXIF rotation (phone photos). */
async function toEmbeddable(file: File): Promise<{ bytes: Uint8Array; kind: "jpg" | "png"; width: number; height: number }> {
  const bitmap = await decodeImage(file);
  try {
    const isPng = file.type === "image/png";
    const blob = isPng
      ? file
      : file.type === "image/webp"
        ? await renderBitmap(bitmap, bitmap.width, bitmap.height, "image/png")
        : await renderBitmap(bitmap, bitmap.width, bitmap.height, "image/jpeg", 0.92);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { bytes, kind: blob.type === "image/jpeg" ? "jpg" : "png", width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export default function ImageToPdfPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState<Margin>(24);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const onDrop = useCallback((accepted: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      setErrorMessage("Hanya file JPG, PNG, dan WebP yang diperbolehkan.");
      return;
    }
    setErrorMessage(null);
    const added = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.add(previewUrl);
      return { id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`, file, previewUrl };
    });
    setItems((prev) => [...prev, ...added]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: true,
    disabled: isWorking,
  });

  const remove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        urlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const reset = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current.clear();
    setItems([]);
    setErrorMessage(null);
  };

  const handleCreate = async () => {
    if (items.length === 0) return;
    setIsWorking(true);
    setErrorMessage(null);
    try {
      const pdf = await PDFDocument.create();
      for (const item of items) {
        const { bytes, kind, width, height } = await toEmbeddable(item.file);
        const img = kind === "jpg" ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);

        if (pageSize === "fit") {
          const page = pdf.addPage([width * PX_TO_PT, height * PX_TO_PT]);
          page.drawImage(img, { x: 0, y: 0, width: width * PX_TO_PT, height: height * PX_TO_PT });
        } else {
          const landscape = width > height;
          const pw = landscape ? A4.h : A4.w;
          const ph = landscape ? A4.w : A4.h;
          const page = pdf.addPage([pw, ph]);
          const scale = Math.min((pw - margin * 2) / width, (ph - margin * 2) / height);
          const dw = width * scale;
          const dh = height * scale;
          page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
        }
      }
      const out = await pdf.save();
      const name = items.length === 1 ? baseName(items[0].file.name) : "gambar-gabungan";
      saveAs(new Blob([out as Uint8Array<ArrayBuffer>], { type: "application/pdf" }), `${name}.pdf`);
    } catch (err: unknown) {
      setErrorMessage(`Gagal membuat PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <FileImage className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Gambar ke PDF</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Gabungkan foto atau hasil scan dari HP menjadi satu file PDF. Atur urutannya, lalu unduh.
        </p>
      </div>

      <AnimatePresence>{errorMessage && (
        <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-start gap-3 text-sky-800 dark:text-sky-200 text-sm">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs ml-2">
            Tutup
          </button>
        </motion.div>
      )}</AnimatePresence>

      <div className="space-y-6">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
<div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-2 p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
              : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-sky-400"
          }`}
        >
          <input {...getInputProps()} />
          <motion.div animate={{ y: isDragActive ? -8 : [0, -4, 0], scale: isDragActive ? 1.2 : 1 }} transition={isDragActive ? { type: "spring", stiffness: 300 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}><UploadCloud className="w-9 h-9 text-sky-500" /></motion.div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Lepaskan gambar di sini" : "Tarik & lepas gambar, atau klik untuk memilih"}
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">JPG, PNG, WebP — satu gambar menjadi satu halaman</p>
        </div>
</motion.div>

        {items.length > 0 && (
          <>
            <ul className="space-y-2">
<AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.li layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-700/70"
                >
                  <span className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={item.file.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{formatBytes(item.file.size)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || isWorking}
                      title="Naikkan"
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1 || isWorking}
                      title="Turunkan"
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      disabled={isWorking}
                      title="Hapus"
                      className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
</ul>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700/70 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Ukuran halaman</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPageSize("a4")} className={segBtn(pageSize === "a4")}>
                    A4
                  </button>
                  <button type="button" onClick={() => setPageSize("fit")} className={segBtn(pageSize === "fit")}>
                    Sesuai gambar
                  </button>
                </div>
              </div>
              {pageSize === "a4" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Margin</label>
                  <div className="flex gap-2">
                    {(
                      [
                        [0, "Tanpa"],
                        [24, "Kecil"],
                        [48, "Besar"],
                      ] as const
                    ).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setMargin(val)} className={segBtn(margin === val)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreate}
                disabled={isWorking}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors"
              >
                {isWorking ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
                {isWorking ? "Membuat PDF..." : `Buat PDF (${items.length} halaman)`}
              </button>
              <button
                onClick={reset}
                disabled={isWorking}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
