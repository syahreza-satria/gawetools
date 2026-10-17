"use client";

import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { diffLines, diffWords } from "diff";
import { ArrowDown, ArrowUp, FileDiff, FileText, Loader2, Trash2 } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
import { extractPageText } from "@/lib/pdfText";
import { useIncomingFiles } from "@/lib/useIncomingFiles";
import { formatBytes } from "@/lib/image";
import { yieldToUi } from "@/lib/yieldToUi";
import { ActionBar, Card, ErrorBanner, ToolHeader, primaryBtnCls, secondaryBtnCls } from "@/components/tool-ui";

type Seg = { text: string; changed: boolean };
type Row = { kind: "same" | "change" | "del" | "add"; left?: Seg[]; right?: Seg[] };
interface PageDiff {
  page: number;
  rows: Row[];
  changes: number;
}

const whole = (text: string, changed: boolean): Seg[] => [{ text, changed }];

/** Pairs a removed block with the following added block line by line and highlights the differing words. */
function pairLines(removed: string[], added: string[]): Row[] {
  const rows: Row[] = [];
  const n = Math.max(removed.length, added.length);
  for (let i = 0; i < n; i++) {
    const a = removed[i];
    const b = added[i];
    if (a !== undefined && b !== undefined) {
      const left: Seg[] = [];
      const right: Seg[] = [];
      for (const part of diffWords(a, b)) {
        if (part.added) right.push({ text: part.value, changed: true });
        else if (part.removed) left.push({ text: part.value, changed: true });
        else {
          left.push({ text: part.value, changed: false });
          right.push({ text: part.value, changed: false });
        }
      }
      rows.push({ kind: "change", left, right });
    } else if (a !== undefined) rows.push({ kind: "del", left: whole(a, true) });
    else rows.push({ kind: "add", right: whole(b!, true) });
  }
  return rows;
}

function diffPage(page: number, a: string, b: string): PageDiff {
  const parts = diffLines(a, b, { ignoreWhitespace: true });
  const rows: Row[] = [];
  const lines = (v: string) => v.replace(/\n$/, "").split("\n");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.removed) {
      const next = parts[i + 1];
      if (next?.added) {
        rows.push(...pairLines(lines(part.value), lines(next.value)));
        i++;
      } else rows.push(...pairLines(lines(part.value), []));
    } else if (part.added) {
      rows.push(...pairLines([], lines(part.value)));
    } else {
      for (const line of lines(part.value)) rows.push({ kind: "same", left: whole(line, false), right: whole(line, false) });
    }
  }
  return { page, rows, changes: rows.filter((r) => r.kind !== "same").length };
}

function SegText({ segs, tone }: { segs?: Seg[]; tone: "del" | "add" }) {
  if (!segs) return <span className="select-none text-zinc-700">&nbsp;</span>;
  if (segs.length === 1 && segs[0].text === "") return <span>&nbsp;</span>;
  return (
    <>
      {segs.map((s, i) => (
        <span key={i} className={s.changed ? (tone === "del" ? "bg-red-500/25 text-red-100" : "bg-emerald-500/25 text-emerald-100") : ""}>
          {s.text}
        </span>
      ))}
    </>
  );
}

function Slot({
  label,
  source,
  disabled,
}: {
  label: string;
  source: ReturnType<typeof usePdfSource>;
  disabled: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => void source.load(files),
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: disabled || source.isLoading,
  });

  if (source.file) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="label-mono text-zinc-400">{label}</p>
            <p className="text-sm font-semibold text-white truncate" title={source.file.name}>
              {source.file.name}
            </p>
            <p className="text-xs text-zinc-400">
              {formatBytes(source.file.size)} · {source.pageCount} halaman
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={source.reset}
          disabled={disabled}
          title="Ganti file"
          className="p-2 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-950/30 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Card>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={
        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-zinc-950 " +
        (isDragActive ? "border-sky-500 bg-sky-950/30" : "border-zinc-800 hover:border-sky-400")
      }
    >
      <input {...getInputProps()} />
      <div className="w-12 h-12 rounded-xl bg-sky-950/50 text-sky-400 flex items-center justify-center mx-auto mb-3">
        {source.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
      </div>
      <p className="label-mono text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-400">Tarik PDF ke sini atau klik untuk memilih</p>
    </div>
  );
}

