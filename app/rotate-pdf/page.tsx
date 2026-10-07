"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "@/lib/download";
import * as pdfjsLib from "pdfjs-dist";
import {
  RotateCw,
  RotateCcw,
  ArrowDownToLine,
  AlertCircle,
  Loader2,
  UploadCloud,
  RefreshCw,
  FileText,
} from "lucide-react";
import { baseName, formatBytes } from "@/lib/image";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

const THUMB_BOX = 150;

function RotatableThumb({
  pdfDoc,
  pageNumber,
  rotation,
  onRotate,
}: {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  onRotate: (delta: 90 | -90) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        // Longest side = THUMB_BOX so the page still fits the box when rotated 90°
        const viewport = page.getViewport({ scale: THUMB_BOX / Math.max(base.width, base.height) });
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (err) {
        if (!cancelled) console.error(`Gagal merender halaman ${pageNumber}:`, err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs p-2 flex flex-col items-center gap-2">
      <div
        className="w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-700/70 overflow-hidden"
        style={{ height: THUMB_BOX + 16 }}
      >
        <canvas
          ref={canvasRef}
          className="rounded shadow-sm transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => onRotate(-90)}
          title="Putar ke kiri"
          className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
          Hal. {pageNumber}
          {rotation !== 0 && ` · ${rotation}°`}
        </span>
        <button
          onClick={() => onRotate(90)}
          title="Putar ke kanan"
          className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [rotations, setRotations] = useState<number[]>([]); // 0 | 90 | 180 | 270 per page
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void (pdfDoc as unknown as { destroy?: () => Promise<void> } | null)?.destroy?.();
    };
  }, [pdfDoc]);

  const onDrop = useCallback(async (accepted: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }
    const picked = accepted[0];
    if (!picked) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = new Uint8Array(await picked.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      setPdfDoc(doc);
      setRotations(Array(doc.numPages).fill(0));
      setFile(picked);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        /password/i.test(msg)
          ? "PDF ini terkunci password. Buka kuncinya dulu lewat alat 'Buka Kunci PDF'."
          : `Gagal membaca PDF: ${msg}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isLoading || isSaving,
  });

  const rotatePage = (index: number, delta: number) =>
    setRotations((prev) => prev.map((r, i) => (i === index ? (((r + delta) % 360) + 360) % 360 : r)));

  const rotateAll = (delta: number) => setRotations((prev) => prev.map((r) => (((r + delta) % 360) + 360) % 360));

  const reset = () => {
    setFile(null);
    setPdfDoc(null);
    setRotations([]);
    setErrorMessage(null);
  };

  const changed = rotations.some((r) => r !== 0);

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      doc.getPages().forEach((page, i) => {
        const extra = rotations[i] ?? 0;
        if (extra !== 0) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
      });
      const out = await doc.save();
      saveAs(new Blob([out as Uint8Array<ArrayBuffer>], { type: "application/pdf" }), `${baseName(file.name)}_rotated.pdf`);
    } catch (err: unknown) {
      setErrorMessage(`Gagal menyimpan PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <RotateCw className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Putar PDF</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Putar semua halaman sekaligus atau per halaman, lalu simpan sebagai PDF baru.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-start gap-3 text-sky-800 dark:text-sky-200 text-sm">
          <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs ml-2">
            Tutup
          </button>
        </div>
      )}

      {!file || !pdfDoc ? (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-2 p-12 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
              : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-sky-400"
          }`}
        >
          <input {...getInputProps()} />
          {isLoading ? <Loader2 className="w-9 h-9 text-sky-500 animate-spin" /> : <UploadCloud className="w-9 h-9 text-sky-500" />}
          <p className="font-semibold text-gray-900 dark:text-white">
            {isLoading ? "Membaca PDF..." : isDragActive ? "Lepaskan PDF di sini" : "Tarik & lepas PDF, atau klik untuk memilih"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {formatBytes(file.size)} · {pdfDoc.numPages} halaman
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => rotateAll(-90)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:border-sky-400 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Semua kiri
              </button>
              <button
                onClick={() => rotateAll(90)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:border-sky-400 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Semua kanan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rotations.map((rot, i) => (
              <RotatableThumb key={i} pdfDoc={pdfDoc} pageNumber={i + 1} rotation={rot} onRotate={(d) => rotatePage(i, d)} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !changed}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
              {isSaving ? "Menyimpan..." : changed ? "Simpan PDF" : "Putar halaman terlebih dahulu"}
            </button>
            <button
              onClick={reset}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw className="w-4 h-4" />
              Ganti File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
