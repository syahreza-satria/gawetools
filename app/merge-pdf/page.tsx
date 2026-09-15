"use client";

import { useState, useCallback, useId } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Files,
  FileText,
  GripVertical,
  Trash2,
  Plus,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  FileStack,
} from "lucide-react";

interface PDFItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  pageCount?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function SortablePDFItem({
  item,
  index,
  onRemove,
  disabled,
}: {
  item: PDFItem;
  index: number;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center justify-between p-4 bg-white rounded-xl border transition-all duration-200 ${
        isDragging
          ? "border-red-500 shadow-xl ring-2 ring-red-400/30 opacity-95 scale-[1.01]"
          : "border-gray-200 shadow-xs hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          title="Tahan & geser untuk mengubah urutan"
          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors ${
            disabled ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <span className="w-7 h-7 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        <div className="w-10 h-10 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate max-w-xs sm:max-w-md md:max-w-lg" title={item.name}>
            {item.name}
          </p>
          <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5">
            <span>{item.sizeFormatted}</span>
            {item.pageCount !== undefined && (
              <>
                <span>•</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                  {item.pageCount} halaman
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          title="Hapus file ini"
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

export default function MergePdfPage() {
  const [items, setItems] = useState<PDFItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("dokumen-gabungan.pdf");
  const [totalPageResult, setTotalPageResult] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dndId = useId();

  const processIncomingFiles = useCallback(async (newFiles: File[]) => {
    setErrorMessage(null);
    setDownloadUrl(null);

    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));

    if (pdfFiles.length === 0) return;

    const newItems: PDFItem[] = [];

    for (const file of pdfFiles) {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`;
      let pageCount: number | undefined = undefined;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
      } catch (err) {
        console.warn("Could not read page count for", file.name, err);
      }

      newItems.push({
        id,
        file,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        pageCount,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejectedNames = fileRejections.map((r) => r.file.name).join(", ");
        setErrorMessage(`Hanya file PDF yang diperbolehkan. File ditolak: ${rejectedNames}`);
      }
      processIncomingFiles(acceptedFiles);
    },
    [processIncomingFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setErrorMessage(null);
    setDownloadUrl(null);
  };

  const handleClearAll = () => {
    setItems([]);
    setErrorMessage(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage("Minimal pilih 2 file PDF untuk bisa digabungkan.");
      return;
    }

    setIsMerging(true);
    setErrorMessage(null);
    setProgressText("Mempersiapkan dokumen baru...");

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPagesAdded = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgressText(`Menggabungkan (${i + 1}/${items.length}): ${item.name}...`);

        const arrayBuffer = await item.file.arrayBuffer();
        const sourceDoc = await PDFDocument.load(arrayBuffer);
        const pageIndices = sourceDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourceDoc, pageIndices);

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          totalPagesAdded++;
        }
      }

      setProgressText("Menyimpan dan mengompresi hasil...");
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const firstFileNameBase = items[0].name.replace(/\.[^/.]+$/, "");
      const outputName = `${firstFileNameBase}_merged_${items.length}_files.pdf`;

      setDownloadUrl(url);
      setDownloadFilename(outputName);
      setTotalPageResult(totalPagesAdded);
    } catch (err: unknown) {
      console.error("Gagal menggabungkan PDF:", err);
      const errDetail = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Terjadi kesalahan saat menggabungkan PDF: ${errDetail}`);
    } finally {
      setIsMerging(false);
      setProgressText("");
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 text-red-600 mb-3 shadow-xs">
          <Files className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Gabung PDF</h1>
        <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
          Satukan beberapa dokumen PDF menjadi satu urutan yang rapi. Drag & drop untuk mengubah susunan file sebelum digabung.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-semibold text-xs ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Success State with Download */}
      {downloadUrl && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-950">PDF Berhasil Digabungkan!</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Sebanyak <span className="font-semibold">{items.length} file</span> berhasil digabung menjadi{" "}
              <span className="font-semibold">{totalPageResult} halaman</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={downloadFilename}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 active:scale-98 transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              Download PDF ({downloadFilename})
            </a>
            <button
              onClick={() => {
                URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-medium text-sm hover:bg-emerald-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Gabung Lagi / Ubah
            </button>
          </div>
        </div>
      )}

      {/* Empty State / Initial Dropzone */}
      {items.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 bg-white ${
            isDragActive
              ? "border-red-500 bg-red-50/50 scale-[0.99] shadow-inner"
              : "border-gray-300 hover:border-red-400 hover:bg-red-50/20 shadow-xs"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <FileStack className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isDragActive ? "Lepaskan file PDF di sini" : "Tarik & Lepas File PDF ke Sini"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            atau klik tombol di bawah untuk memilih beberapa dokumen PDF sekaligus
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Pilih File PDF
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>File Anda 100% diproses secara lokal di browser</span>
          </div>
        </div>
      ) : (
        /* Populated State with List and Actions */
        <div className="space-y-6">
          {/* Top Bar with Add More and Clear */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                {items.length} file dipilih
              </span>
              <span className="text-xs text-gray-400">• Drag baris untuk ubah urutan</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div {...getRootProps()} className="flex-1 sm:flex-initial">
                <input {...getInputProps()} />
                <button
                  type="button"
                  disabled={isMerging}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  Tambah File
                </button>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isMerging}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500 hover:text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          {/* Draggable List */}
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2.5">
                {items.map((item, index) => (
                  <SortablePDFItem
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={handleRemove}
                    disabled={isMerging}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {/* Additional Mini Dropzone for convenience */}
          <div
            {...getRootProps()}
            className="border border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/20 transition-all text-xs text-gray-500"
          >
            <input {...getInputProps()} />
            <span>+ Klik atau drag file PDF tambahan ke sini</span>
          </div>

          {/* Bottom Action Footer */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              {items.length < 2 ? (
                <span className="text-amber-600 font-medium">
                  ⚠️ Tambahkan minimal 1 file lagi untuk menggabungkan.
                </span>
              ) : (
                <span>File akan digabung berurutan dari nomor 1 hingga {items.length}.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleMerge}
              disabled={items.length < 2 || isMerging}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/25 hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{progressText || "Menggabungkan PDF..."}</span>
                </>
              ) : (
                <>
                  <Files className="w-5 h-5" />
                  <span>Gabungkan {items.length} PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
