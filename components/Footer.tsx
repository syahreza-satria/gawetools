import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowUpRight, Heart, ShieldCheck } from "lucide-react";

const SAWERIA_URL = "https://saweria.co/SyahrezaSatria";

interface FooterGroup {
  title: string;
  links: { label: string; href: string }[];
}

// Grouped like the categories on the home page so every column stays short and balanced.
const GROUPS: FooterGroup[] = [
  {
    title: "Atur Dokumen",
    links: [
      { label: "Gabung PDF", href: "/merge-pdf" },
      { label: "Potong PDF", href: "/split-pdf" },
      { label: "Atur Halaman PDF", href: "/reorder-pdf" },
      { label: "Putar PDF", href: "/rotate-pdf" },
      { label: "Crop PDF", href: "/crop-pdf" },
      { label: "Bandingkan PDF", href: "/compare-pdf" },
      { label: "Cetak Booklet", href: "/booklet-pdf" },
    ],
  },
  {
    title: "Edit & Tanda Tangan",
    links: [
      { label: "Tanda Tangan PDF", href: "/sign-pdf" },
      { label: "Nomor Halaman PDF", href: "/add-page-numbers" },
      { label: "Isi Formulir PDF", href: "/fill-pdf-form" },
    ],
  },
  {
    title: "Konversi",
    links: [
      { label: "PDF ke Gambar", href: "/pdf-to-image" },
      { label: "Gambar ke PDF", href: "/image-to-pdf" },
      { label: "Konversi Gambar", href: "/convert-image" },
      { label: "HEIC ke JPG", href: "/heic-to-jpg" },
      { label: "PDF ke Teks", href: "/pdf-to-text" },
      { label: "OCR", href: "/ocr" },
      { label: "Scan Dokumen", href: "/scan-document" },
    ],
  },
  {
    title: "Optimasi & Keamanan",
    links: [
      { label: "Kompres PDF", href: "/compress-pdf" },
      { label: "Kunci PDF", href: "/lock-pdf" },
      { label: "Buka Kunci PDF", href: "/unlock-pdf" },
      { label: "Watermark PDF", href: "/watermark-pdf" },
      { label: "Sensor PDF", href: "/redact-pdf" },
      { label: "Hapus Metadata", href: "/remove-metadata" },
      { label: "PDF Hitam-Putih", href: "/grayscale-pdf" },
    ],
  },
  {
    title: "Edit Gambar",
    links: [
      { label: "Kompres Gambar", href: "/compress-image" },
      { label: "Resize Gambar", href: "/resize-image" },
      { label: "Watermark Gambar", href: "/watermark-image" },
      { label: "Crop Gambar", href: "/crop-image" },
      { label: "Ganti Latar Pas Foto", href: "/photo-background" },
    ],
  },
  {
    title: "Lainnya",
    links: [
      { label: "QR Code", href: "/qr-code" },
      { label: "Riwayat Unduhan", href: "/history" },
      { label: "Panduan", href: "/guide" },
      { label: "Tentang Kami", href: "/about" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-900 bg-[#050505] overflow-hidden">
      {/* Statement + brand */}
      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 pt-14 sm:pt-20 pb-12 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 items-end">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/logo.svg"
              alt="GaweTools Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-medium text-xl tracking-tight text-white">
              Gawe<span className="text-zinc-500">Tools</span>
            </span>
          </Link>
          <h2 className="text-3xl sm:text-5xl leading-[1.05] text-white max-w-2xl">
            Alat dokumen yang bekerja <span className="text-zinc-500">di perangkat Anda.</span>
          </h2>
        </div>

        <div className="space-y-5">
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            Gabung, potong, kompres, tanda tangani, OCR, dan konversi PDF serta gambar secara instan dan gratis. Tidak ada akun, tidak ada unggahan ke server.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/#alat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#050505] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors"
            >
              Jelajahi semua alat
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a
              href={SAWERIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 text-white text-sm font-semibold hover:border-zinc-400 transition-colors"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              Dukung di Saweria
            </a>
          </div>
          <p className="inline-flex items-center gap-2 label-mono text-zinc-500">
            <ShieldCheck className="w-4 h-4" />
            0 byte diunggah
          </p>
        </div>
      </div>

      {/* Link groups */}
      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="border-t border-zinc-900 py-10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-10">
          {GROUPS.map((group, i) => (
            <nav key={group.title} aria-label={group.title} className="space-y-4">
              <h3 className="label-mono text-zinc-500">
                {String(i + 1).padStart(2, "0")} / {group.title}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-zinc-300 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Oversized wordmark (decorative) */}
      <div aria-hidden className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 select-none overflow-hidden">
        <p className="text-[clamp(3rem,16vw,17rem)] font-medium leading-[0.82] tracking-[-0.05em] text-zinc-900 whitespace-nowrap -mb-[0.06em]">
          GaweTools&trade;
        </p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-900 bg-[#050505]">
        <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>
            &copy; {currentYear} <span className="text-zinc-300">GaweTools</span>. Seluruh hak cipta dilindungi.
          </p>
          <p className="label-mono">
            Dibuat oleh <span className="text-zinc-300">Syahreza Satria</span> &middot;{" "}
            <a href={SAWERIA_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white transition-colors">
              Traktir via Saweria
            </a>
          </p>
          <a href="#" className="inline-flex items-center gap-1.5 label-mono text-zinc-400 hover:text-white transition-colors">
            Kembali ke atas
            <ArrowUp className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
