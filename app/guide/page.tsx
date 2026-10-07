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
          "Pilih tingkat kompresi: Ringan, Sedang (rekomendasi), atau Kuat.",
          "Klik Kompres, lihat perbandingan ukuran sebelum dan sesudah, lalu unduh.",
        ],
        tip: "Kompresi merender tiap halaman menjadi gambar, sehingga teks pada hasilnya tidak bisa diseleksi lagi.",
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
          "Pilih tingkat kompresi dan format keluaran.",
          "Klik Kompres, lihat penghematan ukuran, lalu unduh satuan atau ZIP.",
        ],
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
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">Panduan Penggunaan</h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-zinc-400 leading-relaxed">
          Semua alat dibuat sederhana: unggah file, atur pilihan, unduh hasilnya. Berikut langkah lengkap untuk tiap alat.
        </p>
        <p className="text-sm text-gray-600 dark:text-zinc-300 inline-flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
          Semua diproses di browser Anda, tanpa upload ke server.
        </p>

        <nav aria-label="Lompat ke kategori" className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition-colors"
            >
              {c.title}
            </a>
          ))}
          <a
            href="#riwayat"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition-colors"
          >
            Riwayat & FAQ
          </a>
        </nav>
      </header></Reveal>

      {/* Categories */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id} id={cat.id} className="space-y-5 scroll-mt-24">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">{cat.icon}</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{cat.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cat.tools.map((tool, i) => (
              <Reveal key={tool.href} delay={(i % 2) * 0.08} className="h-full">
              <article
                className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-300 dark:hover:border-sky-500/50 p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-700/70 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">{tool.icon}</div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{tool.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5">{tool.summary}</p>
                  </div>
                </div>

                <ol className="mt-5 space-y-3 flex-1">
                  {tool.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-px">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {tool.tip && (
                  <p className="mt-4 flex items-start gap-2 text-xs sm:text-[13px] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 leading-relaxed">
                    <Lightbulb className="w-4 h-4 text-sky-500 shrink-0 mt-px" />
                    <span>{tool.tip}</span>
                  </p>
                )}

                <Link
                  href={tool.href}
                  className="group mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
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
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
            <History className={ic} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Riwayat & Pertanyaan Umum</h2>
        </div>

        <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed">
          Setiap file yang Anda unduh dicatat di halaman{" "}
          <Link href="/history" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
            Riwayat
          </Link>
          . Yang tersimpan hanya nama file, alat yang dipakai, ukuran, dan waktu — di perangkat Anda sendiri, bukan isi filenya. Anda bisa menghapusnya kapan saja.
        </p>

        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.08}>
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-700/70 shadow-xs">
              <dt className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">{item.q}</dt>
              <dd className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{item.a}</dd>
            </div>
            </Reveal>
          ))}
        </dl>
      </section>
    </div>
  );
}
