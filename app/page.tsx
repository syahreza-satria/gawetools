import Link from "next/link";
import { Files, Scissors, Minimize2, Lock, ImageDown, Stamp } from "lucide-react";

export default function Home() {
  const documentTools = [
    {
      href: "/merge-pdf",
      icon: <Files className="w-5 h-5" />,
      title: "Gabung PDF",
      description: "Gabungkan dua atau lebih file PDF menjadi satu dokumen, urutan bisa diatur bebas.",
    },
    {
      href: "/split-pdf",
      icon: <Scissors className="w-5 h-5" />,
      title: "Potong PDF",
      description: "Potong halaman PDF jadi file terpisah atau ambil rentang halaman tertentu.",
    },
    {
      href: "/compress-pdf",
      icon: <Minimize2 className="w-5 h-5" />,
      title: "Kompres PDF",
      description: "Kecilkan ukuran file PDF Anda dengan tetap mempertahankan keterbacaan dokumen.",
    },
    {
      href: "/lock-pdf",
      icon: <Lock className="w-5 h-5" />,
      title: "Kunci PDF",
      description: "Beri password untuk melindungi dokumen PDF penting Anda dari akses yang tidak diinginkan.",
    },
  ];

  // 2. Definisikan data untuk Gambar Tools
  const imageTools = [
    {
      href: "/compress-image",
      icon: <ImageDown className="w-5 h-5" />,
      title: "Kompres Gambar",
      description: "Kecilkan ukuran file gambar JPEG, PNG, dan WebP tanpa kehilangan kualitas yang berarti.",
    },
    {
      href: "/watermark-image",
      icon: <Stamp className="w-5 h-5" />,
      title: "Watermark Gambar",
      description: "Tambahkan watermark teks atau logo ke gambar JPEG, PNG, dan WebP langsung di browser.",
    },
  ];

  // 3. Buat komponen Card agar tidak ada kode berulang (DRY - Don't Repeat Yourself)
  const ToolCard = ({
    href,
    icon,
    title,
    description,
  }: {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <Link href={href} className="group border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{description}</p>
    </Link>
  );

  return (
    <div className="px-6 sm:px-16 py-8 mx-auto w-full space-y-8">
      {/* Bagian Dokumen Tools */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dokumen Tools</h1>
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {documentTools.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </section>
      </div>

      {/* Bagian Gambar Tools */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Gambar Tools</h1>
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {imageTools.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </section>
      </div>
    </div>
  );
}
