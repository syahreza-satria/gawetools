"use client";

import { useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import { AlignLeft, ArrowDownToLine, Copy, Check, Loader2, PackageOpen, TriangleAlert } from "lucide-react";
import { usePdfSource } from "@/lib/usePdfSource";
import { extractPageText } from "@/lib/pdfText";
import { saveAs } from "@/lib/download";
import { formatBytes } from "@/lib/image";
import { yieldToUi } from "@/lib/yieldToUi";
import { ActionBar, Card, ErrorBanner, FileCard, FileDropzone, ToolHeader, primaryBtnCls, secondaryBtnCls } from "@/components/tool-ui";

export default function PdfToTextPage() {
  const source = usePdfSource();
  const { file, pdfDoc, pageCount, error, setError } = source;
  const [pages, setPages] = useState<string[] | null>(null);
  const [progress, setProgress] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState<number | "all" | null>(null);

  const reset = () => {
    source.reset();
    setPages(null);
  };

  const handleFiles = async (files: File[]) => {
    setPages(null);
    await source.load(files);
  };

  const extract = async () => {
    if (!pdfDoc) return;
    setIsWorking(true);
    setError(null);
    try {
      const out: string[] = [];
      for (let i = 1; i <= pageCount; i++) {
        setProgress("Membaca halaman " + i + " dari " + pageCount + "...");
        out.push(await extractPageText(pdfDoc, i));
        await yieldToUi();
      }
      setPages(out);
    } catch (err) {
      setError("Gagal mengekstrak teks: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsWorking(false);
      setProgress("");
    }
  };

  const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "dokumen";
  const totalChars = pages ? pages.reduce((n, p) => n + p.trim().length, 0) : 0;
  const looksScanned = pages !== null && totalChars < 20 * Math.max(pageCount, 1);

  const copy = async (text: string, which: number | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Gagal menyalin ke clipboard. Salin manual dari kotak teks.");
    }
  };

  const downloadSingle = () => {
    if (!pages) return;
    const text = pages.map((p, i) => "--- Halaman " + (i + 1) + " ---\n" + p).join("\n\n");
    saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), baseName + ".txt");
  };

  const downloadZip = async () => {
    if (!pages) return;
    const zip = new JSZip();
    pages.forEach((p, i) => zip.file(baseName + "_halaman_" + String(i + 1).padStart(3, "0") + ".txt", p));
    saveAs(await zip.generateAsync({ type: "blob" }), baseName + "_teks.zip");
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <ToolHeader
        icon={<AlignLeft className="w-6 h-6" />}
        title="PDF ke Teks"
        description="Ekstrak teks dari PDF per halaman, salin langsung, atau unduh sebagai .txt."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {!file && <FileDropzone kind="pdf" icon={<AlignLeft className="w-7 h-7" />} onFiles={handleFiles} loading={source.isLoading} />}

      {file && pdfDoc && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + pageCount + " halaman"} onRemove={reset} disabled={isWorking} />

          {!pages && (
            <ActionBar>
              <button type="button" onClick={extract} disabled={isWorking} className={primaryBtnCls}>
                {isWorking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progress || "Memproses..."}</span>
                  </>
                ) : (
                  <>
                    <AlignLeft className="w-4 h-4" />
                    <span>Ekstrak Teks</span>
                  </>
                )}
              </button>
            </ActionBar>
          )}

          {pages && (
            <>
              {looksScanned && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-3 text-amber-200 text-sm">
                  <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    Hampir tidak ada teks yang ditemukan. PDF ini kemungkinan hasil scan (berupa gambar). Gunakan{" "}
                    <Link href="/ocr" className="text-white underline underline-offset-2">
                      alat OCR
                    </Link>{" "}
                    untuk mengenali teksnya.
                  </div>
                </div>
              )}

              <Card className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={downloadSingle} className={primaryBtnCls}>
                  <ArrowDownToLine className="w-4 h-4" />
                  Unduh .txt
                </button>
                <button type="button" onClick={downloadZip} className={secondaryBtnCls + " !py-2.5"}>
                  <PackageOpen className="w-4 h-4" />
                  ZIP per halaman
                </button>
                <button type="button" onClick={() => copy(pages.join("\n\n"), "all")} className={secondaryBtnCls + " !py-2.5"}>
                  {copied === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Salin semua
                </button>
                <span className="text-xs text-zinc-400 ml-auto">{totalChars.toLocaleString("id-ID")} karakter</span>
              </Card>

              <div className="space-y-4">
                {pages.map((text, i) => (
                  <Card key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="label-mono text-zinc-300">Halaman {i + 1}</h3>
                      <button
                        type="button"
                        onClick={() => copy(text, i)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors"
                      >
                        {copied === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Salin
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={text}
                      placeholder="(tidak ada teks di halaman ini)"
                      rows={Math.min(Math.max(text.split("\n").length, 3), 14)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
