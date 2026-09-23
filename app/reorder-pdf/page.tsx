"use client";

import { useState, useCallback, useId, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutGrid,
  FileText,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GripVertical,
  X,
} from "lucide-react";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

interface PageItem {
  id: string;
  originalIndex: number; // 0-based original page index in the PDF
  label: string;         // display label e.g. "Hal. 3"
  thumbnailUrl: string | null;
}

// Renders a single PDF page to a data URL for use as a thumbnail
async function renderPageThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number // 0-based
): Promise<string> {
  const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs is 1-based
  const unscaled = page.getViewport({ scale: 1.0 });
  const targetWidth = 160;
  const scale = targetWidth / unscaled.width;
  const vp = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.75);
}

// ─── Sortable Page Card ────────────────────────────────────────────────────────

function SortablePageCard({
  item,
  order,
  onRemove,
  disabled,
  isOverlay = false,
}: {
  item: PageItem;
  order: number; // 1-based display order
  onRemove: (id: string) => void;
  disabled: boolean;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.35 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex flex-col rounded-xl border-2 overflow-hidden transition-all select-none bg-white dark:bg-zinc-950 ${
        isDragging && !isOverlay
          ? "border-sky-400/60 shadow-lg"
          : isOverlay
          ? "border-sky-500 shadow-2xl ring-2 ring-sky-400/40 scale-[1.03]"
          : "border-gray-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700"
      }`}
    >
      {/* Drag handle + page thumbnail */}
      <div
        {...attributes}
        {...listeners}
        className={`relative w-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden ${
          disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{ minHeight: 130 }}
        title="Tahan & geser untuk mengubah urutan"
      >
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.label}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 py-8 text-gray-300 dark:text-zinc-700">
            <FileText className="w-8 h-8" />
            <span className="text-[10px]">Memuat...</span>
          </div>
        )}

        {/* Drag indicator overlay */}
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-sky-500/10 pointer-events-none">
            <GripVertical className="w-6 h-6 text-sky-500 drop-shadow" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0">
            {order}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
            {item.label}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          disabled={disabled}
          title="Hapus halaman ini"
          className="p-1 rounded-md text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:pointer-events-none shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReorderPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keep a pdfjs ref for thumbnail rendering
  const pdfjsDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Load PDF ──
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setErrorMessage("Hanya 1 file PDF yang diperbolehkan.");
      return;
    }
    const picked = acceptedFiles[0];
    if (!picked) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResultBlob(null);
    setPages([]);

    try {
      const arrayBuffer = await picked.arrayBuffer();

      // Load with pdfjs for thumbnails
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      pdfjsDocRef.current = pdfDoc;

      const count = pdfDoc.numPages;
      setFile(picked);

      // Build initial page list without thumbnails first (faster initial render)
      const initialPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i}-${Math.random().toString(36).slice(2, 8)}`,
        originalIndex: i,
        label: `Hal. ${i + 1}`,
        thumbnailUrl: null,
      }));
      setPages(initialPages);

      // Render thumbnails progressively
      for (let i = 0; i < count; i++) {
        const url = await renderPageThumbnail(pdfDoc, i);
        setPages((prev) =>
          prev.map((p) => (p.originalIndex === i && p.thumbnailUrl === null ? { ...p, thumbnailUrl: url } : p))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal membuka PDF: ${msg}`);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // ── DnD handlers ──
  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
    setResultBlob(null);
  };

  const handleRemove = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    setResultBlob(null);
  };

  const handleReset = () => {
    (pdfjsDocRef.current as unknown as { destroy?: () => void })?.destroy?.();
    pdfjsDocRef.current = null;
    setFile(null);
    setPages([]);
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText("");
  };

  // ── Save ──
  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);
    setResultBlob(null);
    setProgressText("Memuat PDF asli...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      setProgressText("Menyusun ulang halaman...");
      const pageIndices = pages.map((p) => p.originalIndex);
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      for (const page of copiedPages) newDoc.addPage(page);

      setProgressText("Menyimpan PDF...");
      const bytes = await newDoc.save();
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const baseName = file.name.replace(/\.pdf$/i, "");
      const filename = `${baseName}_reordered.pdf`;

      setResultBlob(blob);
      setResultFilename(filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal menyimpan PDF: ${msg}`);
    } finally {
      setIsSaving(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (resultBlob) saveAs(resultBlob, resultFilename);
  };

  const activeItem = pages.find((p) => p.id === activeId) ?? null;
  const removedCount = file
    ? Math.round(
        (1 - pages.length / (pdfjsDocRef.current?.numPages ?? pages.length)) * 100
      )
    : 0;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Atur & Hapus Halaman PDF
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto">
          Susun ulang urutan halaman dengan drag & drop, atau hapus halaman yang tidak diperlukan —
          semuanya langsung di browser.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
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

      {/* Success Result Banner */}
      {resultBlob && (
        <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  PDF siap didownload!
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {pages.length} halaman · {formatBytes(resultBlob.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                File Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!file && (
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
              <LayoutGrid className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isLoading
              ? "Memuat halaman PDF..."
              : isDragActive
              ? "Lepaskan file PDF di sini"
              : "Tarik & Lepas File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
            atau klik untuk memilih — satu file PDF
          </p>
          {!isLoading && (
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Pilih File PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page Editor */}
      {file && pages.length > 0 && (
        <div className="space-y-5">
          {/* Info bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  <span>{formatBytes(file.size)}</span>
                  <span>·</span>
                  <span>{pages.length} halaman aktif</span>
                  {removedCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {pdfjsDocRef.current
                          ? pdfjsDocRef.current.numPages - pages.length
                          : ""}{" "}
                        dihapus
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">
                Geser kartu untuk mengubah urutan
              </span>
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Ganti File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DnD Grid */}
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {pages.map((page, index) => (
                  <SortablePageCard
                    key={page.id}
                    item={page}
                    order={index + 1}
                    onRemove={handleRemove}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag Overlay — renders a floating clone while dragging */}
            <DragOverlay adjustScale={false}>
              {activeItem && (
                <SortablePageCard
                  item={activeItem}
                  order={pages.findIndex((p) => p.id === activeItem.id) + 1}
                  onRemove={() => {}}
                  disabled={false}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>

          {/* Empty pages warning */}
          {pages.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-zinc-600 text-sm">
              Semua halaman dihapus. Tambahkan kembali atau ganti file.
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {isSaving ? progressText : "Proses sepenuhnya di browser — file tidak pernah dikirim ke server."}
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || pages.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Simpan PDF ({pages.length} hal.)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
