import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/loadPdf";
import { defineWorker } from "./defineWorker";

export interface MergeInput {
  buffers: ArrayBuffer[];
  names: string[];
}
export interface MergeProgress {
  index: number;
  total: number;
  name: string;
}
export interface MergeOutput {
  bytes: Uint8Array<ArrayBuffer>;
  totalPages: number;
}

defineWorker<MergeInput, MergeOutput, MergeProgress>(async ({ buffers, names }, { progress }) => {
  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < buffers.length; i++) {
    progress({ index: i, total: buffers.length, name: names[i] });
    const source = await loadPdf(buffers[i]);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
      totalPages++;
    }
  }

  const bytes = (await merged.save()) as Uint8Array<ArrayBuffer>;
  return { result: { bytes, totalPages }, transfer: [bytes.buffer] };
});
