import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import {
  Files,
  Scissors,
  LayoutGrid,
  RotateCw,
  FileImage,
  Images,
  Repeat,
  Minimize2,
  Lock,
  LockOpen,
  Stamp,
  ImageDown,
  Scaling,
  FileStack,
  ArrowLeftRight,
  ShieldHalf,
  ImageIcon,
  PenLine,
  ListOrdered,
  Smartphone,
  Crop,
  PenTool,
  EyeOff,
  ShieldOff,
  AlignLeft,
  UserRound,
  FormInput,
  Contrast,
  ShieldCheck,
  History,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Panduan | GaweTools",
  description: "Cara memakai setiap alat GaweTools langkah demi langkah: PDF, konversi, keamanan, dan gambar.",
};

interface GuideTool {
  href: string;
  title: string;
  icon: ReactNode;
  summary: string;
  steps: string[];
  tip?: string;
}

interface GuideCategory {
  id: string;
  title: string;
  icon: ReactNode;
  tools: GuideTool[];
}

const ic = "w-5 h-5";

const CATEGORIES: GuideCategory[] = [
  {
    id: "atur",
    title: "Atur Dokumen PDF",
    icon: <FileStack className={ic} />,
    tools: [
      {
        href: "/merge-pdf",
        title: "Gabung PDF",
        icon: <Files className={ic} />,
        summary: "Satukan dua atau lebih PDF menjadi satu dokumen.",
        steps: [
          "Tarik & lepas beberapa file PDF, atau klik area unggah untuk memilihnya.",
          "Geser baris file (ikon titik-titik di kiri) untuk mengatur urutan gabungan.",
          "Hapus file yang tidak perlu dengan ikon tempat sampah.",
          "Klik Gabung, lalu unduh hasilnya.",
        ],
        tip: "Minimal 2 file PDF diperlukan sebelum bisa digabung.",
      },
      {
        href: "/split-pdf",
        title: "Potong PDF",
        icon: <Scissors className={ic} />,
        summary: "Pisahkan halaman PDF menjadi file-file baru.",
        steps: [
          "Unggah satu file PDF — thumbnail semua halaman akan tampil.",
          "Pilih mode: ekstrak semua halaman, atau potong berdasarkan rentang.",
          "Untuk rentang, tulis misalnya 1-3, 5, 7-9.",
          "Klik Potong. Hasil satu file diunduh sebagai PDF, lebih dari satu dikemas dalam ZIP.",
        ],
      },
      {
        href: "/reorder-pdf",
        title: "Atur Halaman PDF",
        icon: <LayoutGrid className={ic} />,
        summary: "Susun ulang urutan halaman atau hapus halaman tertentu.",
        steps: [
          "Unggah satu file PDF.",
          "Geser thumbnail halaman ke posisi yang diinginkan.",
          "Hapus halaman yang tidak dibutuhkan dari kartu halamannya.",
          "Simpan untuk mengunduh PDF baru.",
        ],
      },
      {
        href: "/rotate-pdf",
        title: "Putar PDF",
        icon: <RotateCw className={ic} />,
        summary: "Putar halaman yang miring atau terbalik.",
        steps: [
          "Unggah satu file PDF.",
          "Putar per halaman dengan tombol kiri/kanan di bawah thumbnail, atau gunakan Semua kiri / Semua kanan.",
          "Klik Simpan PDF untuk mengunduh salinan yang sudah diputar.",
        ],
      },
      {
        href: "/crop-pdf",
        title: "Crop PDF",
        icon: <Crop className={ic} />,
        summary: "Pangkas margin halaman PDF.",
        steps: [
          "Unggah satu file PDF.",
          "Tarik kotak di pratinjau, atau pilih mode Margin dan isi margin dalam milimeter.",
          "Pilih semua halaman atau rentang tertentu (cth: 1-3, 5).",
          "Klik Pangkas PDF, lalu unduh hasilnya.",
        ],
        tip: "Aktifkan 'Pangkas juga ukuran kertas' bila hasil crop tidak terlihat di pembaca PDF tertentu.",
      },
    ],
  },
  {
    id: "edit",
    title: "Edit & Tanda Tangan PDF",
    icon: <PenTool className={ic} />,
    tools: [
      {
        href: "/sign-pdf",
        title: "Tanda Tangan PDF",
        icon: <PenLine className={ic} />,
        summary: "Tempel tanda tangan di halaman PDF mana pun.",
        steps: [
          "Unggah satu file PDF.",
          "Buat tanda tangan: gambar dengan jari/mouse, ketik nama dengan font tulisan tangan, atau unggah foto tanda tangan (latar putih bisa dihapus).",
          "Tekan Tempel di halaman, lalu geser dan ubah ukurannya di atas halaman. Ulangi untuk halaman lain.",
          "Aktifkan tanggal bila perlu, lalu klik Terapkan dan unduh hasilnya.",
        ],
        tip: "Tanda tangan hanya ada di memori halaman ini dan tidak disimpan ke mana pun.",
      },
      {
        href: "/add-page-numbers",
        title: "Nomor Halaman PDF",
        icon: <ListOrdered className={ic} />,
        summary: "Tambahkan nomor halaman ke seluruh dokumen.",
        steps: [
          "Unggah satu file PDF.",
          "Pilih posisi, format (1, Hal. 1, 1 / 10, Halaman 1 dari 10), nomor mulai, ukuran font, dan margin.",
          "Atur Mulai dari halaman untuk melewati sampul. Pratinjau menunjukkan hasilnya.",
          "Klik Beri Nomor Halaman, lalu unduh PDF-nya.",
        ],
      },
      {
        href: "/fill-pdf-form",
        title: "Isi Formulir PDF",
        icon: <FormInput className={ic} />,
        summary: "Isi kolom formulir PDF langsung di browser.",
        steps: [
          "Unggah PDF berformulir; semua kolom tampil per halaman.",
          "Isi teks, centang kotak, atau pilih opsi.",
          "Aktifkan Ratakan formulir agar isian tidak bisa diedit lagi.",
          "Klik Simpan Formulir, lalu unduh hasilnya.",
        ],
        tip: "Jika PDF tidak punya kolom formulir, gunakan Tanda Tangan PDF atau Watermark PDF untuk menambah teks.",
      },
    ],
  },
  {
    id: "konversi",
    title: "Konversi",
    icon: <ArrowLeftRight className={ic} />,
    tools: [
      {
        href: "/pdf-to-image",
        title: "PDF ke Gambar",
        icon: <FileImage className={ic} />,
        summary: "Ubah setiap halaman PDF menjadi file gambar.",
        steps: [
          "Unggah satu file PDF.",
          "Pilih format (JPEG, PNG, atau WebP) dan resolusi dari Rendah sampai Ultra.",
          "Klik Konversi, lalu unduh per halaman atau semuanya sebagai ZIP.",
        ],
        tip: "Resolusi lebih tinggi menghasilkan gambar lebih tajam tetapi file lebih besar.",
      },
      {
        href: "/image-to-pdf",
        title: "Gambar ke PDF",
        icon: <Images className={ic} />,
        summary: "Jadikan foto atau hasil scan HP satu dokumen PDF.",
        steps: [
          "Tambahkan gambar JPG, PNG, atau WebP — satu gambar menjadi satu halaman.",
          "Atur urutan dengan tombol panah naik/turun.",
          "Pilih ukuran halaman (A4 atau sesuai gambar) dan margin.",
          "Klik Buat PDF untuk mengunduh hasilnya.",
        ],
      },
      {
        href: "/convert-image",
        title: "Konversi Gambar",
        icon: <Repeat className={ic} />,
        summary: "Ubah format gambar antara JPG, PNG, dan WebP.",
        steps: [
          "Tambahkan satu atau banyak gambar.",
          "Pilih format tujuan dan atur kualitas (untuk JPG & WebP).",
          "Klik Konversi, lalu unduh satuan atau sebagai ZIP.",
        ],
        tip: "JPG tidak mendukung transparansi — area transparan akan diisi putih.",
      },
      {
        href: "/heic-to-jpg",
        title: "HEIC ke JPG",
        icon: <Smartphone className={ic} />,
        summary: "Ubah foto HEIC/HEIF dari iPhone menjadi JPG atau PNG.",
        steps: [
          "Tambahkan satu atau banyak file .heic / .heif.",
          "Pilih JPG atau PNG, dan atur kualitas untuk JPG.",
          "Klik Konversi, lalu unduh satuan atau sebagai ZIP.",
        ],
        tip: "Konversi HEIC cukup berat; foto besar bisa memakan beberapa detik per file.",
      },
      {
        href: "/pdf-to-text",
        title: "PDF ke Teks",
        icon: <AlignLeft className={ic} />,
        summary: "Ekstrak teks dari PDF per halaman.",
        steps: [
          "Unggah satu file PDF dan klik Ekstrak Teks.",
          "Baca teks tiap halaman, lalu salin per halaman atau semuanya.",
          "Unduh sebagai satu file .txt, atau ZIP berisi satu file per halaman.",
        ],
        tip: "PDF hasil scan hampir tidak punya teks; alat akan memberi tahu bila itu yang terjadi.",
      },
    ],
  },
  {
    id: "optimasi",
    title: "Optimasi & Keamanan PDF",
    icon: <ShieldHalf className={ic} />,
    tools: [
      {
        href: "/compress-pdf",
        title: "Kompres PDF",
        icon: <Minimize2 className={ic} />,
        summary: "Perkecil ukuran file PDF.",
        steps: [
          "Unggah satu file PDF.",
          "Pilih tingkat kompresi: Ringan, Sedang (rekomendasi), atau Kuat. Atau pakai mode Target ukuran (mis. 500 KB) agar aplikasi mencari pengaturan yang pas.",
          "Klik Kompres, lihat perbandingan ukuran sebelum dan sesudah, lalu unduh.",
        ],
        tip: "Kompresi merender tiap halaman menjadi gambar, sehingga teks pada hasilnya tidak bisa diseleksi lagi.",
      },
      {
        href: "/redact-pdf",
        title: "Sensor PDF",
        icon: <EyeOff className={ic} />,
        summary: "Tutup data rahasia dengan kotak hitam.",
        steps: [
          "Unggah satu file PDF.",
          "Tarik di atas halaman untuk membuat kotak hitam; ulangi untuk halaman lain.",
          "Klik Sensor & Simpan. Halaman yang disensor dirender menjadi gambar sehingga teks di bawah kotak benar-benar hilang.",
        ],
        tip: "Teks di halaman yang disensor tidak bisa diseleksi lagi; halaman tanpa kotak tidak berubah.",
      },
      {
        href: "/remove-metadata",
        title: "Hapus Metadata",
        icon: <ShieldOff className={ic} />,
        summary: "Bersihkan data tersembunyi dari foto dan PDF.",
        steps: [
          "Tambahkan PDF atau gambar (bisa banyak file).",
          "Lihat metadata yang ditemukan, termasuk peringatan bila ada koordinat GPS.",
          "Klik Hapus Metadata, lalu unduh satuan atau ZIP.",
        ],
      },
      {
        href: "/grayscale-pdf",
        title: "PDF Hitam-Putih",
        icon: <Contrast className={ic} />,
        summary: "Ubah PDF berwarna menjadi grayscale.",
        steps: [
          "Unggah satu file PDF.",
          "Pilih kualitas Standar atau Tinggi.",
          "Klik Ubah ke Hitam-Putih, lalu unduh hasilnya.",
        ],
        tip: "Halaman dirender menjadi gambar, jadi teks pada hasil tidak bisa diseleksi.",
      },
      {
        href: "/lock-pdf",
        title: "Kunci PDF",
        icon: <Lock className={ic} />,
        summary: "Lindungi PDF dengan password.",
        steps: [
          "Unggah satu file PDF.",
          "Masukkan password (minimal 3 karakter) dan ulangi untuk konfirmasi.",
          "Klik Kunci PDF dan unduh dokumen terenkripsi.",
        ],
        tip: "Simpan password Anda baik-baik. GaweTools tidak bisa memulihkannya.",
      },
      {
        href: "/unlock-pdf",
        title: "Buka Kunci PDF",
        icon: <LockOpen className={ic} />,
        summary: "Hapus password dari PDF yang Anda ketahui kata sandinya.",
        steps: ["Unggah PDF yang terkunci.", "Masukkan password yang benar.", "Klik Buka Kunci dan unduh PDF tanpa proteksi."],
      },
      {
        href: "/watermark-pdf",
        title: "Watermark PDF",
        icon: <Stamp className={ic} />,
        summary: "Bubuhkan teks atau logo ke setiap halaman.",
        steps: [
          "Unggah satu file PDF.",
          "Pilih watermark berupa teks atau logo gambar, lalu atur warna, ukuran, rotasi, dan posisi.",
          "Periksa preview halaman pertama, lalu klik untuk memproses dan unduh.",
        ],
      },
    ],
  },
  {
    id: "gambar",
    title: "Edit Gambar",
    icon: <ImageIcon className={ic} />,
    tools: [
      {
        href: "/compress-image",
        title: "Kompres Gambar",
        icon: <ImageDown className={ic} />,
        summary: "Kecilkan ukuran file gambar tanpa terlihat buram.",
        steps: [
          "Tambahkan satu atau banyak gambar JPG, PNG, atau WebP.",
          "Pilih tingkat kompresi dan format keluaran, atau pakai mode Target ukuran (mis. 200 KB).",
          "Klik Kompres, lihat penghematan ukuran, lalu unduh satuan atau ZIP.",
        ],
      },
      {
        href: "/crop-image",
        title: "Crop Gambar",
        icon: <Crop className={ic} />,
        summary: "Potong gambar dengan area yang bisa digeser, atau pakai preset pas foto.",
        steps: [
          "Unggah satu gambar JPG, PNG, atau WebP.",
          "Pilih rasio: Bebas, 1:1, 3:4 (pas foto 3×4), 2:3 (4×6), 4:3, atau 16:9.",
          "Geser dan ubah ukuran kotak potong. Putar 90° atau balik gambar bila perlu.",
          "Klik Potong Gambar. Preset pas foto menghasilkan ukuran 300 dpi (3×4 = 354×472 px, 4×6 = 472×709 px).",
        ],
      },
      {
        href: "/photo-background",
        title: "Ganti Latar Pas Foto",
        icon: <UserRound className={ic} />,
        summary: "Ganti latar foto menjadi merah, biru, atau putih.",
        steps: [
          "Unggah foto; model AI diunduh sekali (sekitar 0,25 MB plus mesin WASM) lalu berjalan di browser Anda.",
          "Pilih warna latar (atau warna kustom), ukuran pas foto 3×4 / 4×6 pada 300 dpi, dan kehalusan tepi.",
          "Lihat hasilnya langsung di pratinjau, lalu unduh JPG atau lanjutkan ke Crop Gambar.",
        ],
        tip: "Pakai foto yang terang dengan wajah menghadap depan agar tepi rambut terpotong rapi.",
      },
      {
        href: "/resize-image",
        title: "Resize Gambar",
        icon: <Scaling className={ic} />,
        summary: "Ubah dimensi gambar secara massal.",
        steps: [
          "Tambahkan satu atau banyak gambar.",
          "Pilih mode piksel (lebar dan/atau tinggi) atau persentase.",
          "Aktifkan Kunci rasio agar proporsi gambar tidak berubah.",
          "Klik Resize, lalu unduh hasilnya.",
        ],
      },
      {
        href: "/watermark-image",
        title: "Watermark Gambar",
        icon: <Stamp className={ic} />,
        summary: "Beri watermark teks atau logo pada foto.",
        steps: [
          "Tambahkan satu atau banyak gambar.",
          "Atur teks atau logo, opasitas, ukuran, dan posisinya.",
          "Lihat preview, lalu proses dan unduh hasilnya.",
        ],
      },
    ],
  },
];

