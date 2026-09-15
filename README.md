# GaweTools 🛠️

**GaweTools** adalah aplikasi web utilitas file PDF (mirip ilovepdf) yang cepat, modern, dan **100% aman**. 

Seluruh pemrosesan dokumen dilakukan langsung di sisi peramban pengguna (**client-side**) menggunakan JavaScript & WebAssembly. File Anda **tidak pernah diunggah** ke server mana pun, sehingga kerahasiaan dan privasi dokumen tetap terjaga seutuhnya.

---

## ✨ Fitur Utama

### 1. 📑 Gabung PDF (`/merge-pdf`)
- **Upload Fleksibel**: Drag & drop atau pilih banyak file sekaligus menggunakan `react-dropzone`.
- **Atur Urutan (Reorder)**: Ubah susunan dokumen sesuka hati dengan menarik baris (drag & drop sortable list via `@dnd-kit`).
- **Hapus Item**: Opsi hapus berkas individual sebelum penggabungan.
- **Client-Side Merging**: Penggabungan instan langsung di browser dengan `pdf-lib`.
- **Validasi**: Menolak file non-PDF dan memastikan minimal 2 berkas sebelum digabungkan.

### 2. ✂️ Pisah PDF (`/split-pdf`)
- **Preview Halaman Lengkap**: Menampilkan thumbnail visual setiap halaman dokumen menggunakan `pdfjs-dist`.
- **Dua Mode Pemisahan**:
  - **Ekstrak Semua Halaman**: Setiap halaman dipisah menjadi file PDF tersendiri dan otomatis dibundel dalam format `.zip` via `jszip`.
  - **Pisah berdasarkan Rentang (Range)**: Masukkan nomor atau rentang halaman tertentu (contoh: `1-3, 5, 7-9`). Jika hasilnya 1 file, diunduh langsung sebagai `.pdf`. Jika lebih dari 1 file, otomatis dikemas dalam format `.zip`.

### 3. 🗜️ Kompres PDF (`/compress-pdf`)
- **Kecilkan Ukuran Dokumen**: Reduksi bobot file PDF tanpa mengorbankan keterbacaan teks dan isi berkas.
- **Pilihan Tingkat Kompresi**:
  - *Ringan*: Kualitas gambar maksimal dengan penurunan ukuran ringan.
  - *Sedang (Rekomendasi)*: Keseimbangan optimal antara kualitas dan efisiensi ukuran.
  - *Kuat*: Menghasilkan ukuran file paling kecil.
- **Indikator Hemat**: Menampilkan perbandingan ukuran sebelum vs sesudah kompresi dan persentase penghematan ukuran file.

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Manipulasi PDF**: [`pdf-lib`](https://pdf-lib.js.org/)
- **Render Thumbnail & Worker**: [`pdfjs-dist`](https://mozilla.github.io/pdf.js/)
- **File Uploader**: [`react-dropzone`](https://react-dropzone.js.org/)
- **Drag & Drop Sortable**: [`@dnd-kit/core`](https://dndkit.com/) & [`@dnd-kit/sortable`](https://dndkit.com/)
- **Arsip ZIP**: [`jszip`](https://stuk.github.io/jszip/)
- **Download Helper**: [`file-saver`](https://github.com/eligrey/FileSaver.js)
- **Icons**: [`lucide-react`](https://lucide.dev/)

---

## 🚀 Memulai Proyek (Getting Started)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan)
- Package manager: `npm`, `yarn`, atau `pnpm`

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Server Development
```bash
npm run dev
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000).

### Build untuk Produksi
```bash
npm run build
npm run start
```

---

## 🔒 Privasi & Keamanan

Semua operasi dokumen (Merge, Split, Compress) dieksekusi di memori peramban (*client-side in-memory*). Dokumen tidak disimpan di penyimpanan awan (*cloud storage*) ataupun dikirimkan melalui jaringan internet.
