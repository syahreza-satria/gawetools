"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

export interface PagePreviewInfo {
  /** Visual page size in PDF points (rotation already applied). */
  ptWidth: number;
  ptHeight: number;
  /** Rendered size in CSS pixels. */
  cssWidth: number;
  cssHeight: number;
}

interface PdfPagePreviewProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  /** Rendered width in CSS pixels. */
  width: number;
  /** Overlay drawn on top of the page, positioned relative to the page's top-left corner. */
  children?: (info: PagePreviewInfo) => ReactNode;
  className?: string;
}

/** Renders one PDF page to a canvas and lets callers layer interactive overlays on top of it. */
export default function PdfPagePreview({ pdfDoc, pageNumber, width, children, className = "" }: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [info, setInfo] = useState<PagePreviewInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    let task: pdfjsLib.RenderTask | null = null;

    async function render() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const cssScale = width / base.width;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: cssScale * dpr });

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        task = page.render({ canvasContext: ctx, viewport, canvas });
        await task.promise;
        if (!cancelled) {
          setInfo({
            ptWidth: base.width,
            ptHeight: base.height,
            cssWidth: width,
            cssHeight: base.height * cssScale,
          });
        }
      } catch (err) {
        if (!cancelled && (err as { name?: string })?.name !== "RenderingCancelledException") {
          console.error("Gagal merender halaman " + pageNumber + ":", err);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdfDoc, pageNumber, width]);

  return (
    <div
      className={`relative bg-white shadow-md border border-gray-200 dark:border-zinc-700 ${className}`}
      style={{ width, height: info?.cssHeight, minHeight: info ? undefined : width * 1.3 }}
    >
      <canvas ref={canvasRef} className="block" style={{ width: "100%", height: "100%" }} />
      {info && children?.(info)}
    </div>
  );
}
