"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configure worker to use locally bundled file in /public
if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

interface PageThumbnailProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
}

export default function PageThumbnail({ pdfDoc, pageNumber }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        // Render at a thumbnail viewport (width approx 160-200px)
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 180;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        if (!isCancelled) {
          console.error(`Failed to render thumbnail for page ${pageNumber}:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div className="relative group bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs p-2 flex flex-col items-center">
      <div className="w-full flex items-center justify-center min-h-[140px] bg-slate-50 dark:bg-zinc-950 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800">
        <canvas ref={canvasRef} className="max-w-full h-auto object-contain rounded" />
      </div>
      <div className="mt-2 text-[11px] font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
        Halaman {pageNumber}
      </div>
    </div>
  );
}
