"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Trash2, X, ShieldCheck, FileText } from "lucide-react";
import { clearHistory, listHistory, removeHistory, TOOL_LABELS, type HistoryEntry } from "@/lib/history";
import { formatBytes } from "@/lib/image";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    listHistory()
      .then((list) => active && setEntries(list))
      .catch(() => active && setEntries([]));
    return () => {
      active = false;
    };
  }, []);

  const handleRemove = async (id: number) => {
    await removeHistory(id);
    setEntries((prev) => prev?.filter((e) => e.id !== id) ?? null);
  };

  const handleClear = async () => {
    await clearHistory();
    setEntries([]);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
          <History className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Riwayat Unduhan</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto flex items-start justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0 mt-1" />
          <span>Hanya nama file, ukuran, dan waktu yang dicatat — tersimpan di perangkat ini saja, isi file tidak disimpan.</span>
        </p>
      </div>

      {entries === null ? null : entries.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Belum ada riwayat. Hasil yang Anda unduh akan muncul di sini.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-semibold text-sky-500 hover:underline">
            Lihat semua alat
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">{entries.length} file terakhir</span>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus semua
            </button>
          </div>
          <ul className="space-y-2">
<AnimatePresence initial={false}>
            {entries.map((e) => (
              <motion.li layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
                key={e.id}
                className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-700/70"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={e.filename}>
                    {e.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    <Link href={e.tool} className="text-sky-600 dark:text-sky-400 hover:underline">
                      {TOOL_LABELS[e.tool] ?? e.tool}
                    </Link>
                    {e.size > 0 && ` · ${formatBytes(e.size)}`} · {dateFmt.format(e.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(e.id!)}
                  title="Hapus dari riwayat"
                  className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
</ul>
        </div>
      )}
    </div>
  );
}
