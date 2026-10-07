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
  ArrowRight,
  FileStack,
  ArrowLeftRight,
  ShieldHalf,
  ImageIcon,
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
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <motion.div variants={popIn} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="h-full">
    <Link
      href={tool.href}
      className="group relative flex h-full flex-col justify-between p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-700/70 hover:border-sky-400 dark:hover:border-sky-500/60 shadow-xs hover:shadow-xl hover:shadow-sky-500/10 transition-[border-color,box-shadow] duration-200"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
            {tool.icon}
          </div>
          {tool.badge && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
              {tool.badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{tool.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-3">{tool.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-sm font-semibold text-sky-600 dark:text-sky-400">
        <span>Buka Tool</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
      <motion.button
        key={id}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveCategory(id)}
        className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          active ? "text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
        }`}
      >
        {active && <motion.span layoutId="active-chip" className="absolute inset-0 rounded-full bg-sky-500 shadow-md shadow-sky-500/30" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
        <span className="relative">{label}</span>
      </motion.button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* COMPACT HEADER + SEARCH */}
      <motion.section initial="hidden" animate="show" variants={stagger(0.1)} className="text-center max-w-2xl mx-auto space-y-4">
        <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
          Pilih alat yang Anda butuhkan
        </motion.h1>
        <motion.p variants={fadeUp} className="text-base text-gray-600 dark:text-zinc-300 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
          <span>Diproses di browser, file tidak diunggah ke server.</span>
        </motion.p>

        <motion.div variants={fadeUp} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400 group-focus-within:text-sky-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tool... (cth: Gabung PDF, Kompres, Watermark)"
            className="w-full pl-12 pr-4 py-3 text-sm sm:text-base rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 shadow-md shadow-gray-200/50 dark:shadow-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md"
              >
                Reset
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <LayoutGroup>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
            {renderChip("all", `Semua (${TOTAL_TOOLS})`)}
            {CATEGORIES.map((c) => renderChip(c.id, `${c.title} (${c.tools.length})`))}
          </motion.div>
        </LayoutGroup>
      </motion.section>

      {/* TOOLS PER CATEGORY */}
      <AnimatePresence mode="popLayout">
      {visibleCategories.length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Tidak ada alat yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="mt-3 text-xs font-semibold text-sky-500 hover:underline"
          >
            Lihat semua alat
          </button>
        </motion.div>
      ) : (
        visibleCategories.map((c) => (
          <motion.section
            key={c.id}
            id={c.id}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger(0.08)}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 scroll-mt-24"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-zinc-700">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{c.title}</h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400">{c.description}</p>
              </div>
            </motion.div>
            <motion.div variants={stagger(0.07)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {c.tools.map((tool) => (
                <ToolCard key={tool.href} tool={tool} />
              ))}
            </motion.div>
          </motion.section>
        ))
      )}
      </AnimatePresence>
    </div>
  );
}
