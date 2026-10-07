@AGENTS.md

# GaweTools

Aplikasi web utilitas PDF & gambar (mirip ilovepdf). **Semua pemrosesan berjalan 100% client-side di browser** — file pengguna tidak boleh diunggah ke server. Jangan menambahkan API route / server action yang menerima file pengguna. UI dan semua teks berbahasa **Indonesia** (`<html lang="id">`).

## Perintah

```bash
npm run dev     # dev server di http://localhost:3000
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # ESLint (eslint-config-next core-web-vitals + typescript)
```

Tidak ada test runner. Verifikasi dengan `npm run lint`, `npx tsc --noEmit`, dan mencoba fitur di browser. Folder `scratch/` (gitignored) berisi PDF sampel untuk uji manual.

## Stack

Next.js 16.3.5 (App Router) · React 19.2 · TypeScript strict · Tailwind CSS v4 (`@import "tailwindcss"`, tanpa `tailwind.config`) · alias import `@/*` → root proyek.

Library utama: `pdf-lib` (gabung/potong/susun/watermark PDF), `pdfjs-dist` (render halaman ke canvas), `@pdfsmaller/pdf-encrypt` & `pdf-decrypt` (kunci/buka kunci PDF), `jszip` + `file-saver` (unduhan), `react-dropzone` (upload), `@dnd-kit/*` (drag & drop urutan), `lucide-react` (ikon).

> Next.js di repo ini punya breaking changes dari yang umum dikenal. Baca panduan terkait di `node_modules/next/dist/docs/` sebelum menulis kode Next-spesifik (routing, metadata, font, dsb.).

## Struktur

- `app/<tool>/page.tsx` — satu halaman per alat, masing-masing `"use client"` dan **self-contained** (state, logika pemrosesan, dan UI dalam satu file, 300–1000 baris). Tidak ada route API.
  - PDF: `merge-pdf`, `split-pdf`, `compress-pdf`, `reorder-pdf`, `rotate-pdf`, `image-to-pdf`, `lock-pdf`, `unlock-pdf`, `watermark-pdf`, `pdf-to-image`
  - Gambar: `compress-image`, `resize-image`, `convert-image`, `watermark-image`
  - Statis: `app/page.tsx` (beranda), `guide`, `about`
- `app/layout.tsx` — root layout: font Inter (`--font-inter`), `Navbar` + `Footer`, dan skrip inline di `<head>` yang memasang class `dark` sebelum hidrasi (anti-flash tema).
- `components/` — `Navbar` (daftar alat `pdfTools` / `imageTools` didefinisikan di sini), `Footer`, `ThemeToggle`, `PageThumbnail` (render thumbnail halaman via pdfjs).
- `components/ImageBatchTool.tsx` — cangkang bersama alat gambar batch (dropzone → daftar file → opsi → hasil + ZIP). `resize-image` dan `convert-image` hanya menyuplai `options`, `validate`, dan `process(file)`; pakai ini untuk alat gambar batch baru.
- Riwayat unduhan: `lib/history.ts` (IndexedDB, hanya metadata — nama, ukuran, waktu; jangan simpan isi file) dan halaman `app/history`. Selalu impor `saveAs` dari `@/lib/download` (bukan `file-saver` langsung) agar unduhan tercatat; jika memakai `<a download>`, panggil `recordHistory` manual (lihat merge-pdf). Tambahkan alat baru ke `TOOL_LABELS`.
- `lib/image.ts` — helper gambar (`decodeImage`, `renderBitmap`, `formatBytes`, `OUTPUT_FORMATS`).
- PWA: `app/manifest.ts`, `public/sw.js` (cache-first aset statis, network-first halaman; hanya didaftarkan di production lewat `components/ServiceWorkerRegister.tsx`), ikon `public/icon-*.png`. Tambahkan rute alat baru ke `PRECACHE_PAGES` di `sw.js` dan naikkan `VERSION` bila strategi cache berubah.
- `lib/parseRanges.ts` — `parseRangeInput("1-3, 5, 7-9", maxPages)` untuk mode rentang di split-pdf; pesan error dalam bahasa Indonesia.
- `public/pdf.worker.min.mjs` — worker pdfjs yang di-bundle lokal.

## Konvensi & hal penting

- **Menambah alat baru**: buat `app/<nama>/page.tsx`, lalu daftarkan di `pdfTools`/`imageTools` pada `components/Navbar.tsx` (dipakai desktop dropdown & menu mobile), serta kartu di `app/page.tsx` dan `app/guide/page.tsx` bila relevan.
- **Worker pdfjs**: setiap file yang mengimpor `pdfjs-dist` mengatur `pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"` di level modul (dengan guard `typeof window !== "undefined"`). Pertahankan pola ini; jangan ubah ke CDN. Jika versi `pdfjs-dist` di-upgrade, salin ulang worker-nya ke `public/`.
- **Pola halaman**: `useDropzone` (dengan `accept` + `FileRejection` handling) → proses di handler async dengan `progressText`/flag `isProcessing` → hasil sebagai `Blob` → unduh via `saveAs` (file-saver) atau object URL. Error ditampilkan di banner `errorMessage`, bukan `alert`.
- **Object URL**: selalu `URL.revokeObjectURL` saat hasil diganti/di-reset/unmount.
- **dnd-kit**: gunakan `useId()` untuk `DndContext id` agar tidak ada hydration mismatch (lihat merge-pdf, reorder-pdf).
- **Import dinamis untuk library berat/SSR-tidak-aman**: contoh `@pdfsmaller/pdf-decrypt` di-`import()` di dalam handler (unlock-pdf).
- **Tipe Blob dari bytes**: `new Blob([bytes as Uint8Array<ArrayBuffer>], { type })` dipakai untuk menghindari error tipe TS.
- **Styling**: utility Tailwind inline, aksen warna `sky-*`, dark mode berbasis class (`@custom-variant dark (&:where(.dark, .dark *))` di `globals.css`) — setiap warna latar/teks/border harus punya varian `dark:` (palet `zinc-*` untuk dark, `gray-*`/`slate-*` untuk light). Teks UI Indonesia (mis. "Gabung", "Potong", "Kunci").
- **Kompres PDF** (`compress-pdf`) bekerja dengan merender tiap halaman ke JPEG lalu membangun ulang PDF (teks menjadi gambar, tidak bisa diseleksi). Level kompresi didefinisikan lewat `COMPRESSION_LEVELS` (scale + quality).

## Catatan

- `README.md` belum mencakup semua alat (unlock, reorder, watermark, pdf-to-image, serta alat gambar) — perbarui bila menambah/mengubah fitur.
- `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next/`, dan `scratch/` di-gitignore; jangan di-commit.
