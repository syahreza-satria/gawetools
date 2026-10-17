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

### 2. ✂️ potong PDF (`/split-pdf`)

- **Preview Halaman Lengkap**: Menampilkan thumbnail visual setiap halaman dokumen menggunakan `pdfjs-dist`.
- **Dua Mode Pemisahan**:
  - **Ekstrak Semua Halaman**: Setiap halaman dipotong menjadi file PDF tersendiri dan otomatis dibundel dalam format `.zip` via `jszip`.
  - **potong berdasarkan Rentang (Range)**: Masukkan nomor atau rentang halaman tertentu (contoh: `1-3, 5, 7-9`). Jika hasilnya 1 file, diunduh langsung sebagai `.pdf`. Jika lebih dari 1 file, otomatis dikemas dalam format `.zip`.

### 3. 🗜️ Kompres PDF (`/compress-pdf`)

- **Kecilkan Ukuran Dokumen**: Reduksi bobot file PDF tanpa mengorbankan keterbacaan teks dan isi berkas.
- **Pilihan Tingkat Kompresi**:
  - _Ringan_: Kualitas gambar maksimal dengan penurunan ukuran ringan.
  - _Sedang (Rekomendasi)_: Keseimbangan optimal antara kualitas dan efisiensi ukuran.
  - _Kuat_: Menghasilkan ukuran file paling kecil.
- **Indikator Hemat**: Menampilkan perbandingan ukuran sebelum vs sesudah kompresi dan persentase penghematan ukuran file.

### 4. 🔒 Kunci PDF (`/lock-pdf`)

- **Proteksi Password**: Beri kata sandi pengaman untuk dokumen PDF rahasia/sensitif.
- **Enkripsi Kuat**: Menggunakan enkripsi standar industri AES-256 langsung di browser.
- **Validasi Keamanan**: Konfirmasi password ganda serta opsi lihat/sembunyikan password.

---

### Alat tambahan

- **Tanda Tangan PDF** (`/sign-pdf`): gambar, ketik (font tulisan tangan), atau unggah tanda tangan lalu tempel, geser, dan ubah ukurannya di halaman mana pun; tanggal opsional. Tanda tangan tidak disimpan.
- **Nomor Halaman PDF** (`/add-page-numbers`): posisi 6 titik, 4 format, nomor mulai, lewati sampul, ukuran font dan margin; mendukung halaman yang diputar.
- **HEIC ke JPG** (`/heic-to-jpg`): konversi foto iPhone ke JPG/PNG secara massal (library `heic2any`, dimuat hanya saat dipakai).
- **Crop Gambar** (`/crop-image`): area crop bebas atau rasio tetap, preset pas foto 3×4 dan 4×6 pada 300 dpi, putar dan balik gambar.
- **Kompres ke target ukuran**: kompres gambar dan kompres PDF punya mode "Target ukuran" (mis. 200 KB, 1 MB); aplikasi mencari kualitas/resolusi terbaik yang masih muat.

- **Sensor PDF** (`/redact-pdf`): kotak hitam di halaman; halaman yang disensor diratakan jadi gambar sehingga teksnya hilang.
- **Hapus Metadata** (`/remove-metadata`): tampilkan lalu hapus EXIF/GPS dari gambar dan info/XMP dari PDF.
- **PDF ke Teks** (`/pdf-to-text`): ekstrak teks per halaman, salin, unduh `.txt` atau ZIP.
- **Ganti Latar Pas Foto** (`/photo-background`): segmentasi orang dengan MediaPipe (Apache-2.0); model `public/models/selfie_segmenter.tflite` dan runtime WASM (`public/mediapipe`, disalin otomatis saat `npm install`) dilayani dari situs sendiri.
- **Isi Formulir PDF** (`/fill-pdf-form`), **Crop PDF** (`/crop-pdf`), **PDF Hitam-Putih** (`/grayscale-pdf`).
- **Kompres PDF, mode "Pertahankan teks"**: hanya gambar JPEG di dalam PDF yang dikecilkan, teks tetap bisa diseleksi.

### Fondasi platform

- **Web Worker**: proses berat tanpa DOM (mis. penggabungan PDF) berjalan di worker lewat `lib/workers/` (`runInWorker` + `defineWorker`) agar UI tidak membeku.
- **Lanjut ke…**: di layar hasil, tombol "Lanjut ke…" meneruskan hasil ke alat lain tanpa unduh & unggah ulang. File dititipkan sementara di IndexedDB perangkat (`lib/handoff.ts`), dibaca lalu dihapus, dan kedaluwarsa dalam 10 menit.
- **Bagikan ke GaweTools (PWA)**: setelah aplikasi dipasang, file PDF/gambar bisa dibagikan dari aplikasi lain ke GaweTools (Web Share Target, halaman `/bagikan`). File diproses service worker di perangkat dan tidak dikirim ke jaringan.
- **Tempel dari clipboard**: tekan `Ctrl+V` di halaman alat untuk menempelkan PDF atau gambar dari clipboard.

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

Semua operasi dokumen (Merge, Split, Compress) dieksekusi di memori peramban (_client-side in-memory_). Dokumen tidak disimpan di penyimpanan awan (_cloud storage_) ataupun dikirimkan melalui jaringan internet.
