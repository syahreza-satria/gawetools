"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Files,
  Scissors,
  Minimize2,
  Lock,
  LockOpen,
  LayoutGrid,
  Stamp,
  FileImage,
  ImageDown,
  ChevronDown,
  Menu,
  X,
  FileText,
  ImageIcon,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isImgOpen, setIsImgOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pdfRef.current && !pdfRef.current.contains(event.target as Node)) {
        setIsPdfOpen(false);
      }
      if (imgRef.current && !imgRef.current.contains(event.target as Node)) {
        setIsImgOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsPdfOpen(false);
    setIsImgOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const pdfTools = [
    {
      href: "/merge-pdf",
      title: "Gabung PDF",
      desc: "Satukan beberapa PDF jadi satu file",
      icon: <Files className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/split-pdf",
      title: "Potong PDF",
      desc: "Pisahkan atau ambil rentang halaman",
      icon: <Scissors className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/compress-pdf",
      title: "Kompres PDF",
      desc: "Perkecil ukuran dokumen PDF",
      icon: <Minimize2 className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/reorder-pdf",
      title: "Atur Halaman PDF",
      desc: "Urutkan atau hapus halaman",
      icon: <LayoutGrid className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/lock-pdf",
      title: "Kunci PDF",
      desc: "Beri proteksi password pada PDF",
      icon: <Lock className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/unlock-pdf",
      title: "Buka Kunci PDF",
      desc: "Hilangkan password dari dokumen PDF",
      icon: <LockOpen className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/watermark-pdf",
      title: "Watermark PDF",
      desc: "Tambahkan teks cap / watermark",
      icon: <Stamp className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/pdf-to-image",
      title: "PDF ke Gambar",
      desc: "Konversi PDF ke format JPEG / PNG",
      icon: <FileImage className="w-4 h-4 text-sky-500" />,
    },
  ];

  const imageTools = [
    {
      href: "/compress-image",
      title: "Kompres Gambar",
      desc: "Kecilkan file JPEG, PNG, dan WebP",
      icon: <ImageDown className="w-4 h-4 text-sky-500" />,
    },
    {
      href: "/watermark-image",
      title: "Watermark Gambar",
      desc: "Beri watermark teks atau logo gambar",
      icon: <Stamp className="w-4 h-4 text-sky-500" />,
    },
  ];

  const isPdfActive = pdfTools.some((t) => pathname === t.href);
  const isImgActive = imageTools.some((t) => pathname === t.href);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 p-1 flex items-center justify-center border border-sky-100 dark:border-sky-900 group-hover:scale-105 transition-transform">
            <Image
              src="/logo_gawetools.png"
              alt="GaweTools Logo"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Gawe<span className="text-sky-500 font-extrabold">Tools</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {/* PDF Tools Dropdown */}
          <div className="relative" ref={pdfRef}>
            <button
              onClick={() => {
                setIsPdfOpen((prev) => !prev);
                setIsImgOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isPdfActive || isPdfOpen
                  ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
                  : "text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
              }`}
            >
              <FileText className="w-4 h-4 text-sky-500" />
              <span>PDF Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isPdfOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mega Dropdown Panel for PDF */}
            {isPdfOpen && (
              <div className="absolute top-full left-0 mt-2 w-[480px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/60 p-3 grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="col-span-2 px-3 py-1.5 mb-1 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    Alat Kelola PDF
                  </span>
                  <span className="text-[11px] font-medium text-sky-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 100% Client-Side
                  </span>
                </div>
                {pdfTools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setIsPdfOpen(false)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                      pathname === tool.href
                        ? "bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/60 border border-transparent"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-sky-50 dark:bg-zinc-800 text-sky-500 shrink-0">
                      {tool.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {tool.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">
                        {tool.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Image Tools Dropdown */}
          <div className="relative" ref={imgRef}>
            <button
              onClick={() => {
                setIsImgOpen((prev) => !prev);
                setIsPdfOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isImgActive || isImgOpen
                  ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
                  : "text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
              }`}
            >
              <ImageIcon className="w-4 h-4 text-sky-500" />
              <span>Gambar Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isImgOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Panel for Image */}
            {isImgOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/60 p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 mb-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    Alat Edit Gambar
                  </span>
                </div>
                {imageTools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setIsImgOpen(false)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                      pathname === tool.href
                        ? "bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/60 border border-transparent"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-sky-50 dark:bg-zinc-800 text-sky-500 shrink-0">
                      {tool.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {tool.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">
                        {tool.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 mx-1.5" />

          {/* Guide Link */}
          <Link
            href="/guide"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === "/guide"
                ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 font-semibold"
                : "text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
            }`}
          >
            Panduan
          </Link>

          {/* About Link */}
          <Link
            href="/about"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === "/about"
                ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 font-semibold"
                : "text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
            }`}
          >
            Tentang Kami
          </Link>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* PDF Tools Section */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span>Dokumen PDF</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {pdfTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors ${
                    pathname === tool.href
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-medium"
                      : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-sky-50 dark:bg-zinc-900">
                    {tool.icon}
                  </div>
                  <span>{tool.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Image Tools Section */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
              <span>Gambar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {imageTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors ${
                    pathname === tool.href
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-medium"
                      : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-sky-50 dark:bg-zinc-900">
                    {tool.icon}
                  </div>
                  <span>{tool.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
            <Link
              href="/guide"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/guide"
                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
              }`}
            >
              Panduan
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/about"
                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
              }`}
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
