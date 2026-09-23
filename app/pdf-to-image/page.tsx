"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileImage,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
  X,
  CheckSquare,
  Square,
} from "lucide-react";

// Configure pdfjs worker
if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type ScaleLevel = "low" | "medium" | "high" | "ultra";

interface ScaleOption {
  id: ScaleLevel;
  label: string;
  desc: string;
  value: number;
}

interface FormatOption {
  value: OutputFormat;
  label: string;
  ext: string;
}

interface PageResult {
  pageNumber: number;
  blob: Blob;
  previewUrl: string;
  filename: string;
  width: number;
  height: number;
}

const SCALE_OPTIONS: ScaleOption[] = [
  { id: "low", label: "Rendah (1×)", desc: "72 dpi · file lebih kecil", value: 1.0 },
  { id: "medium", label: "Sedang (1.5×)", desc: "108 dpi · rekomendasi", value: 1.5 },
  { id: "high", label: "Tinggi (2×)", desc: "144 dpi · kualitas bagus", value: 2.0 },
  { id: "ultra", label: "Ultra (3×)", desc: "216 dpi · sangat tajam", value: 3.0 },
];

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// Renders a single PDF page to a Blob at the given scale and format
async function renderPageToBlob(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  format: OutputFormat,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal membuat canvas context");

  // White background for JPEG/WebP (PDF pages may be transparent)
  if (format !== "image/png") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  return new Promise((resolve, reject) => {
    const q = format === "image/png" ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error(`Gagal mengekspor halaman ${pageNumber}`));
        resolve({ blob, width: canvas.width, height: canvas.height });
      },
      format,
      q
    );
  });
}

