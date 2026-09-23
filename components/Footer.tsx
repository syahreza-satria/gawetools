import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Cpu, Lock, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const pdfTools = [
    { label: "Gabung PDF", href: "/merge-pdf" },
    { label: "Potong PDF", href: "/split-pdf" },
    { label: "Kompres PDF", href: "/compress-pdf" },
    { label: "Atur Halaman PDF", href: "/reorder-pdf" },
    { label: "Kunci PDF", href: "/lock-pdf" },
    { label: "Buka Kunci PDF", href: "/unlock-pdf" },
    { label: "Watermark PDF", href: "/watermark-pdf" },
    { label: "PDF ke Gambar", href: "/pdf-to-image" },
  ];

  const imageTools = [
    { label: "Kompres Gambar", href: "/compress-image" },
    { label: "Watermark Gambar", href: "/watermark-image" },
  ];

  const legalLinks = [
    { label: "Panduan Penggunaan", href: "/guide" },
    { label: "Tentang Kami", href: "/about" },
  ];

  return (
    <footer className="mt-auto border-t border-gray-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-950 transition-colors">
      {/* Privacy & Trust Banner */}
      <div className="border-b border-gray-100 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white block">100% Aman & Privat</span>
              <span>Dokumen tidak pernah diunggah ke server manapun.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-500 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white block">Proses di Browser</span>
              <span>Bekerja langsung di perangkat Anda tanpa batasan kuota.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-500 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white block">Tanpa Registrasi</span>
              <span>Gunakan semua fitur secara gratis tanpa perlu login.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 p-1 flex items-center justify-center border border-sky-100 dark:border-sky-900">
                <Image
                  src="/logo_gawetools.png"
                  alt="GaweTools Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                Gawe<span className="text-sky-500 font-extrabold">Tools</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Platform produktivitas lengkap untuk mengolah dokumen PDF dan gambar secara instan, aman, dan tanpa biaya langsung dari browser Anda.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otomatisasi Lokal & Ramah Privasi</span>
            </div>
          </div>

          {/* PDF Tools Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Dokumen PDF
            </h4>
            <ul className="space-y-2 text-sm">
              {pdfTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-gray-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Image Tools Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Gambar Tools
            </h4>
            <ul className="space-y-2 text-sm">
              {imageTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-gray-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation & Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Bantuan & Info
            </h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-zinc-400">
          <div>
            © {currentYear} <span className="font-semibold text-gray-800 dark:text-zinc-200">GaweTools</span>. Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-zinc-400">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>untuk kemudahan kerja sehari-hari</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