const FAQ = [
  {
    q: "Apakah file saya diunggah ke server?",
    a: "Tidak. Semua pemrosesan terjadi di browser Anda. File tidak pernah meninggalkan perangkat.",
  },
  {
    q: "Apakah ada batas jumlah atau ukuran file?",
    a: "Tidak ada kuota dari GaweTools. Batasnya hanya memori perangkat Anda, jadi file yang sangat besar bisa terasa lambat.",
  },
  {
    q: "Bisakah dipakai tanpa internet?",
    a: "Bisa, untuk halaman yang sudah pernah dibuka. Buka aplikasi sekali saat online, lalu pasang sebagai aplikasi (PWA) dari menu browser.",
  },
];

export default function GuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
      {/* Header */}
      <Reveal><header className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.05]">Panduan Penggunaan</h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          Semua alat dibuat sederhana: unggah file, atur pilihan, unduh hasilnya. Berikut langkah lengkap untuk tiap alat.
        </p>
        <p className="text-sm text-zinc-300 inline-flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
          Semua diproses di browser Anda, tanpa upload ke server.
        </p>

        <nav aria-label="Lompat ke kategori" className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-white hover:text-[#050505] transition-colors"
            >
              {c.title}
            </a>
          ))}
          <a
            href="#riwayat"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-white hover:text-[#050505] transition-colors"
          >
            Riwayat & FAQ
          </a>
        </nav>
      </header></Reveal>

      {/* Categories */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id} id={cat.id} className="space-y-5 scroll-mt-24">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 text-sky-400 flex items-center justify-center shrink-0">{cat.icon}</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{cat.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cat.tools.map((tool, i) => (
              <Reveal key={tool.href} delay={(i % 2) * 0.08} className="h-full">
              <article
                className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-500/50 p-6 rounded-2xl bg-zinc-950 border border-zinc-700/70 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-950/60 text-sky-400 flex items-center justify-center shrink-0">{tool.icon}</div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100">{tool.title}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">{tool.summary}</p>
                  </div>
                </div>

                <ol className="mt-5 space-y-3 flex-1">
                  {tool.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-sky-950/60 border border-sky-900/60 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-px">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {tool.tip && (
                  <p className="mt-4 flex items-start gap-2 text-xs sm:text-[13px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 leading-relaxed">
                    <Lightbulb className="w-4 h-4 text-sky-500 shrink-0 mt-px" />
                    <span>{tool.tip}</span>
                  </p>
                )}

                <Link
                  href={tool.href}
                  className="group mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm font-semibold text-sky-400 hover:text-sky-300"
                >
                  <span>Coba {tool.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </article>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      {/* History + FAQ */}
      <section id="riwayat" className="space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 text-sky-400 flex items-center justify-center shrink-0">
            <History className={ic} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Riwayat & Pertanyaan Umum</h2>
        </div>

        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          Setiap file yang Anda unduh dicatat di halaman{" "}
          <Link href="/history" className="text-sky-400 font-semibold hover:underline">
            Riwayat
          </Link>
          . Yang tersimpan hanya nama file, alat yang dipakai, ukuran, dan waktu — di perangkat Anda sendiri, bukan isi filenya. Anda bisa menghapusnya kapan saja.
        </p>

        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.08}>
            <div className="h-full p-5 rounded-2xl bg-zinc-950 border border-zinc-700/70 shadow-xs">
              <dt className="font-bold text-zinc-100 text-sm sm:text-base">{item.q}</dt>
              <dd className="mt-2 text-sm text-zinc-400 leading-relaxed">{item.a}</dd>
            </div>
            </Reveal>
          ))}
        </dl>
      </section>
    </div>
  );
}
