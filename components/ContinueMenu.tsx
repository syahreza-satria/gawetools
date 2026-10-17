"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { saveHandoff } from "@/lib/handoff";
import { toolsAccepting, type FileKind } from "@/lib/tools";

interface ContinueMenuProps {
  /** Result file(s) to pass on to the next tool. */
  files: { blob: Blob; name: string }[];
  kind: FileKind;
}

/** "Lanjut ke…" button: sends the result to another tool without downloading and re-uploading it. */
export default function ContinueMenu({ files, kind }: ContinueMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tools = toolsAccepting(kind, pathname);

  const go = async (href: string) => {
    setBusy(true);
    setFailed(false);
    try {
      await saveHandoff(files);
      router.push(`${href}?from=handoff`);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-300 font-medium text-sm hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Lanjut ke…
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 w-60 max-h-72 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl"
        >
          {tools.map((t) => (
            <button
              key={t.href}
              type="button"
              role="menuitem"
              onClick={() => go(t.href)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-zinc-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {failed && (
        <p className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-max text-xs text-sky-700 dark:text-sky-300">
          Gagal meneruskan file. Unduh dulu lalu unggah manual.
        </p>
      )}
    </div>
  );
}
