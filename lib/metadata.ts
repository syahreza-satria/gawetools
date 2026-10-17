import { PDFDict, PDFName } from "pdf-lib";
import { loadPdf } from "@/lib/loadPdf";

export interface MetaEntry {
  label: string;
  value: string;
}

export interface FileMetadata {
  entries: MetaEntry[];
  /** true when GPS coordinates are embedded (location of where the photo was taken). */
  hasGps: boolean;
}

// ---------- JPEG / EXIF ----------

const TAGS_IFD0: Record<number, string> = {
  0x010f: "Merek kamera",
  0x0110: "Model kamera",
  0x0131: "Perangkat lunak",
  0x0132: "Tanggal",
  0x013b: "Pembuat",
  0x8298: "Hak cipta",
};
const TAGS_EXIF: Record<number, string> = {
  0x9003: "Tanggal pemotretan",
  0xa434: "Lensa",
};

function readAscii(view: DataView, start: number, count: number): string {
  let s = "";
  for (let i = 0; i < count; i++) {
    const c = view.getUint8(start + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.trim();
}

function parseExif(view: DataView, tiffStart: number): FileMetadata {
  const entries: MetaEntry[] = [];
  let hasGps = false;
  const little = view.getUint16(tiffStart) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);

  const readIfd = (offset: number, handler: (tag: number, type: number, count: number, valueAt: number) => void) => {
    const base = tiffStart + offset;
    if (base + 2 > view.byteLength) return;
    const n = u16(base);
    for (let i = 0; i < n; i++) {
      const e = base + 2 + i * 12;
      if (e + 12 > view.byteLength) return;
      const type = u16(e + 2);
      const count = u32(e + 4);
      const size = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 } as Record<number, number>)[type] ?? 1;
      const valueAt = count * size <= 4 ? e + 8 : tiffStart + u32(e + 8);
      handler(u16(e), type, count, valueAt);
    }
  };

  const rationals = (at: number, n: number) => Array.from({ length: n }, (_, i) => u32(at + i * 8) / (u32(at + i * 8 + 4) || 1));

  let exifPtr = 0;
  let gpsPtr = 0;
  readIfd(u32(tiffStart + 4), (tag, type, count, at) => {
    if (tag === 0x8769) exifPtr = u32(at);
    else if (tag === 0x8825) gpsPtr = u32(at);
    else if (TAGS_IFD0[tag] && type === 2) {
      const v = readAscii(view, at, count);
      if (v) entries.push({ label: TAGS_IFD0[tag], value: v });
    }
  });
  if (exifPtr) {
    readIfd(exifPtr, (tag, type, count, at) => {
      if (TAGS_EXIF[tag] && type === 2) {
        const v = readAscii(view, at, count);
        if (v) entries.push({ label: TAGS_EXIF[tag], value: v });
      }
    });
  }
  if (gpsPtr) {
    let latRef = "N";
    let lonRef = "E";
    let lat: number[] | null = null;
    let lon: number[] | null = null;
    readIfd(gpsPtr, (tag, type, count, at) => {
      if (tag === 1 && type === 2) latRef = readAscii(view, at, count);
      else if (tag === 3 && type === 2) lonRef = readAscii(view, at, count);
      else if (tag === 2 && type === 5 && count === 3) lat = rationals(at, 3);
      else if (tag === 4 && type === 5 && count === 3) lon = rationals(at, 3);
    });
    if (lat && lon) {
      const toDeg = (v: number[]) => v[0] + v[1] / 60 + v[2] / 3600;
      const la = (latRef === "S" ? -1 : 1) * toDeg(lat);
      const lo = (lonRef === "W" ? -1 : 1) * toDeg(lon);
      hasGps = true;
      entries.push({ label: "Koordinat GPS", value: la.toFixed(5) + ", " + lo.toFixed(5) });
    }
  }
  return { entries, hasGps };
}

