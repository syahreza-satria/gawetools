"use client";

import { useState } from "react";
import JSZip from "jszip";
import { ArrowDownToLine, FileText, ImageIcon, Loader2, MapPin, PackageOpen, RefreshCw, ShieldOff, Trash2, TriangleAlert } from "lucide-react";
import { readMetadata, stripPdfMetadata, type FileMetadata } from "@/lib/metadata";
import { baseName, formatBytes, renderBitmap, extFor, type OutputMime } from "@/lib/image";
import { saveAs } from "@/lib/download";
import { fileKind } from "@/lib/tools";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { yieldToUi } from "@/lib/yieldToUi";
import ContinueMenu from "@/components/ContinueMenu";
import { ActionBar, Card, ErrorBanner, FileDropzone, ToolHeader, primaryBtnCls, secondaryBtnCls } from "@/components/tool-ui";

interface Item {
  id: string;
  file: File;
  kind: "pdf" | "image";
  meta: FileMetadata | "error" | null; // null while reading
}

interface Output {
  id: string;
  name: string;
  blob: Blob;
  kind: "pdf" | "image";
  from: number;
}

const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function imageMime(file: File): OutputMime {
  if (file.type === "image/png" || file.type === "image/webp") return file.type;
  return "image/jpeg";
}

export default function RemoveMetadataPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: File[]) => {
    const added: Item[] = [];
    for (const file of files) {
      const kind = fileKind(file);
      if (kind !== "pdf" && kind !== "image") continue;
      added.push({ id: Math.random().toString(36).slice(2, 10), file, kind, meta: null });
    }
    if (added.length === 0) return;
    setOutputs([]);
    setItems((prev) => [...prev, ...added]);
    for (const item of added) {
      readMetadata(item.file, item.kind).then(
        (meta) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, meta } : i))),
        () => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, meta: "error" } : i)))
      );
    }
  };

  // Images pasted from the clipboard / handed over by an image tool (PDFs come through the dropzone).
  useIncomingFiles("image", addFiles, isWorking);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOutputs([]);
  };

  const reset = () => {
    setItems([]);
    setOutputs([]);
    setError(null);
  };

  const run = async () => {
    setIsWorking(true);
    setError(null);
    const out: Output[] = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress("Membersihkan " + (i + 1) + " dari " + items.length + ": " + item.file.name);
        if (item.kind === "pdf") {
          const bytes = await stripPdfMetadata(item.file);
          out.push({
            id: item.id,
            name: baseName(item.file.name) + "_bersih.pdf",
            blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }),
            kind: "pdf",
            from: item.file.size,
          });
        } else {
          // Re-drawing through a canvas drops EXIF/GPS; "from-image" keeps the photo upright.
          const bitmap = await createImageBitmap(item.file, { imageOrientation: "from-image" });
          try {
            const mime = imageMime(item.file);
            const blob = await renderBitmap(bitmap, bitmap.width, bitmap.height, mime, 0.92);
            out.push({ id: item.id, name: baseName(item.file.name) + "_bersih." + extFor(mime), blob, kind: "image", from: item.file.size });
          } finally {
            bitmap.close();
          }
        }
        await yieldToUi();
      }
      setOutputs(out);
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus metadata: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    outputs.forEach((o) => zip.file(o.name, o.blob));
    saveAs(await zip.generateAsync({ type: "blob" }), "metadata_dihapus.zip");
  };

  const withGps = items.filter((i) => typeof i.meta === "object" && i.meta?.hasGps).length;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<ShieldOff className="w-6 h-6" />}
        title="Hapus Metadata"
        description="Lihat dan hapus data tersembunyi (EXIF, lokasi GPS, penulis, aplikasi) dari foto dan PDF sebelum dibagikan."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {items.length === 0 && (
        <FileDropzone
          kind="pdf"
          accept={ACCEPT}
          multiple
          icon={<ShieldOff className="w-7 h-7" />}
          onFiles={addFiles}
          onReject={setError}
          title="Tarik & Lepas PDF atau Gambar ke Sini"
          hint="PDF, JPG, PNG, atau WebP — bisa banyak file sekaligus"
        />
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          {withGps > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-3 text-amber-200 text-sm">
              <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                {withGps} foto menyimpan <strong>koordinat GPS</strong>. Siapa pun yang menerima file aslinya bisa melihat lokasi pengambilan foto.
              </div>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const out = outputs.find((o) => o.id === item.id);
              return (
                <Card key={item.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
                        {item.kind === "pdf" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatBytes(item.file.size)}
                          {out ? " → " + formatBytes(out.blob.size) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {out && (
                        <button
                          type="button"
                          onClick={() => saveAs(out.blob, out.name)}
                          title="Download"
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={isWorking}
                        title="Hapus dari daftar"
                        className="p-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-xs">
                    <p className="label-mono text-zinc-400 mb-2">{out ? "Metadata sudah dihapus" : "Metadata ditemukan"}</p>
                    {item.meta === null && (
                      <p className="flex items-center gap-2 text-zinc-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca...
                      </p>
                    )}
                    {item.meta === "error" && <p className="text-zinc-400">Tidak bisa dibaca, tetapi file tetap bisa dibersihkan.</p>}
                    {typeof item.meta === "object" && item.meta && item.meta.entries.length === 0 && (
                      <p className="text-zinc-400">Tidak ada metadata yang terdeteksi.</p>
                    )}
                    {typeof item.meta === "object" && item.meta && item.meta.entries.length > 0 && (
                      <dl className={"grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 " + (out ? "opacity-50 line-through decoration-zinc-500" : "")}>
                        {item.meta.entries.map((e) => (
                          <div key={e.label + e.value} className="contents">
                            <dt className="text-zinc-400">{e.label}</dt>
                            <dd className="text-zinc-200 break-words flex items-center gap-1.5">
                              {e.label === "Koordinat GPS" && <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              {e.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <ActionBar note="Gambar digambar ulang tanpa EXIF (kualitas 0,92). PDF dikosongkan field info dan XMP-nya.">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {outputs.length > 0 ? (
                <>
                  {outputs.length > 1 && (
                    <button type="button" onClick={downloadZip} className={primaryBtnCls}>
                      <PackageOpen className="w-4 h-4" />
                      Download ZIP
                    </button>
                  )}
                  {outputs.length === 1 && (
                    <button type="button" onClick={() => saveAs(outputs[0].blob, outputs[0].name)} className={primaryBtnCls}>
                      <ArrowDownToLine className="w-4 h-4" />
                      Download
                    </button>
                  )}
                  {outputs.every((o) => o.kind === outputs[0].kind) && (
                    <ContinueMenu kind={outputs[0].kind} files={outputs.map((o) => ({ blob: o.blob, name: o.name }))} />
                  )}
                  <button type="button" onClick={reset} className={secondaryBtnCls + " !py-2.5"}>
                    <RefreshCw className="w-4 h-4" />
                    Mulai Lagi
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={reset} disabled={isWorking} className={secondaryBtnCls + " !py-2.5"}>
                    Hapus Semua
                  </button>
                  <button type="button" onClick={run} disabled={isWorking} className={primaryBtnCls}>
                    {isWorking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="max-w-56 truncate">{progress || "Memproses..."}</span>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-4 h-4" />
                        <span>Hapus Metadata</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
