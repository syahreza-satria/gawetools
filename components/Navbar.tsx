"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
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
  Images,
  RotateCw,
  Scaling,
  Repeat,
  ChevronDown,
  Menu,
  X,
  FileText,
  ImageIcon,
  PenLine,
  ListOrdered,
  Smartphone,
  Crop,
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
  Search,
  ArrowUpRight,
  CornerDownLeft,
} from "lucide-react";

interface NavTool {
  href: string;
  title: string;
  desc: string;
  icon: ReactNode;
}

type MenuId = "pdf" | "image" | null;

const PAGE_LINKS = [
  { href: "/history", title: "Riwayat", desc: "Daftar unduhan di perangkat ini" },
  { href: "/guide", title: "Panduan", desc: "Cara memakai setiap alat" },
  { href: "/about", title: "Tentang Kami", desc: "Tentang GaweTools" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const pdfTools = [
    {
      href: "/merge-pdf",
      title: "Gabung PDF",
      desc: "Satukan beberapa PDF jadi satu file",
      icon: <Files className="w-4 h-4" />,
    },
    {
      href: "/split-pdf",
      title: "Potong PDF",
      desc: "Pisahkan atau ambil rentang halaman",
      icon: <Scissors className="w-4 h-4" />,
    },
    {
      href: "/compress-pdf",
      title: "Kompres PDF",
      desc: "Perkecil ukuran dokumen PDF",
      icon: <Minimize2 className="w-4 h-4" />,
    },
    {
      href: "/reorder-pdf",
      title: "Atur Halaman PDF",
      desc: "Urutkan atau hapus halaman",
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      href: "/rotate-pdf",
      title: "Putar PDF",
      desc: "Putar halaman PDF ke kiri / kanan",
      icon: <RotateCw className="w-4 h-4" />,
    },
    {
      href: "/image-to-pdf",
      title: "Gambar ke PDF",
      desc: "Jadikan foto / scan satu file PDF",
      icon: <Images className="w-4 h-4" />,
    },
    {
      href: "/lock-pdf",
      title: "Kunci PDF",
      desc: "Beri proteksi password pada PDF",
      icon: <Lock className="w-4 h-4" />,
    },
    {
      href: "/unlock-pdf",
      title: "Buka Kunci PDF",
      desc: "Hilangkan password dari dokumen PDF",
      icon: <LockOpen className="w-4 h-4" />,
    },
    {
      href: "/watermark-pdf",
      title: "Watermark PDF",
      desc: "Tambahkan teks cap / watermark",
      icon: <Stamp className="w-4 h-4" />,
    },
    {
      href: "/pdf-to-image",
      title: "PDF ke Gambar",
      desc: "Konversi PDF ke format JPEG / PNG",
      icon: <FileImage className="w-4 h-4" />,
    },
    {
      href: "/sign-pdf",
      title: "Tanda Tangan PDF",
      desc: "Tempel tanda tangan di dokumen",
      icon: <PenLine className="w-4 h-4" />,
    },
    {
      href: "/add-page-numbers",
      title: "Nomor Halaman PDF",
      desc: "Tambahkan nomor di setiap halaman",
      icon: <ListOrdered className="w-4 h-4" />,
    },
    {
      href: "/fill-pdf-form",
      title: "Isi Formulir PDF",
      desc: "Isi kolom formulir, bisa diratakan",
      icon: <FormInput className="w-4 h-4" />,
    },
    {
      href: "/redact-pdf",
      title: "Sensor PDF",
      desc: "Tutup data rahasia dengan kotak hitam",
      icon: <EyeOff className="w-4 h-4" />,
    },
    {
      href: "/crop-pdf",
      title: "Crop PDF",
      desc: "Pangkas margin halaman PDF",
      icon: <Crop className="w-4 h-4" />,
    },
    {
      href: "/grayscale-pdf",
      title: "PDF Hitam-Putih",
      desc: "Ubah PDF berwarna jadi grayscale",
      icon: <Contrast className="w-4 h-4" />,
    },
    {
      href: "/pdf-to-text",
      title: "PDF ke Teks",
      desc: "Ekstrak teks per halaman",
      icon: <AlignLeft className="w-4 h-4" />,
    },
    {
      href: "/remove-metadata",
      title: "Hapus Metadata",
      desc: "Bersihkan EXIF, GPS, dan info PDF",
      icon: <ShieldOff className="w-4 h-4" />,
    },
    {
      href: "/ocr",
      title: "OCR",
      desc: "Kenali teks dari scan dan foto",
      icon: <ScanText className="w-4 h-4" />,
    },
    {
      href: "/scan-document",
      title: "Scan Dokumen",
      desc: "Foto dokumen jadi PDF rapi",
      icon: <ScanLine className="w-4 h-4" />,
    },
    {
      href: "/compare-pdf",
      title: "Bandingkan PDF",
      desc: "Lihat beda teks dua versi PDF",
      icon: <FileDiff className="w-4 h-4" />,
    },
    {
      href: "/booklet-pdf",
      title: "Cetak Booklet",
      desc: "Susun 2-up untuk dilipat jadi buku",
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  const imageTools = [
    {
      href: "/compress-image",
      title: "Kompres Gambar",
      desc: "Kecilkan file JPEG, PNG, dan WebP",
      icon: <ImageDown className="w-4 h-4" />,
    },
    {
      href: "/resize-image",
      title: "Resize Gambar",
      desc: "Ubah dimensi gambar (px / persen)",
      icon: <Scaling className="w-4 h-4" />,
    },
    {
      href: "/convert-image",
      title: "Konversi Gambar",
      desc: "Ubah format JPG, PNG, dan WebP",
      icon: <Repeat className="w-4 h-4" />,
    },
    {
      href: "/watermark-image",
      title: "Watermark Gambar",
      desc: "Beri watermark teks atau logo gambar",
      icon: <Stamp className="w-4 h-4" />,
    },
    {
      href: "/crop-image",
      title: "Crop Gambar",
      desc: "Potong gambar, preset pas foto",
      icon: <Crop className="w-4 h-4" />,
    },
    {
      href: "/heic-to-jpg",
      title: "HEIC ke JPG",
      desc: "Ubah foto iPhone ke JPG / PNG",
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      href: "/photo-background",
      title: "Ganti Latar Pas Foto",
      desc: "Ganti latar jadi merah, biru, putih",
      icon: <UserRound className="w-4 h-4" />,
    },
    {
      href: "/qr-code",
      title: "QR Code",
      desc: "Buat dan pindai QR code",
      icon: <QrCode className="w-4 h-4" />,
    },
  ];


  const isPdfActive = pdfTools.some((t) => pathname === t.href);
  const isImgActive = imageTools.some((t) => pathname === t.href);

  // Close menus on route change (adjust state during render, not in an effect)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
    setPaletteOpen(false);
  }

  // Click outside / Escape closes the mega menu; Ctrl/⌘+K opens the search palette.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const menus: { id: Exclude<MenuId, null>; label: string; icon: ReactNode; tools: NavTool[]; active: boolean }[] = [
    { id: "pdf", label: "Alat PDF", icon: <FileText className="w-3.5 h-3.5" />, tools: pdfTools, active: isPdfActive },
    { id: "image", label: "Alat Gambar", icon: <ImageIcon className="w-3.5 h-3.5" />, tools: imageTools, active: isImgActive },
  ];
  const activeMenu = menus.find((m) => m.id === openMenu) ?? null;

  const tabCls = (active: boolean) =>
    "relative flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 " + (active ? "bg-white text-[#050505]" : "text-zinc-400 hover:text-white");

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 px-3 sm:px-6 lg:px-10 2xl:px-16 pt-3 pb-1 pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Floating pill */}
          <div className="flex items-center justify-between gap-3 h-14 pl-3 pr-2 rounded-full border border-zinc-800 bg-[#0a0a0b]/75 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <Link href="/" className="flex items-center gap-2.5 group pl-1">
              <span className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image src="/logo.svg" alt="GaweTools Logo" width={20} height={20} priority className="object-contain brightness-0" />
              </span>
              <span className="hidden sm:inline font-medium text-lg tracking-tight text-white">
                Gawe<span className="text-zinc-500">Tools</span>
              </span>
            </Link>

            {/* Desktop tabs */}
            <nav
              className="hidden md:flex items-center gap-0.5 p-1 rounded-full bg-zinc-900/70 border border-zinc-800/80"
              onMouseLeave={() => setHovered(null)}
            >
              {menus.map((m) => {
                const current = m.active;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-expanded={openMenu === m.id}
                    onMouseEnter={() => setHovered(m.id)}
                    onClick={() => setOpenMenu((cur) => (cur === m.id ? null : m.id))}
                    className={tabCls(current)}
                  >
                    {!current && (hovered === m.id || openMenu === m.id) && (
                      <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-zinc-800" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                    )}
                    <span className="relative flex items-center gap-1">
                      {m.label}
                      <ChevronDown className={"w-3.5 h-3.5 opacity-70 transition-transform duration-200 " + (openMenu === m.id ? "rotate-180" : "")} />
                    </span>
                  </button>
                );
              })}
              {PAGE_LINKS.map((l) => {
                const current = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href} onMouseEnter={() => setHovered(l.href)} className={tabCls(current)}>
                    {!current && hovered === l.href && (
                      <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-zinc-800" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                    )}
                    <span className="relative">{l.title.replace(" Kami", "")}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Cari alat"
                className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-white text-[#050505] hover:bg-[#e4e4e7] transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-semibold">Cari alat</span>
                <kbd className="hidden lg:inline label-mono !text-[10px] px-1.5 py-0.5 rounded bg-[#050505]/10">Ctrl K</kbd>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen((o) => !o);
                  setOpenMenu(null);
                }}
                aria-label="Buka menu navigasi"
                aria-expanded={mobileOpen}
                className="md:hidden w-10 h-10 rounded-full border border-zinc-800 text-zinc-200 flex items-center justify-center hover:bg-zinc-900 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop mega panel */}
          <AnimatePresence>
            {activeMenu && (
              <motion.div
                key="mega"
                initial={{ opacity: 0, y: -8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block absolute left-0 right-0 top-full mt-2 rounded-lg border border-zinc-800 bg-[#0a0a0b]/95 backdrop-blur-xl shadow-2xl shadow-black/70 p-4 max-h-[75vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between px-2 pb-3 mb-3 border-b border-zinc-900">
                  <span className="label-mono text-zinc-500">{activeMenu.label + " // " + activeMenu.tools.length + " alat"}</span>
                  <span className="label-mono text-zinc-600">100% di browser</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
                  {activeMenu.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className={
                        "group flex items-start gap-3 p-3 rounded-lg border transition-colors " +
                        (pathname === tool.href ? "border-zinc-600 bg-zinc-900" : "border-transparent hover:border-zinc-800 hover:bg-zinc-900/70")
                      }
                    >
                      <span className="mt-0.5 w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#050505] transition-colors">
                        {tool.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-white">{tool.title}</span>
                        <span className="block text-xs text-zinc-500 line-clamp-1">{tool.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile sheet */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-lg border border-zinc-800 bg-[#0a0a0b]/95 backdrop-blur-xl shadow-2xl shadow-black/70 p-3 max-h-[78vh] overflow-y-auto space-y-4"
              >
                {menus.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <p className="label-mono text-zinc-500 px-2">{m.label}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {m.tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className={
                            "flex items-center gap-2 p-2.5 rounded-lg border text-[13px] " +
                            (pathname === tool.href ? "border-zinc-600 bg-zinc-900 text-white" : "border-zinc-900 text-zinc-300 hover:bg-zinc-900")
                          }
                        >
                          <span className="shrink-0 text-white">{tool.icon}</span>
                          <span className="truncate">{tool.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-1.5 border-t border-zinc-900 pt-3">
                  {PAGE_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={"text-center label-mono py-2.5 rounded-lg border " + (pathname === l.href ? "border-zinc-600 bg-zinc-900 text-white" : "border-zinc-900 text-zinc-400")}
                    >
                      {l.title}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={[...pdfTools.map((t) => ({ ...t, group: "PDF" })), ...imageTools.map((t) => ({ ...t, group: "Gambar" })), ...PAGE_LINKS.map((l) => ({ ...l, icon: <ArrowUpRight className="w-4 h-4 text-white" />, group: "Halaman" }))]}
        onPick={(href) => {
          setPaletteOpen(false);
          router.push(href);
        }}
      />
    </>
  );
}

interface PaletteItem extends NavTool {
  group: string;
}

function CommandPalette({ open, onClose, items, onPick }: { open: boolean; onClose: () => void; items: PaletteItem[]; onPick: (href: string) => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor, results]);

  const close = () => {
    setQuery("");
    setCursor(0);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      setQuery("");
      setCursor(0);
      onPick(results[cursor].href);
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-start justify-center px-4 pt-[12vh]"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-label="Cari alat"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl rounded-lg border border-zinc-800 bg-[#0a0a0b] shadow-2xl shadow-black overflow-hidden"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 px-4 border-b border-zinc-900">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                placeholder="Cari alat: gabung, kompres, OCR..."
                aria-label="Cari alat"
                className="w-full h-14 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <kbd className="label-mono !text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">Esc</kbd>
            </div>
            <ul ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-zinc-500">Tidak ada alat yang cocok.</li>}
              {results.map((item, i) => (
                <li key={item.group + item.href}>
                  <button
                    type="button"
                    data-active={i === cursor}
                    onMouseMove={() => setCursor(i)}
                    onClick={() => {
                      setQuery("");
                      setCursor(0);
                      onPick(item.href);
                    }}
                    className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors " + (i === cursor ? "bg-zinc-900" : "")}
                  >
                    <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{item.title}</span>
                      <span className="block text-xs text-zinc-500 truncate">{item.desc}</span>
                    </span>
                    <span className="label-mono !text-[10px] text-zinc-600 shrink-0">{item.group}</span>
                    {i === cursor && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
