"use client";

import { useCallback, type ReactNode } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { AlertCircle, ArrowDownToLine, CheckCircle2, FileText, Loader2, RefreshCw, Trash2 } from "lucide-react";
import ContinueMenu from "@/components/ContinueMenu";
import { saveAs } from "@/lib/download";
import { formatBytes } from "@/lib/image";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import type { FileKind } from "@/lib/tools";

// Small building blocks shared by single-file tool pages.

export const inputCls =
  "w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

export const secondaryBtnCls =
  "inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm hover:bg-zinc-700 transition-colors";

export const primaryBtnCls =
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all disabled:opacity-50";

export function ToolHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-950/50 text-sky-400 mb-3 shadow-xs">
        {icon}
      </div>
      <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      <p className="mt-2 text-base text-zinc-400 max-w-xl mx-auto">{description}</p>
    </div>
  );
}

export function ErrorBanner({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="mb-6 p-4 rounded-xl bg-sky-950/40 border border-sky-900/60 flex items-start gap-3 text-sky-200 text-sm">
      <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
      <div className="flex-1">{message}</div>
      <button onClick={onClose} className="text-sky-400 hover:underline font-semibold text-xs ml-2">
        Tutup
      </button>
    </div>
  );
}

interface FileDropzoneProps {
  kind: FileKind;
  icon: ReactNode;
  onFiles: (files: File[]) => void;
  loading?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  onReject?: (message: string) => void;
  /** Extra accepted types on top of `kind` (e.g. PDF + images). */
  accept?: Record<string, string[]>;
  title?: string;
  hint?: string;
}

const ACCEPT: Record<FileKind, Record<string, string[]>> = {
  pdf: { "application/pdf": [".pdf"] },
  image: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
  heic: { "image/heic": [".heic"], "image/heif": [".heif"] },
};

/** Dropzone with click-to-pick, Ctrl+V paste and handoff-from-another-tool support built in. */
export function FileDropzone({
  kind,
  icon,
  onFiles,
  loading,
  disabled,
  multiple = false,
  onReject,
  accept,
  title,
  hint,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        onReject?.(kind === "pdf" && !accept ? "Hanya file PDF yang diperbolehkan." : "Format file tidak didukung.");
        if (accepted.length === 0) return;
      }
      onFiles(accepted);
    },
    [kind, accept, onFiles, onReject]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ?? ACCEPT[kind],
    multiple,
    disabled: disabled || loading,
  });

  useIncomingFiles(kind, onFiles, disabled || loading);

  const noun = kind === "pdf" ? "File PDF" : "Gambar";
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all bg-zinc-950 ${
        isDragActive ? "border-sky-500 bg-sky-950/30" : "border-zinc-800 hover:border-sky-400 hover:bg-sky-950/10"
      }`}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 rounded-xl bg-sky-950/50 text-sky-400 flex items-center justify-center mx-auto mb-4">
        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : icon}
      </div>
      <h3 className="text-base font-semibold text-white">
        {isDragActive ? "Lepaskan file di sini" : (title ?? `Tarik & Lepas ${noun} ke Sini`)}
      </h3>
      <p className="mt-1 text-sm text-zinc-400 max-w-sm mx-auto">
        {hint ?? "atau klik untuk memilih, bisa juga tempel dengan Ctrl+V"}
      </p>
    </div>
  );
}

export function FileCard({
  name,
  meta,
  onRemove,
  disabled,
  icon,
}: {
  name: string;
  meta: string;
  onRemove: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-700/70">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
          {icon ?? <FileText className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white truncate" title={name}>
            {name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{meta}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        title="Ganti file"
        className="p-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors disabled:opacity-40"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ResultCard({
  title,
  subtitle,
  blob,
  filename,
  kind = "pdf",
  extra,
  onBack,
  backLabel,
  onReset,
  resetLabel = "File Lain",
}: {
  title: string;
  subtitle?: string;
  blob: Blob;
  filename: string;
  kind?: "pdf" | "image";
  extra?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  onReset: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="mb-8 p-6 rounded-2xl bg-zinc-950 border border-emerald-900/50 text-center space-y-4 shadow-xs">
      <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{subtitle ?? formatBytes(blob.size)}</p>
      </div>
      {extra}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => saveAs(blob, filename)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 active:scale-98 transition-all"
        >
          <ArrowDownToLine className="w-5 h-5" />
          Download
        </button>
        <ContinueMenu kind={kind} files={[{ blob, name: filename }]} />
        {onBack && (
          <button onClick={onBack} className={secondaryBtnCls}>
            {backLabel ?? "Ubah Pengaturan"}
          </button>
        )}
        <button onClick={onReset} className={secondaryBtnCls}>
          <RefreshCw className="w-4 h-4" />
          {resetLabel}
        </button>
      </div>
    </div>
  );
}

export function ActionBar({ children, note = "Proses dijalankan langsung di perangkat Anda tanpa upload file." }: { children: ReactNode; note?: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-700/70">
      <span className="text-xs text-zinc-400">{note}</span>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-zinc-950 p-5 sm:p-6 rounded-xl border border-zinc-700/70 ${className}`}>{children}</div>;
}

export function SegmentedButtons<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`flex-1 min-w-24 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
            value === o.id ? "bg-sky-600 border-sky-600 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-sky-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