// Thumbnail canvas component (inline to keep file self-contained)
function PageThumbnailCanvas({
  pdfDoc,
  pageNumber,
  isSelected,
  onToggle,
}: {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState(false);

  // Render thumbnail on mount
  const canvasCallback = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
      if (!canvas || rendered) return;

      void (async () => {
        try {
          const page = await pdfDoc.getPage(pageNumber);
          const unscaled = page.getViewport({ scale: 1.0 });
          const scale = 160 / unscaled.width;
          const vp = page.getViewport({ scale });
          canvas.width = Math.round(vp.width);
          canvas.height = Math.round(vp.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
          setRendered(true);
        } catch {
          // silently ignore thumbnail errors
        }
      })();
    },
    [pdfDoc, pageNumber, rendered]
  );

  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-xl border-2 transition-all select-none overflow-hidden group ${
        isSelected
          ? "border-sky-500 ring-2 ring-sky-500/30 bg-sky-50/30 dark:bg-sky-950/20"
          : "border-gray-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700 bg-white dark:bg-zinc-950"
      }`}
    >
      {/* Checkbox indicator */}
      <div
        className={`absolute top-2 left-2 z-10 transition-all ${
          isSelected ? "text-sky-500" : "text-gray-300 dark:text-zinc-600 group-hover:text-sky-400"
        }`}
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 drop-shadow-sm" />
        ) : (
          <Square className="w-5 h-5 drop-shadow-sm" />
        )}
      </div>

      {/* Canvas */}
      <div className="w-full flex items-center justify-center min-h-[130px] bg-slate-50 dark:bg-zinc-900 p-2">
        <canvas
          ref={canvasCallback}
          className="max-w-full h-auto object-contain rounded shadow-xs"
        />
      </div>

      {/* Page label */}
      <div className="py-1.5 text-center text-[11px] font-semibold text-gray-600 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800">
        Hal. {pageNumber}
      </div>
    </div>
  );
}

export default function PdfToImagePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [scale, setScale] = useState<ScaleLevel>("medium");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<PageResult[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setErrorMessage("Hanya file PDF yang diperbolehkan.");
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;

      setIsLoading(true);
      setErrorMessage(null);
      setResults([]);
      setSelectedPages(new Set());

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const doc = await loadingTask.promise;
        setPdfFile(file);
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        // Select all pages by default
        setSelectedPages(new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
      } catch {
        setErrorMessage("Gagal memuat PDF. Pastikan file tidak rusak atau terenkripsi.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
    setResults([]);
  };

  const selectAll = () => {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
    setResults([]);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
    setResults([]);
  };

  const handleReset = () => {
    (pdfDoc as unknown as { destroy?: () => void })?.destroy?.();
    setPdfFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setSelectedPages(new Set());
    setResults([]);
    setErrorMessage(null);
    setProgressText("");
  };

  const handleConvert = async () => {
    if (!pdfDoc || selectedPages.size === 0) return;

    setIsConverting(true);
    setErrorMessage(null);
    setResults([]);

    const scaleOpt = SCALE_OPTIONS.find((s) => s.id === scale)!;
    const fmtOpt = FORMAT_OPTIONS.find((f) => f.value === outputFormat)!;
    const quality = 0.92; // JPEG/WebP quality
    const baseName = pdfFile!.name.replace(/\.pdf$/i, "");
    const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
    const newResults: PageResult[] = [];

    try {
      for (let i = 0; i < sortedPages.length; i++) {
        const pageNum = sortedPages[i];
        setProgressText(
          `Mengkonversi halaman ${i + 1} dari ${sortedPages.length} (Hal. ${pageNum})`
        );
        const { blob, width, height } = await renderPageToBlob(
          pdfDoc,
          pageNum,
          scaleOpt.value,
          outputFormat,
          quality
        );
        const previewUrl = URL.createObjectURL(blob);
        newResults.push({
          pageNumber: pageNum,
          blob,
          previewUrl,
          filename: `${baseName}_halaman_${String(pageNum).padStart(3, "0")}.${fmtOpt.ext}`,
          width,
          height,
        });
      }
      setResults(newResults);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal mengkonversi: ${msg}`);
    } finally {
      setIsConverting(false);
      setProgressText("");
    }
  };

  const handleDownloadSingle = (result: PageResult) => {
    saveAs(result.blob, result.filename);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.filename, r.blob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const baseName = pdfFile!.name.replace(/\.pdf$/i, "");
    saveAs(zipBlob, `${baseName}_gambar.zip`);
  };

  const totalSize = results.reduce((s, r) => s + r.blob.size, 0);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <FileImage className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          PDF ke Gambar
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Konversi halaman PDF menjadi gambar JPEG, PNG, atau WebP secara instan di browser tanpa
          upload ke server.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:underline font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-8 space-y-4">
          {/* Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    {results.length} halaman berhasil dikonversi!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Total ukuran: {formatBytes(totalSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all"
                  >
                    <PackageOpen className="w-4 h-4" />
                    Download ZIP
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Konversi File Lain
                </button>
              </div>
            </div>
          </div>

          {/* Image results grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((r) => (
              <div
                key={r.pageNumber}
                className="group bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.previewUrl}
                  alt={`Halaman ${r.pageNumber}`}
                  className="w-full h-36 object-contain bg-slate-50 dark:bg-zinc-900"
                />
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                      Halaman {r.pageNumber}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      {r.width}×{r.height} · {formatBytes(r.blob.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(r)}
                    title="Download"
                    className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors shrink-0"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload zone — shown when no PDF loaded and no results */}
      {!pdfDoc && results.length === 0 && (
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
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <FileImage className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isLoading
              ? "Memuat PDF..."
              : isDragActive
              ? "Lepaskan PDF di sini"
              : "Tarik & Lepas File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih — hanya file PDF (satu file)
          </p>
          {!isLoading && (
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
              >
                <FileImage className="w-4 h-4" />
                Pilih PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page selection & settings — shown after PDF is loaded, before converting */}
      {pdfDoc && results.length === 0 && (
        <div className="space-y-6">
          {/* PDF info bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileImage className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {pdfFile!.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {formatBytes(pdfFile!.size)} · {pageCount} halaman
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 ml-3"
              title="Hapus & Ganti File"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Page selection */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Pilih Halaman
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-zinc-400">
                  ({selectedPages.size} dari {pageCount} dipilih)
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-gray-300 dark:text-zinc-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:underline"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                <PageThumbnailCanvas
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  isSelected={selectedPages.has(pageNum)}
                  onToggle={() => togglePage(pageNum)}
                />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-5">
            {/* Format output */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Format Output
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => setOutputFormat(fmt.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      outputFormat === fmt.value
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500"
                        : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
              {outputFormat === "image/png" && (
                <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                  PNG adalah format lossless, cocok untuk transparansi. Ukuran file lebih besar dari JPEG/WebP.
                </p>
              )}
            </div>

            {/* Scale / Resolution */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Resolusi Output
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setScale(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      scale === opt.id
                        ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-1 ring-sky-500"
                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <p className="font-semibold text-xs text-gray-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-tight mt-0.5">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Proses dijalankan langsung di perangkat Anda tanpa upload file.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverting || selectedPages.size === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="max-w-[200px] truncate">{progressText || "Mengkonversi..."}</span>
                  </>
                ) : (
                  <>
                    <FileImage className="w-4 h-4" />
                    <span>
                      Konversi {selectedPages.size > 1 ? `${selectedPages.size} Halaman` : "Halaman"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
