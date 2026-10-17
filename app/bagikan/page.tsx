"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ImageIcon, Share2, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { peekHandoff, takeHandoff, type HandoffInfo } from "@/lib/handoff";
import { fileKind, toolsAccepting, type FileKind } from "@/lib/tools";
import { formatBytes } from "@/lib/image";

const KIND_LABEL: Record<FileKind, string> = {
  pdf: "Alat untuk PDF",
  image: "Alat untuk gambar",
  heic: "Alat untuk foto HEIC",
};

export default function BagikanPage() {
  const [files, setFiles] = useState<HandoffInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    peekHandoff()
      .then((list) => !cancelled && setFiles(list))
      .catch(() => !cancelled && setFiles([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const discard = async () => {
    try {
      await takeHandoff();
    } catch {}
    setFiles([]);
  };

  const kinds = Array.from(new Set((files ?? []).map(fileKind).filter((k): k is FileKind => k !== null)));

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="mb-10 border-b border-zinc-900 pb-8 text-left">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 text-white mb-5">
          <Share2 className="w-6 h-6" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-medium leading-[1.04] text-white">File Dibagikan</h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl">
          Pilih alat untuk memproses file yang Anda bagikan ke GaweTools. File tetap berada di perangkat ini.
        </p>
      </div>

      {files === null ? (
        <div className="flex justify-center py-12 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-700/70 text-center text-sm text-zinc-400">
          Belum ada file yang dibagikan, atau file sudah kedaluwarsa (disimpan maksimal 10 menit). Bagikan file PDF atau gambar
          dari aplikasi lain ke GaweTools, atau{" "}
          <Link href="/" className="font-semibold text-sky-400 hover:underline">
            buka beranda
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-6">
          <ul className="space-y-2">
            {files.map((f, i) => {
              const kind = fileKind(f);
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-700/70"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
                    {kind === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-xs text-zinc-400">{formatBytes(f.size)}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {kinds.map((kind) => (
            <section key={kind}>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">{KIND_LABEL[kind]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {toolsAccepting(kind).map((t) => (
                  <Link
                    key={t.href}
                    href={`${t.href}?from=handoff`}
                    className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-700/70 hover:border-sky-500/60 transition-colors"
                  >
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-sky-400 transition-colors">
                      {t.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <div className="text-center">
            <button
              type="button"
              onClick={discard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Buang file yang dibagikan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
