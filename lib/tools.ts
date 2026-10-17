// Tools that can receive a file from another tool (handoff) or from the OS share sheet.
export type FileKind = "pdf" | "image" | "heic";

export interface HandoffTool {
  href: string;
  label: string;
  accepts: FileKind;
}

export const HANDOFF_TOOLS: HandoffTool[] = [
  { href: "/merge-pdf", label: "Gabung PDF", accepts: "pdf" },
  { href: "/split-pdf", label: "Potong PDF", accepts: "pdf" },
  { href: "/compress-pdf", label: "Kompres PDF", accepts: "pdf" },
  { href: "/reorder-pdf", label: "Atur Halaman PDF", accepts: "pdf" },
  { href: "/rotate-pdf", label: "Putar PDF", accepts: "pdf" },
  { href: "/lock-pdf", label: "Kunci PDF", accepts: "pdf" },
  { href: "/unlock-pdf", label: "Buka Kunci PDF", accepts: "pdf" },
  { href: "/watermark-pdf", label: "Watermark PDF", accepts: "pdf" },
  { href: "/pdf-to-image", label: "PDF ke Gambar", accepts: "pdf" },
  { href: "/sign-pdf", label: "Tanda Tangan PDF", accepts: "pdf" },
  { href: "/add-page-numbers", label: "Nomor Halaman PDF", accepts: "pdf" },
  { href: "/redact-pdf", label: "Sensor PDF", accepts: "pdf" },
  { href: "/fill-pdf-form", label: "Isi Formulir PDF", accepts: "pdf" },
  { href: "/crop-pdf", label: "Crop PDF", accepts: "pdf" },
  { href: "/grayscale-pdf", label: "PDF Hitam-Putih", accepts: "pdf" },
  { href: "/pdf-to-text", label: "PDF ke Teks", accepts: "pdf" },
  { href: "/ocr", label: "OCR (PDF Scan ke Teks)", accepts: "pdf" },
  { href: "/booklet-pdf", label: "Cetak Booklet", accepts: "pdf" },
  { href: "/remove-metadata", label: "Hapus Metadata", accepts: "pdf" },
  { href: "/compress-image", label: "Kompres Gambar", accepts: "image" },
  { href: "/resize-image", label: "Resize Gambar", accepts: "image" },
  { href: "/convert-image", label: "Konversi Gambar", accepts: "image" },
  { href: "/watermark-image", label: "Watermark Gambar", accepts: "image" },
  { href: "/image-to-pdf", label: "Gambar ke PDF", accepts: "image" },
  { href: "/crop-image", label: "Crop Gambar", accepts: "image" },
  { href: "/photo-background", label: "Ganti Latar Pas Foto", accepts: "image" },
  { href: "/ocr", label: "OCR (Gambar ke Teks)", accepts: "image" },
  { href: "/scan-document", label: "Scan Dokumen", accepts: "image" },
  { href: "/remove-metadata", label: "Hapus Metadata", accepts: "image" },
  { href: "/heic-to-jpg", label: "HEIC ke JPG", accepts: "heic" },
];

export function toolsAccepting(kind: FileKind, excludeHref?: string): HandoffTool[] {
  return HANDOFF_TOOLS.filter((t) => t.accepts === kind && t.href !== excludeHref);
}

export function fileKind(file: { name: string; type: string }): FileKind | null {
  if (/^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name)) return "heic";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
  if (/^image\/(jpeg|png|webp)$/.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)) return "image";
  return null;
}