export default function ComparePdfPage() {
  const a = usePdfSource();
  const b = usePdfSource();
  const [diffs, setDiffs] = useState<PageDiff[] | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const cursorRef = useRef(-1);

  // Pasted / handed-off PDFs fill the first empty slot.
  useIncomingFiles(
    "pdf",
    (files) => {
      if (!a.file) void a.load(files);
      else if (!b.file) void b.load(files);
    },
    isWorking
  );

  const compare = async () => {
    if (!a.pdfDoc || !b.pdfDoc) return;
    setIsWorking(true);
    setError(null);
    setDiffs(null);
    cursorRef.current = -1;
    try {
      const total = Math.max(a.pageCount, b.pageCount);
      const out: PageDiff[] = [];
      for (let i = 1; i <= total; i++) {
        setProgress("Membandingkan halaman " + i + " dari " + total + "...");
        const textA = i <= a.pageCount ? await extractPageText(a.pdfDoc, i) : "";
        const textB = i <= b.pageCount ? await extractPageText(b.pdfDoc, i) : "";
        out.push(diffPage(i, textA, textB));
        await yieldToUi();
      }
      setDiffs(out);
    } catch (err) {
      console.error(err);
      setError("Gagal membandingkan PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const jump = (delta: 1 | -1) => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-change]"));
    if (nodes.length === 0) return;
    cursorRef.current = (cursorRef.current + delta + nodes.length) % nodes.length;
    nodes[cursorRef.current].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const totalChanges = diffs ? diffs.reduce((n, d) => n + d.changes, 0) : 0;
  const changedPages = diffs ? diffs.filter((d) => d.changes > 0).length : 0;
  const hasText = diffs ? diffs.some((d) => d.rows.some((r) => r.kind === "same" && r.left?.[0]?.text.trim())) || totalChanges > 0 : true;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        icon={<FileDiff className="w-6 h-6" />}
        title="Bandingkan PDF"
        description="Lihat perbedaan teks antara dua versi PDF, berdampingan, dengan sorotan tambahan dan hapusan."
      />
      <ErrorBanner message={a.error ?? b.error ?? error} onClose={() => { a.setError(null); b.setError(null); setError(null); }} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Slot label="PDF A (asli)" source={a} disabled={isWorking} />
        <Slot label="PDF B (revisi)" source={b} disabled={isWorking} />
      </div>

      <ActionBar note="Hanya teks yang dibandingkan (bukan tampilan visual). PDF hasil scan perlu di-OCR dulu.">
        <button type="button" onClick={compare} disabled={!a.pdfDoc || !b.pdfDoc || isWorking} className={primaryBtnCls}>
          {isWorking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress || "Memproses..."}</span>
            </>
          ) : (
            <>
              <FileDiff className="w-4 h-4" />
              <span>Bandingkan</span>
            </>
          )}
        </button>
      </ActionBar>

      {diffs && (
        <div className="mt-8 space-y-4">
          <Card className="flex flex-wrap items-center gap-3 sticky top-20 z-20">
            <div className="text-sm text-zinc-200">
              {totalChanges === 0 ? (
                <span className="font-semibold text-emerald-400">{hasText ? "Tidak ada perbedaan teks." : "Tidak ada teks yang bisa dibandingkan (mungkin PDF scan)."}</span>
              ) : (
                <>
                  <span className="font-semibold text-white">{totalChanges} perubahan</span> di {changedPages} dari {diffs.length} halaman
                </>
              )}
            </div>
            {totalChanges > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => jump(-1)} className={secondaryBtnCls + " !py-2 !px-3"}>
                  <ArrowUp className="w-4 h-4" />
                  Sebelumnya
                </button>
                <button type="button" onClick={() => jump(1)} className={secondaryBtnCls + " !py-2 !px-3"}>
                  <ArrowDown className="w-4 h-4" />
                  Berikutnya
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} className="accent-sky-600" />
              Tampilkan halaman tanpa perubahan
            </label>
          </Card>

          {diffs
            .filter((d) => showUnchanged || d.changes > 0)
            .map((d) => (
              <Card key={d.page} className="space-y-3 !p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <h3 className="label-mono text-zinc-200">Halaman {d.page}</h3>
                  <span className={"text-xs font-semibold " + (d.changes > 0 ? "text-amber-300" : "text-zinc-400")}>
                    {d.changes > 0 ? d.changes + " perubahan" : "Tanpa perubahan"}
                  </span>
                </div>
                <div className="grid grid-cols-2 text-[13px] leading-relaxed font-mono">
                  <div className="px-3 py-1.5 label-mono text-zinc-400 border-b border-zinc-800">A</div>
                  <div className="px-3 py-1.5 label-mono text-zinc-400 border-b border-l border-zinc-800">B</div>
                  {d.rows.map((row, i) => (
                    <div key={i} className="contents">
                      <div {...(row.kind !== "same" ? { "data-change": "" } : {})} className={"px-3 py-0.5 whitespace-pre-wrap break-words " + (row.kind === "same" ? "text-zinc-300" : "bg-red-500/10 text-zinc-100")}>
                        <SegText segs={row.left} tone="del" />
                      </div>
                      <div className={"px-3 py-0.5 border-l border-zinc-800 whitespace-pre-wrap break-words " + (row.kind === "same" ? "text-zinc-300" : "bg-emerald-500/10 text-zinc-100")}>
                        <SegText segs={row.right} tone="add" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
