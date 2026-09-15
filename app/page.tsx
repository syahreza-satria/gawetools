import Link from "next/link";
import { Files, Scissors, Minimize2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="grid grid-cols-5 gap-4 px-16 py-8 mx-auto">
      {/* Merge PDF Card */}
      <Link
        href="/merge-pdf"
        className="group border bg-white border-gray-200 rounded-xl p-6 hover:border-red-300 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <Files className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Gabung PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Gabungkan dua atau lebih file PDF menjadi satu dokumen, urutan bisa diatur bebas.
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-red-600">
          Buka <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>

      {/* Split PDF Card */}
      <Link
        href="/split-pdf"
        className="group border bg-white border-gray-200 rounded-xl p-6 hover:border-red-300 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <Scissors className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Pisah PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Pisahkan halaman PDF jadi file terpisah atau ambil rentang halaman tertentu.
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-red-600">
          Buka <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>

      {/* Compress PDF Card */}
      <Link
        href="/compress-pdf"
        className="group border bg-white border-gray-200 rounded-xl p-6 hover:border-red-300 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <Minimize2 className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Kompres PDF
        </h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Kecilkan ukuran file PDF Anda dengan tetap mempertahankan keterbacaan dokumen.
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-red-600">
          Buka <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>
    </div>
  );
}
