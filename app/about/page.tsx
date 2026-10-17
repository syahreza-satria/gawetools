import Link from "next/link";
import { Reveal } from "@/components/motion";
import { ShieldCheck, Zap, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-12 space-y-12">
      {/* Header Section */}
      <Reveal><section className="space-y-4 text-left border-b border-zinc-900 pb-8">
        <h1 className="text-4xl sm:text-6xl font-medium leading-[1.04] text-white">
          Tentang Gawe<span className="text-sky-500">Tools</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
          GaweTools adalah platform alat utilitas PDF gratis yang dirancang untuk mempermudah pekerjaan dokumen Anda sehari-hari secara cepat, praktis, dan mengutamakan privasi.
        </p>
      </section></Reveal>

      {/* Nilai Utama / Kenapa GaweTools */}
      <Reveal><section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-700/70 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">100% Privat & Aman</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Semua pemrosesan file dilakukan langsung di browser Anda. Dokumen tidak pernah diunggah atau disimpan ke server mana pun.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-700/70 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Cepat & Ringan</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Tanpa antrean server atau batas kuota bandwidth. File diproses seketika menggunakan teknologi web modern.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-700/70 rounded-xl p-6 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-sky-950/50 text-sky-400 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Gratis Digunakan</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Dapat digunakan kapan saja tanpa perlu mendaftar akun, tanpa langganan, dan tanpa watermark pada dokumen Anda.
          </p>
        </div>
      </section></Reveal>

      {/* Cara Kerja / Misi */}
      <Reveal><section className="bg-zinc-950 border border-zinc-700/70 rounded-xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-white">Mengapa Client-Side Processing?</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Banyak layanan pengolah dokumen online mewajibkan Anda mengunggah file ke server mereka, yang berpotensi menimbulkan risiko kebocoran data sensitif seperti laporan keuangan, kontrak kerja, atau data pribadi.
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Di <strong>GaweTools</strong>, seluruh proses membaca, menggabungkan, memotong, mengompresi, dan mengunci file PDF berjalan langsung di memori perangkat Anda dengan pustaka WebAssembly dan JavaScript. Komputer Anda yang bekerja, bukan server kami.
        </p>
      </section></Reveal>

      {/* Support the creator */}
      <Reveal><section className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-zinc-800 rounded-lg p-6">
        <div className="text-center sm:text-left">
          <h3 className="font-semibold text-white text-base flex items-center justify-center sm:justify-start gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> Dukung Pembuatnya
          </h3>
          <p className="text-sm text-zinc-300 mt-0.5 max-w-xl">
            GaweTools gratis, tanpa iklan, dan tanpa akun. Kalau alat ini membantu pekerjaan Anda dan Anda ingin ikut mendukung pengembangannya, Anda bisa
            memberi donasi lewat Saweria.
          </p>
        </div>
        <a
          href="https://saweria.co/SyahrezaSatria"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#050505] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors shrink-0"
        >
          Donasi via Saweria <ArrowRight className="w-4 h-4" />
        </a>
      </section></Reveal>

      {/* Call to action */}
      <Reveal><section className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 bg-sky-950/30 border border-sky-900/40 rounded-xl p-6">
        <div>
          <h3 className="font-semibold text-white text-base">Mulai Gunakan GaweTools</h3>
          <p className="text-sm text-zinc-300 mt-0.5">Pilih perkakas PDF yang Anda butuhkan sekarang juga.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors"
        >
          Lihat Semua Tools <ArrowRight className="w-4 h-4" />
        </Link>
      </section></Reveal>
    </div>
  );
}
