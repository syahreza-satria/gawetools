import Link from "next/link";
import { ShieldCheck, Zap, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* Header Section */}
      <section className="space-y-4 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Tentang Gawe<span className="text-red-600 dark:text-red-500">Tools</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
          GaweTools adalah platform alat utilitas PDF gratis yang dirancang untuk mempermudah pekerjaan dokumen Anda sehari-hari secara cepat, praktis, dan mengutamakan privasi.
        </p>
      </section>

      {/* Nilai Utama / Kenapa GaweTools */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">100% Privat & Aman</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            Semua pemrosesan file dilakukan langsung di browser Anda. Dokumen tidak pernah diunggah atau disimpan ke server mana pun.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cepat & Ringan</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            Tanpa antrean server atau batas kuota bandwidth. File diproses seketika menggunakan teknologi web modern.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Gratis Digunakan</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            Dapat digunakan kapan saja tanpa perlu mendaftar akun, tanpa langganan, dan tanpa watermark pada dokumen Anda.
          </p>
        </div>
      </section>

      {/* Cara Kerja / Misi */}
      <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mengapa Client-Side Processing?</h2>
        <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
          Banyak layanan pengolah dokumen online mewajibkan Anda mengunggah file ke server mereka, yang berpotensi menimbulkan risiko kebocoran data sensitif seperti laporan keuangan, kontrak kerja, atau data pribadi.
        </p>
        <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
          Di <strong>GaweTools</strong>, seluruh proses membaca, menggabungkan, memotong, mengompresi, dan mengunci file PDF berjalan langsung di memori perangkat Anda dengan pustaka WebAssembly dan JavaScript. Komputer Anda yang bekerja, bukan server kami.
        </p>
      </section>

      {/* Call to action */}
      <section className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl p-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">Mulai Gunakan GaweTools</h3>
          <p className="text-sm text-gray-600 dark:text-zinc-300 mt-0.5">Pilih perkakas PDF yang Anda butuhkan sekarang juga.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Lihat Semua Tools <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
