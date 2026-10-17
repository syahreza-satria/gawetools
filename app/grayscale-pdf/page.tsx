"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Contrast, Loader2, TriangleAlert } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
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

type Quality = "standard" | "high";

const QUALITY_PRESETS: Record<Quality, { scale: number; jpeg: number; desc: string }> = {
  standard: { scale: 1.5, jpeg: 0.8, desc: "Ukuran file lebih kecil, cukup tajam untuk dibaca dan dicetak." },
  high: { scale: 2.2, jpeg: 0.92, desc: "Lebih tajam untuk cetak berkualitas, ukuran file lebih besar." },
};

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar halaman"))), "image/jpeg", quality);
  });
}

export default function GrayscalePdfPage() {
  const source = usePdfSource();
  const { file, pdfDoc, pageCount, error, setError } = source;
  const [quality, setQuality] = useState<Quality>("standard");
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<Blob | null>(null);

  const reset = () => {
    source.reset();
    setResult(null);
  };

  const run = async () => {
    if (!pdfDoc) return;
    setIsWorking(true);
    setError(null);
    try {
      const { scale, jpeg } = QUALITY_PRESETS[quality];
      const out = await PDFDocument.create();
      for (let i = 1; i <= pageCount; i++) {
        setProgress("Mengubah halaman " + i + " dari " + pageCount + "...");
        const page = await pdfDoc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Gagal menginisialisasi canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        // Luma-weighted grayscale (done by hand: ctx.filter is not available in every browser).
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data;
        for (let p = 0; p < d.length; p += 4) {
          const g = (d[p] * 299 + d[p + 1] * 587 + d[p + 2] * 114) / 1000;
          d[p] = d[p + 1] = d[p + 2] = g;
        }
        ctx.putImageData(img, 0, 0);

        const jpg = await out.embedJpg(new Uint8Array(await (await canvasToJpeg(canvas, jpeg)).arrayBuffer()));
        const newPage = out.addPage([base.width, base.height]);
        newPage.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
        await yieldToUi();
      }
      setProgress("Menyimpan hasil...");
      const bytes = await out.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      setError("Gagal membuat PDF hitam-putih: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const outName = file ? file.name.replace(/\.[^/.]+$/, "") + "_hitam-putih.pdf" : "hitam-putih.pdf";

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <ToolHeader
        icon={<Contrast className="w-6 h-6" />}
        title="PDF Hitam-Putih"
        description="Ubah PDF berwarna menjadi hitam-putih (grayscale), cocok untuk hemat tinta saat mencetak."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && file && (
        <ResultCard
          title="PDF Hitam-Putih Siap!"
          subtitle={formatBytes(file.size) + " → " + formatBytes(result.size) + " · " + pageCount + " halaman"}
          blob={result}
          filename={outName}
          onBack={() => setResult(null)}
          onReset={reset}
        />
      )}

      {!file && <FileDropzone kind="pdf" icon={<Contrast className="w-7 h-7" />} onFiles={(f) => void source.load(f)} loading={source.isLoading} />}

      {file && pdfDoc && !result && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + pageCount + " halaman"} onRemove={reset} disabled={isWorking} />
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Kualitas</h3>
            <SegmentedButtons
              value={quality}
              onChange={setQuality}
              disabled={isWorking}
              options={[
                { id: "standard", label: "Standar" },
                { id: "high", label: "Tinggi" },
              ]}
            />
            <p className="text-xs text-zinc-400">{QUALITY_PRESETS[quality].desc}</p>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-2.5 text-amber-200 text-xs">
              <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Setiap halaman dirender menjadi gambar, sehingga teks pada hasil tidak bisa diseleksi atau dicari lagi.</span>
            </div>
          </Card>
          <ActionBar>
            <button type="button" onClick={run} disabled={isWorking} className={primaryBtnCls}>
              {isWorking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progress || "Memproses..."}</span>
                </>
              ) : (
                <>
                  <Contrast className="w-4 h-4" />
                  <span>Ubah ke Hitam-Putih</span>
                </>
              )}
            </button>
          </ActionBar>
        </div>
      )}
    </div>
  );
}
