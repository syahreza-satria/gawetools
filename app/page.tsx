"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { fadeUp, popIn, stagger } from "@/components/motion";
import {
  Files,
  Scissors,
  Minimize2,
  Lock,
  LockOpen,
  LayoutGrid,
  Stamp,
  ImageDown,
  FileImage,
  Images,
  RotateCw,
  Scaling,
  Repeat,
  Search,
  ShieldCheck,
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
  ScanText,
  ScanLine,
  FileDiff,
  BookOpen,
  QrCode,
  Shapes,
  ArrowUpRight,
  ArrowDown,
} from "lucide-react";

interface Tool {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  tools: Tool[];
}

const iconCls = "w-5 h-5";

const CATEGORIES: Category[] = [
  {
    id: "atur",
    title: "Atur Dokumen PDF",
    description: "Gabung, potong, susun ulang, dan putar halaman PDF.",
    icon: <FileStack className="w-5 h-5" />,
    tools: [
      {
        href: "/merge-pdf",
        icon: <Files className={iconCls} />,
        title: "Gabung PDF",
        description: "Gabungkan dua atau lebih file PDF jadi satu dokumen dengan susunan urutan bebas.",
        badge: "Populer",
      },
      {
        href: "/split-pdf",
        icon: <Scissors className={iconCls} />,
        title: "Potong PDF",
        description: "Pisahkan halaman dokumen PDF menjadi berkas baru atau ambil rentang halaman.",
      },
      {
        href: "/reorder-pdf",
        icon: <LayoutGrid className={iconCls} />,
        title: "Atur Halaman PDF",
        description: "Susun ulang posisi halaman PDF dengan drag & drop mudah, atau hapus halaman tertentu.",
        badge: "Baru",
      },
      {
        href: "/rotate-pdf",
        icon: <RotateCw className={iconCls} />,
        title: "Putar PDF",
        description: "Putar semua atau sebagian halaman PDF ke kiri dan kanan, lalu simpan hasilnya.",
        badge: "Baru",
      },
      {
        href: "/crop-pdf",
        icon: <Crop className={iconCls} />,
        title: "Crop PDF",
        description: "Pangkas margin halaman PDF dengan memilih area di pratinjau atau mengisi margin dalam mm.",
        badge: "Baru",
      },
      {
        href: "/compare-pdf",
        icon: <FileDiff className={iconCls} />,
        title: "Bandingkan PDF",
        description: "Bandingkan teks dua versi PDF berdampingan dengan sorotan tambah dan hapus.",
        badge: "Baru",
      },
      {
        href: "/booklet-pdf",
        icon: <BookOpen className={iconCls} />,
        title: "Cetak Booklet",
        description: "Susun halaman PDF 2-up untuk dicetak bolak-balik, dilipat tengah, lalu dijilid jadi buku.",
        badge: "Baru",
      },
    ],
  },
  {
    id: "edit",
    title: "Edit & Tanda Tangan PDF",
    description: "Tanda tangani dokumen dan tambahkan nomor halaman.",
    icon: <PenTool className="w-5 h-5" />,
    tools: [
      {
        href: "/sign-pdf",
        icon: <PenLine className={iconCls} />,
        title: "Tanda Tangan PDF",
        description: "Gambar, ketik, atau unggah tanda tangan lalu tempel di halaman mana pun, lengkap dengan tanggal.",
        badge: "Baru",
      },
      {
        href: "/add-page-numbers",
        icon: <ListOrdered className={iconCls} />,
        title: "Nomor Halaman PDF",
        description: "Beri nomor halaman dengan pilihan posisi, format, nomor mulai, dan lewati halaman sampul.",
        badge: "Baru",
      },
      {
        href: "/fill-pdf-form",
        icon: <FormInput className={iconCls} />,
        title: "Isi Formulir PDF",
        description: "Isi kolom formulir PDF (teks, centang, pilihan) lalu ratakan agar tidak bisa diedit lagi.",
        badge: "Baru",
      },
    ],
  },
  {
    id: "konversi",
    title: "Konversi",
    description: "Ubah antara PDF dan gambar, atau antar format gambar.",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    tools: [
      {
        href: "/pdf-to-image",
        icon: <FileImage className={iconCls} />,
        title: "PDF ke Gambar",
        description: "Konversi tiap lembar halaman PDF menjadi file gambar JPEG, PNG, atau WebP resolusi tinggi.",
        badge: "Baru",
      },
      {
        href: "/image-to-pdf",
        icon: <Images className={iconCls} />,
        title: "Gambar ke PDF",
        description: "Gabungkan foto atau hasil scan dari HP menjadi satu dokumen PDF dengan urutan bebas.",
        badge: "Baru",
      },
      {
        href: "/convert-image",
        icon: <Repeat className={iconCls} />,
        title: "Konversi Gambar",
        description: "Ubah format gambar antara JPG, PNG, dan WebP dengan pengaturan kualitas.",
        badge: "Baru",
      },
      {
        href: "/heic-to-jpg",
        icon: <Smartphone className={iconCls} />,
        title: "HEIC ke JPG",
        description: "Ubah foto HEIC/HEIF dari iPhone menjadi JPG atau PNG yang bisa dibuka di mana saja.",
        badge: "Baru",
      },
      {
        href: "/pdf-to-text",
        icon: <AlignLeft className={iconCls} />,
        title: "PDF ke Teks",
        description: "Ekstrak teks dari PDF per halaman, salin langsung, atau unduh sebagai .txt atau ZIP.",
        badge: "Baru",
      },
      {
        href: "/ocr",
        icon: <ScanText className={iconCls} />,
        title: "OCR",
        description: "Kenali teks dari foto atau PDF scan (Indonesia & Inggris), lalu buat PDF yang bisa dicari.",
        badge: "Baru",
      },
      {
        href: "/scan-document",
        icon: <ScanLine className={iconCls} />,
        title: "Scan Dokumen",
        description: "Foto dokumen dengan kamera, luruskan sudutnya, pilih filter, dan simpan sebagai PDF.",
        badge: "Baru",
      },
    ],
  },
  {
    id: "optimasi",
    title: "Optimasi & Keamanan PDF",
    description: "Perkecil ukuran, beri atau buka password, dan tambahkan watermark.",
    icon: <ShieldHalf className="w-5 h-5" />,
    tools: [
      {
        href: "/compress-pdf",
        icon: <Minimize2 className={iconCls} />,
        title: "Kompres PDF",
        description: "Kecilkan ukuran dokumen PDF hingga efisien namun tetap tajam dan terbaca.",
        badge: "Favorit",
      },
      {
        href: "/lock-pdf",
        icon: <Lock className={iconCls} />,
        title: "Kunci PDF",
        description: "Beri proteksi enkripsi password pada dokumen penting Anda dari akses luar.",
      },
      {
        href: "/unlock-pdf",
        icon: <LockOpen className={iconCls} />,
        title: "Buka Kunci PDF",
        description: "Hapus kata sandi proteksi dari PDF Anda secara instan tanpa mengunggah ke server.",
        badge: "Baru",
      },
      {
        href: "/watermark-pdf",
        icon: <Stamp className={iconCls} />,
        title: "Watermark PDF",
        description: "Bubuhkan watermark teks atau logo kustom ke setiap halaman dokumen PDF.",
        badge: "Baru",
      },
      {
        href: "/redact-pdf",
        icon: <EyeOff className={iconCls} />,
        title: "Sensor PDF",
        description: "Tutup data rahasia dengan kotak hitam; halaman disensor diratakan agar teksnya benar-benar hilang.",
        badge: "Baru",
      },
      {
        href: "/remove-metadata",
        icon: <ShieldOff className={iconCls} />,
        title: "Hapus Metadata",
        description: "Lihat dan hapus EXIF, lokasi GPS, serta info penulis dari foto dan PDF sebelum dibagikan.",
        badge: "Baru",
      },
      {
        href: "/grayscale-pdf",
        icon: <Contrast className={iconCls} />,
        title: "PDF Hitam-Putih",
        description: "Ubah dokumen PDF berwarna menjadi hitam-putih untuk hemat tinta saat mencetak.",
        badge: "Baru",
      },
    ],
  },
  {
    id: "lainnya",
    title: "Lainnya",
    description: "Alat bantu praktis di luar PDF dan gambar.",
    icon: <Shapes className="w-5 h-5" />,
    tools: [
      {
        href: "/qr-code",
        icon: <QrCode className={iconCls} />,
        title: "QR Code",
        description: "Buat QR code untuk tautan, WiFi, atau kontak, dan pindai QR code dari kamera atau gambar.",
        badge: "Baru",
      },
    ],
  },
  {
    id: "gambar",
    title: "Edit Gambar",
    description: "Kompres, ubah ukuran, dan beri watermark pada gambar.",
    icon: <ImageIcon className="w-5 h-5" />,
    tools: [
      {
        href: "/compress-image",
        icon: <ImageDown className={iconCls} />,
        title: "Kompres Gambar",
        description: "Kecilkan resolusi & ukuran file gambar JPG, PNG, WebP secara cepat tanpa buram.",
        badge: "Populer",
      },
      {
        href: "/resize-image",
        icon: <Scaling className={iconCls} />,
        title: "Resize Gambar",
        description: "Ubah dimensi gambar dalam piksel atau persentase, bisa banyak file sekaligus.",
        badge: "Baru",
      },
      {
        href: "/watermark-image",
        icon: <Stamp className={iconCls} />,
        title: "Watermark Gambar",
        description: "Tambahkan watermark hak cipta teks atau logo grafis transparan di foto Anda.",
      },
      {
        href: "/crop-image",
        icon: <Crop className={iconCls} />,
        title: "Crop Gambar",
        description: "Potong gambar dengan area bebas atau rasio tetap, termasuk preset pas foto 3×4 dan 4×6.",
        badge: "Baru",
      },
      {
        href: "/photo-background",
        icon: <UserRound className={iconCls} />,
        title: "Ganti Latar Pas Foto",
        description: "Hapus latar foto lalu ganti merah, biru, atau putih dengan AI yang jalan di browser Anda.",
        badge: "Baru",
      },
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);
const ALL_TOOL_TITLES = CATEGORIES.flatMap((c) => c.tools.map((t) => t.title));

const pad = (n: number) => String(n).padStart(2, "0");

/** Large mask-reveal line used by the hero headline. */
function RevealLine({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function ToolTile({ tool, feature }: { tool: Tool; feature: boolean }) {
  return (
    <motion.div
      variants={popIn}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className={feature ? "sm:col-span-2" : ""}
    >
      <Link
        href={tool.href}
        className={
          "group relative flex h-full min-h-52 flex-col justify-between gap-8 p-6 rounded-lg border transition-colors duration-200 " +
          (feature
            ? "bg-[#f4f4f4] border-[#f4f4f4] text-[#050505] hover:bg-white"
            : "bg-zinc-950 border-zinc-800 text-white hover:border-zinc-500 hover:bg-zinc-900")
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={
              "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 " +
              (feature ? "bg-[#050505] text-white" : "bg-zinc-900 border border-zinc-800 text-white")
            }
          >
            {tool.icon}
          </div>
          {tool.badge && (
            <span
              className={
                "label-mono text-[10px] px-2.5 py-1 rounded-full border " +
                (feature ? "border-[#050505]/30 text-[#050505]" : "border-zinc-700 text-zinc-300")
              }
            >
              {tool.badge}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h3 className={"font-medium tracking-tight " + (feature ? "text-2xl sm:text-3xl" : "text-lg")}>{tool.title}</h3>
          <p className={"text-sm leading-relaxed line-clamp-3 " + (feature ? "text-[#050505]/70 max-w-md" : "text-zinc-400")}>{tool.description}</p>
        </div>

        <div className={"label-mono flex items-center justify-between " + (feature ? "text-[#050505]" : "text-zinc-300")}>
          <span>Buka alat</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const query = searchQuery.trim().toLowerCase();

  const visibleCategories = CATEGORIES.filter((c) => activeCategory === "all" || c.id === activeCategory)
    .map((c) => ({
      ...c,
      tools: c.tools.filter((t) => !query || t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)),
    }))
    .filter((c) => c.tools.length > 0);

  const renderChip = (id: string, label: string) => {
    const active = activeCategory === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveCategory(id)}
        className={
          "relative label-mono px-4 py-2 rounded-full border transition-colors " +
          (active ? "text-[#050505] border-white" : "text-zinc-300 border-zinc-800 hover:border-zinc-500 hover:text-white")
        }
      >
        {active && <motion.span layoutId="active-chip" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
        <span className="relative">{label}</span>
      </button>
    );
  };

  return (
    <div>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden border-b border-zinc-900">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="ambient-orb absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
          <div className="ambient-orb-slow absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:25%_100%] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger(0.12, 0.1)}
            className="flex items-center justify-between label-mono text-zinc-400"
          >
            <motion.span variants={fadeUp}>GaweTools &trade; / Utilitas Dokumen</motion.span>
            <motion.span variants={fadeUp} className="hidden sm:inline">
              {pad(TOTAL_TOOLS) + " alat // 100% di browser"}
            </motion.span>
          </motion.div>

          <h1 className="mt-10 sm:mt-14 text-[clamp(3.25rem,14vw,12.5rem)] font-medium leading-[0.92] tracking-[-0.045em] text-white">
            <RevealLine>
              Gawe<span className="text-zinc-500">Tools</span>
              <sup className="ml-1 align-top text-[0.18em] font-normal tracking-normal text-zinc-400">&trade;</sup>
            </RevealLine>
          </h1>

          <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-end">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl sm:text-2xl lg:text-3xl font-medium leading-snug tracking-tight text-white max-w-xl"
            >
              Gabung, potong, kompres, tanda tangani, dan konversi PDF serta gambar &mdash; tanpa mengunggah satu file pun.
            </motion.p>

            <motion.ul
              initial="hidden"
              animate="show"
              variants={stagger(0.12, 0.7)}
              className="space-y-4 border-t border-zinc-800 pt-5"
            >
              {[
                ["01-A.", "Semua proses berjalan di perangkat Anda."],
                ["02-B.", "Gratis, tanpa akun, bisa dipakai offline."],
                ["03-C.", "Tanpa upload // 0 byte meninggalkan browser."],
              ].map(([idx, text]) => (
                <motion.li key={idx} variants={fadeUp} className="flex gap-4 text-sm text-zinc-300">
                  <span className="label-mono text-zinc-500 shrink-0 w-12">{idx}</span>
                  <span>{text}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a
              href="#alat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#050505] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors"
            >
              Jelajahi {TOTAL_TOOLS} alat
              <ArrowDown className="w-4 h-4" />
            </a>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-700 text-white text-sm font-semibold hover:border-zinc-400 transition-colors"
            >
              Panduan
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ───────── MARQUEE ───────── */}
      <div aria-hidden className="relative overflow-hidden border-b border-zinc-900 py-4">
        <div className="marquee-track flex w-max items-center gap-8 label-mono text-zinc-500">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 shrink-0">
              {ALL_TOOL_TITLES.map((t) => (
                <span key={dup + t} className="flex items-center gap-8 whitespace-nowrap">
                  {t}
                  <span className="text-zinc-700">{"//"}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ───────── TOOLS ───────── */}
      <div id="alat" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-14 scroll-mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-end">
          <div className="space-y-3">
            <p className="label-mono text-zinc-500">{"04-D. // Temukan alat"}</p>
            <h2 className="text-4xl sm:text-5xl leading-[1.04] text-white">
              Pilih alat yang
              <br />
              Anda butuhkan.
            </h2>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari alat: gabung, kompres, tanda tangan..."
                aria-label="Cari alat"
                className="w-full pl-12 pr-20 py-3.5 text-sm rounded-lg bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-500 transition-colors"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 label-mono text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-md"
                  >
                    Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <LayoutGroup>
              <div className="flex flex-wrap items-center gap-2">
                {renderChip("all", "Semua (" + TOTAL_TOOLS + ")")}
                {CATEGORIES.map((c) => renderChip(c.id, c.title.split(" & ")[0] + " (" + c.tools.length + ")"))}
              </div>
            </LayoutGroup>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {visibleCategories.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 rounded-lg border border-dashed border-zinc-800"
            >
              <p className="text-zinc-400 text-sm">Tidak ada alat yang cocok dengan &ldquo;{searchQuery}&rdquo;.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-3 label-mono text-white underline underline-offset-4"
              >
                Lihat semua alat
              </button>
            </motion.div>
          ) : (
            visibleCategories.map((c, idx) => (
              <motion.section
                key={c.id}
                id={c.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={stagger(0.06)}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 scroll-mt-24"
              >
                <motion.div variants={fadeUp} className="flex items-end justify-between gap-6 border-b border-zinc-800 pb-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="label-mono text-zinc-500 pt-2 shrink-0">{pad(idx + 1)}</span>
                    <div className="min-w-0">
                      <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">{c.title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{c.description}</p>
                    </div>
                  </div>
                  <span className="label-mono text-zinc-500 shrink-0 hidden sm:block">{pad(c.tools.length)} alat</span>
                </motion.div>

                <motion.div variants={stagger(0.06)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {c.tools.map((tool, i) => (
                    <ToolTile key={tool.href} tool={tool} feature={i === 0 && !query} />
                  ))}
                </motion.div>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ───────── STATEMENT ───────── */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-end">
          <h2 className="text-4xl sm:text-6xl leading-[1.02] text-white">
            File Anda tidak pernah
            <br />
            <span className="text-zinc-500">meninggalkan perangkat.</span>
          </h2>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p className="label-mono text-zinc-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {"Privasi // Client-side"}
            </p>
            <p>
              Setiap alat berjalan langsung di browser: tidak ada server pemrosesan, tidak ada akun, tidak ada analitik. Mesin OCR dan AI pun dimuat dari
              situs ini dan dijalankan secara lokal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
