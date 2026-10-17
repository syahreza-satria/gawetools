"use client";

import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { BookOpen, Info, Loader2 } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
import { loadPdf } from "@/lib/loadPdf";
import { bookletOrder } from "@/lib/booklet";
import { formatBytes } from "@/lib/image";
import { yieldToUi } from "@/lib/yieldToUi";
import {
  ActionBar,
  Card,
  ErrorBanner,
  FileCard,
  FileDropzone,
  ResultCard,
  SegmentedButtons,
  ToolHeader,
  primaryBtnCls,
} from "@/components/tool-ui";

type Paper = "a4" | "f4";

// Sheets are landscape: the long edge holds the two pages side by side.
const PAPER: Record<Paper, { label: string; w: number; h: number }> = {
  a4: { label: "A4 (210 × 297 mm)", w: 841.89, h: 595.28 },
  f4: { label: "F4 / Folio (215 × 330 mm)", w: 935.43, h: 609.45 },
};

export default function BookletPdfPage() {
  const source = usePdfSource();
  const { file, pageCount, error, setError } = source;
  const [paper, setPaper] = useState<Paper>("a4");
  const [foldLine, setFoldLine] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const reset = () => {
    source.reset();
    setResult(null);
  };

  const blanks = pageCount > 0 ? Math.ceil(pageCount / 4) * 4 - pageCount : 0;
  const sheets = Math.ceil(pageCount / 4);

  const run = async () => {
    if (!file) return;
    setIsWorking(true);
    setError(null);
    try {
      const src = await loadPdf(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const embedded = await out.embedPdf(src, src.getPageIndices());
      const sheet = PAPER[paper];
      const half = sheet.w / 2;
      const margin = 18;
      const sides = bookletOrder(pageCount);

      for (let i = 0; i < sides.length; i++) {
        const page = out.addPage([sheet.w, sheet.h]);
        sides[i].forEach((idx, slot) => {
          if (idx === null) return;
          const ep = embedded[idx];
          const scale = Math.min((half - margin * 2) / ep.width, (sheet.h - margin * 2) / ep.height);
          const w = ep.width * scale;
          const h = ep.height * scale;
          page.drawPage(ep, {
            x: slot * half + (half - w) / 2,
            y: (sheet.h - h) / 2,
            xScale: scale,
            yScale: scale,
          });
        });
        if (foldLine) {
          page.drawLine({
            start: { x: half, y: 0 },
            end: { x: half, y: sheet.h },
            thickness: 0.5,
            color: rgb(0.6, 0.6, 0.6),
            dashArray: [4, 4],
          });
        }
        if (i % 8 === 0) await yieldToUi();
      }
      const bytes = await out.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      setError("Gagal membuat booklet: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
    }
  };

  const outName = file ? file.name.replace(/\.[^/.]+$/, "") + "_booklet.pdf" : "booklet.pdf";

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 2xl:px-16 w-full w-full">
      <ToolHeader
        icon={<BookOpen className="w-6 h-6" />}
        title="Cetak Booklet"
        description="Susun halaman PDF menjadi lembar 2-up untuk dicetak bolak-balik, dilipat tengah, lalu dijilid menjadi buku kecil."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && file && (
        <ResultCard
          title="Booklet Siap Dicetak!"
          subtitle={sheets + " lembar (" + sheets * 2 + " sisi) · " + formatBytes(result.size)}
          blob={result}
          filename={outName}
          extra={
            <div className="text-left text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-lg mx-auto space-y-1.5">
              <p className="flex items-center gap-2 font-semibold text-white">
                <Info className="w-4 h-4" /> Cara mencetak
              </p>
              <p>1. Cetak dengan kertas <strong>landscape</strong> dan skala 100% (jangan &quot;fit to page&quot;).</p>
              <p>2. Pilih cetak <strong>bolak-balik</strong> (duplex) dengan opsi <strong>flip on short edge</strong> (balik di sisi pendek).</p>
              <p>3. Tumpuk semua lembar, lipat tengah, lalu jilid di lipatannya.</p>
            </div>
          }
          onBack={() => setResult(null)}
          onReset={reset}
        />
      )}

      {!file && <FileDropzone kind="pdf" icon={<BookOpen className="w-7 h-7" />} onFiles={(f) => void source.load(f)} loading={source.isLoading} />}

      {file && !result && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + pageCount + " halaman"} onRemove={reset} disabled={isWorking} />

          <Card className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Ukuran lembar cetak (landscape)</h3>
              <SegmentedButtons
                value={paper}
                onChange={setPaper}
                options={(Object.keys(PAPER) as Paper[]).map((p) => ({ id: p, label: PAPER[p].label }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={foldLine} onChange={(e) => setFoldLine(e.target.checked)} className="accent-sky-600" />
              Tambahkan garis lipat putus-putus di tengah
            </label>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p>
                {pageCount} halaman → <strong className="text-white">{sheets} lembar</strong> ({sheets * 2} sisi cetak).
                {blanks > 0 ? " " + blanks + " halaman kosong ditambahkan di akhir agar kelipatan 4." : ""}
              </p>
              <p>Urutan: {bookletOrder(pageCount).slice(0, 4).map((s) => s.map((n) => (n === null ? "kosong" : n + 1)).join(" | ")).join("  ·  ")}{pageCount > 8 ? " …" : ""}</p>
            </div>
          </Card>

          <ActionBar>
            <button type="button" onClick={run} disabled={isWorking} className={primaryBtnCls}>
              {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              <span>Buat Booklet</span>
            </button>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
