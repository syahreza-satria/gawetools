"use client";

import { useCallback, useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

/** Holds one PDF chosen by the user: the File plus a pdfjs document for previews. */
export function usePdfSource() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void pdfDoc?.loadingTask.destroy();
    };
  }, [pdfDoc]);

  const load = useCallback(async (files: File[]) => {
    const picked = files[0];
    if (!picked) return false;
    setIsLoading(true);
    setError(null);
    try {
      const data = new Uint8Array(await picked.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      setFile(picked);
      setPdfDoc(doc);
      return true;
    } catch (err) {
      console.error(err);
      setError("Gagal membaca PDF. File mungkin rusak atau terkunci password.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPdfDoc(null);
    setError(null);
  }, []);

  return { file, pdfDoc, pageCount: pdfDoc?.numPages ?? 0, isLoading, error, setError, load, reset };
}
