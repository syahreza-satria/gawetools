export interface PageRangeGroup {
  label: string;
  pages: number[]; // 1-indexed pages
}

/**
 * Parses user range strings like "1-3, 5, 7-9" into structured page ranges.
 * Validates against maxPages.
 */
export function parseRangeInput(input: string, maxPages: number): { ranges: PageRangeGroup[]; error?: string } {
  const cleaned = input.trim();
  if (!cleaned) {
    return { ranges: [], error: "Masukkan range halaman (contoh: 1-3, 5, 7-9)" };
  }

  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { ranges: [], error: "Format range tidak valid." };
  }

  const result: PageRangeGroup[] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const bounds = part.split("-").map((s) => s.trim());
      if (bounds.length !== 2) {
        return { ranges: [], error: `Format range "${part}" tidak valid. Gunakan format seperti "1-5".` };
      }

      const start = parseInt(bounds[0], 10);
      const end = parseInt(bounds[1], 10);

      if (isNaN(start) || isNaN(end)) {
        return { ranges: [], error: `Range "${part}" mengandung angka yang tidak valid.` };
      }
      if (start < 1 || end < 1) {
        return { ranges: [], error: `Nomor halaman harus dimulai dari 1. Kesalahan pada "${part}".` };
      }
      if (start > maxPages || end > maxPages) {
        return { ranges: [], error: `Nomor halaman melebihi total dokumen (${maxPages} halaman). Kesalahan pada "${part}".` };
      }
      if (start > end) {
        return { ranges: [], error: `Awal range tidak boleh lebih besar dari akhir ("${part}").` };
      }

      const pages: number[] = [];
      for (let p = start; p <= end; p++) {
        pages.push(p);
      }

      result.push({
        label: `${start}-${end}`,
        pages,
      });
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        return { ranges: [], error: `Nilai "${part}" bukan nomor halaman yang valid.` };
      }
      if (page < 1 || page > maxPages) {
        return { ranges: [], error: `Halaman ${page} tidak ada dalam dokumen (total ${maxPages} halaman).` };
      }

      result.push({
        label: `${page}`,
        pages: [page],
      });
    }
  }

  return { ranges: result };
}