async function readJpeg(file: File): Promise<FileMetadata> {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer();
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return { entries: [], hasGps: false };
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && readAscii(view, offset + 4, 4) === "Exif") {
      try {
        return parseExif(view, offset + 10);
      } catch {
        return { entries: [{ label: "EXIF", value: "ada, tetapi tidak bisa dibaca rinci" }], hasGps: false };
      }
    }
    if (marker === 0xda) break;
    offset += 2 + length;
  }
  return { entries: [], hasGps: false };
}

// ---------- PNG / WebP (presence only) ----------

async function readPng(file: File): Promise<FileMetadata> {
  const view = new DataView(await file.slice(0, 512 * 1024).arrayBuffer());
  const found = new Set<string>();
  let offset = 8;
  while (offset + 12 <= view.byteLength) {
    const len = view.getUint32(offset);
    const type = readAscii(view, offset + 4, 4);
    if (type === "eXIf") found.add("EXIF");
    if (type === "tEXt" || type === "iTXt" || type === "zTXt") found.add("Teks/XMP");
    if (type === "IDAT") break;
    offset += 12 + len;
  }
  return { entries: [...found].map((f) => ({ label: f, value: "terdeteksi di dalam file" })), hasGps: false };
}

async function readWebp(file: File): Promise<FileMetadata> {
  const view = new DataView(await file.slice(0, 512 * 1024).arrayBuffer());
  const entries: MetaEntry[] = [];
  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const type = readAscii(view, offset, 4);
    const len = view.getUint32(offset + 4, true);
    if (type === "EXIF") entries.push({ label: "EXIF", value: "terdeteksi di dalam file" });
    if (type === "XMP ") entries.push({ label: "XMP", value: "terdeteksi di dalam file" });
    offset += 8 + len + (len % 2);
  }
  return { entries, hasGps: false };
}

// ---------- PDF ----------

const INFO_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"] as const;
const INFO_LABELS: Record<(typeof INFO_KEYS)[number], string> = {
  Title: "Judul",
  Author: "Penulis",
  Subject: "Subjek",
  Keywords: "Kata kunci",
  Creator: "Pembuat",
  Producer: "Aplikasi PDF",
  CreationDate: "Dibuat",
  ModDate: "Diubah",
};

async function readPdfMeta(file: File): Promise<FileMetadata> {
  const doc = await loadPdf(await file.arrayBuffer(), { updateMetadata: false });
  const entries: MetaEntry[] = [];
  const values: Record<(typeof INFO_KEYS)[number], string | undefined> = {
    Title: doc.getTitle(),
    Author: doc.getAuthor(),
    Subject: doc.getSubject(),
    Keywords: doc.getKeywords(),
    Creator: doc.getCreator(),
    Producer: doc.getProducer(),
    CreationDate: doc.getCreationDate()?.toLocaleString("id-ID"),
    ModDate: doc.getModificationDate()?.toLocaleString("id-ID"),
  };
  for (const key of INFO_KEYS) {
    if (values[key]) entries.push({ label: INFO_LABELS[key], value: values[key]! });
  }
  if (doc.catalog.has(PDFName.of("Metadata"))) entries.push({ label: "XMP", value: "metadata XML terdeteksi" });
  return { entries, hasGps: false };
}

export async function readMetadata(file: File, kind: "pdf" | "image"): Promise<FileMetadata> {
  if (kind === "pdf") return readPdfMeta(file);
  if (file.type === "image/png") return readPng(file);
  if (file.type === "image/webp") return readWebp(file);
  return readJpeg(file);
}

/** Clears the document info fields and drops the XMP stream. */
export async function stripPdfMetadata(file: File): Promise<Uint8Array> {
  const doc = await loadPdf(await file.arrayBuffer(), { updateMetadata: false });
  const info = doc.context.trailerInfo.Info ? doc.context.lookupMaybe(doc.context.trailerInfo.Info, PDFDict) : undefined;
  if (info) for (const key of INFO_KEYS) info.delete(PDFName.of(key));
  doc.catalog.delete(PDFName.of("Metadata"));
  return doc.save();
}
