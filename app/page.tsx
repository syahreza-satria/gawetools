"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  Search,
  ShieldCheck,
  Zap,
  HardDriveDownload,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
} from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "pdf" | "image">("all");

  const documentTools = [
    {
      href: "/merge-pdf",
      icon: <Files className="w-5 h-5" />,
      title: "Gabung PDF",
      description: "Gabungkan dua atau lebih file PDF jadi satu dokumen dengan susunan urutan bebas.",
      badge: "Populer",
      category: "pdf",
    },
    {
      href: "/split-pdf",
      icon: <Scissors className="w-5 h-5" />,
      title: "Potong PDF",
      description: "Pisahkan halaman dokumen PDF menjadi berkas baru atau ambil rentang halaman.",
      category: "pdf",
    },
    {
      href: "/compress-pdf",
      icon: <Minimize2 className="w-5 h-5" />,
      title: "Kompres PDF",
      description: "Kecilkan ukuran dokumen PDF hingga efisien namun tetap tajam dan terbaca.",
      badge: "Favorit",
      category: "pdf",
    },
    {
      href: "/reorder-pdf",
      icon: <LayoutGrid className="w-5 h-5" />,
      title: "Atur Halaman PDF",
      description: "Susun ulang posisi halaman PDF dengan drag & drop mudah, atau hapus halaman tertentu.",
      badge: "Baru",
      category: "pdf",
    },
    {
      href: "/lock-pdf",
      icon: <Lock className="w-5 h-5" />,
      title: "Kunci PDF",
      description: "Beri proteksi enkripsi password pada dokumen penting Anda dari akses luar.",
      category: "pdf",
    },
    {
      href: "/unlock-pdf",
      icon: <LockOpen className="w-5 h-5" />,
      title: "Buka Kunci PDF",
      description: "Hapus kata sandi proteksi dari PDF Anda secara instan tanpa mengunggah ke server.",
      badge: "Baru",
      category: "pdf",
    },
    {
      href: "/watermark-pdf",
      icon: <Stamp className="w-5 h-5" />,
      title: "Watermark PDF",
      description: "Bubuhkan watermark teks atau logo kustom ke setiap halaman dokumen PDF.",
      badge: "Baru",
      category: "pdf",
    },
    {
      href: "/pdf-to-image",
      icon: <FileImage className="w-5 h-5" />,
      title: "PDF ke Gambar",
      description: "Konversi tiap lembar halaman PDF menjadi file gambar JPEG, PNG, atau WebP resolusi tinggi.",
      badge: "Baru",
      category: "pdf",
    },
  ];

  const imageTools = [
    {
      href: "/compress-image",
      icon: <ImageDown className="w-5 h-5" />,
      title: "Kompres Gambar",
      description: "Kecilkan resolusi & ukuran file gambar JPG, PNG, WebP secara cepat tanpa buram.",
      badge: "Populer",
      category: "image",
    },
    {
      href: "/watermark-image",
      icon: <Stamp className="w-5 h-5" />,
      title: "Watermark Gambar",
      description: "Tambahkan watermark hak cipta teks atau logo grafis transparan di foto Anda.",
      category: "image",
    },
  ];

  const allTools = useMemo(() => [...documentTools, ...imageTools], []);

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchCategory =
        activeCategory === "all" || tool.category === activeCategory;
      const matchSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allTools, activeCategory, searchQuery]);

  return (
    <div className="relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
            Solusi Pintar Dokumen & Gambar, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400">
              Privasi Mutlak Terjaga
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Gabung, kompres, potong, kunci, atur halaman PDF dan edit gambar tanpa upload file ke server. Cepat, bebas kuota, dan sepenuhnya gratis.
          </p>

          {/* Interactive Search & Filter Bar */}
          <div className="pt-2 max-w-xl mx-auto space-y-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tool... (cth: Gabung PDF, Kompres, Watermark)"
                className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 shadow-md shadow-gray-200/50 dark:shadow-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === "all"
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                    : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
                }`}
              >
                Semua ({allTools.length})
              </button>
              <button
                onClick={() => setActiveCategory("pdf")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === "pdf"
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                    : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
                }`}
              >
                PDF Tools ({documentTools.length})
              </button>
              <button
                onClick={() => setActiveCategory("image")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === "image"
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                    : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
                }`}
              >
                Gambar Tools ({imageTools.length})
              </button>
            </div>
          </div>
        </section>

        {/* VALUE PILLARS / METRICS STRIP */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">100% Privat</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Nol data diunggah</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Instan & Cepat</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">WebAssembly lokal</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Bebas Kuota</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">File ukuran besar</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 shadow-xs backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">10 Alat Siap Pakai</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Terus bertambah</div>
            </div>
          </div>
        </section>

        {/* TOOLS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-500" />
                <span>Koleksi Alat GaweTools</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Pilih alat yang Anda butuhkan untuk memulai pekerjaan dokumen secara cepat.
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 hidden sm:inline">
              Menampilkan {filteredTools.length} dari {allTools.length} alat
            </span>
          </div>

          {filteredTools.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
              <p className="text-gray-500 dark:text-zinc-400 text-sm">
                Tidak ada alat yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-xs font-semibold text-sky-500 hover:underline"
              >
                Lihat semua alat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 hover:border-sky-400 dark:hover:border-sky-500/60 shadow-xs hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all">
                        {tool.icon}
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-medium text-sky-600 dark:text-sky-400">
                    <span>Buka Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* WORKFLOW / PRIVACY BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 dark:from-sky-950/80 dark:to-zinc-900 border border-sky-400/20 text-white p-8 sm:p-12 shadow-xl shadow-sky-500/10">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              Teknologi Modern Client-Side
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Kerahasiaan Dokumen Adalah Prioritas Nomor Satu
            </h2>
            <p className="text-sky-100 dark:text-zinc-300 text-sm sm:text-base leading-relaxed">
              Semua kompresi, enkripsi, konversi, dan watermarking diproses menggunakan engine PDF-Lib, Canvas API, dan Web Worker langsung di peramban Anda. Dokumen kerja, KTP, laporan keuangan, dan foto pribadi Anda tidak pernah meninggalkan komputer.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sky-700 dark:text-zinc-900 font-semibold text-sm hover:bg-sky-50 transition-colors shadow-sm"
              >
                <span>Baca Panduan Selengkapnya</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors border border-white/20"
              >
                <span>Tentang GaweTools</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
