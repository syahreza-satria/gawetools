import Link from "next/link";
import { Files, Scissors, Minimize2, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-6 sm:px-16 py-8 mx-auto w-full">
      {/* Merge PDF Card */}
      <Link
        href="/merge-pdf"
        className="group border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
          <Files className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Gabung PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          Gabungkan dua atau lebih file PDF menjadi satu dokumen, urutan bisa diatur bebas.
        </p>
      </Link>

      {/* Split PDF Card */}
      <Link
        href="/split-pdf"
        className="group border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
          <Scissors className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pisah PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          Pisahkan halaman PDF jadi file terpisah atau ambil rentang halaman tertentu.
        </p>
      </Link>

      {/* Compress PDF Card */}
      <Link
        href="/compress-pdf"
        className="group border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
          <Minimize2 className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kompres PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          Kecilkan ukuran file PDF Anda dengan tetap mempertahankan keterbacaan dokumen.
        </p>
      </Link>

      {/* Lock PDF Card */}
      <Link
        href="/lock-pdf"
        className="group border bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kunci PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          Beri password untuk melindungi dokumen PDF penting Anda dari akses yang tidak diinginkan.
        </p>
      </Link>
    </div>
  );
}
