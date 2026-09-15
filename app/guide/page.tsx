import Link from "next/link";
import { Files, Scissors, Minimize2, Lock } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Top Header Centered */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Welcome to our user&apos;s guide
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 font-normal leading-relaxed">
          Although we have tried to make it really simple, here is a short guidance to help you through the editing process.
        </p>
      </div>

      {/* Category 1: ORGANIZE PDF */}
      <section className="mb-14">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 pb-3 border-b border-gray-200 dark:border-zinc-800">
          ORGANIZE PDF
        </h2>

        <div className="mt-8 space-y-10">
          {/* Merge PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Files className="w-3.5 h-3.5" />
              </div>
              <Link
                href="/merge-pdf"
                className="text-base font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Merge PDF
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed space-y-3 pl-8.5">
              <p>
                To <strong>merge two or more PDFs</strong>, select the documents from your{" "}
                <Link href="/merge-pdf" className="text-red-600 hover:underline">
                  device
                </Link>
                . You can arrange the files however you like before merging them by dragging and dropping them into your preferred sequence.
              </p>
              <p>
                Once you are satisfied with the order, click the <strong>Merge PDF</strong> button to process them, and then download your combined file. Everything runs 100% locally in your browser.
              </p>
            </div>
          </div>

          {/* Split PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <Link
                href="/split-pdf"
                className="text-base font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Split PDF
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed space-y-3 pl-8.5">
              <p>
                To <strong>split a PDF into different files</strong>, select the document from your{" "}
                <Link href="/split-pdf" className="text-red-600 hover:underline">
                  device
                </Link>
                . An instant visual page thumbnail preview will appear for all pages.
              </p>
              <p>
                <Link href="/split-pdf" className="text-red-600 hover:underline">
                  Upload
                </Link>{" "}
                the file to split. You can either extract all pages into separate PDFs (packaged conveniently in a single ZIP file) or split by custom ranges (for example: <code className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">1-3, 5, 7-9</code>). Hit the Split PDF button and you&apos;ll be good to go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category 2: OPTIMIZE & SECURITY */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 pb-3 border-b border-gray-200 dark:border-zinc-800">
          OPTIMIZE & SECURITY
        </h2>

        <div className="mt-8 space-y-10">
          {/* Compress PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Minimize2 className="w-3.5 h-3.5" />
              </div>
              <Link
                href="/compress-pdf"
                className="text-base font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Compress PDF
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed space-y-3 pl-8.5">
              <p>
                To <strong>compress and reduce PDF file size</strong>, upload your file from your{" "}
                <Link href="/compress-pdf" className="text-red-600 hover:underline">
                  device
                </Link>
                . Select your desired compression level (Low, Recommended Medium, or Extreme High compression).
              </p>
              <p>
                The document is re-encoded with optimized raster resolutions directly on your device, showing before and after file size savings before downloading.
              </p>
            </div>
          </div>

          {/* Protect / Lock PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <Link
                href="/lock-pdf"
                className="text-base font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Lock PDF
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed space-y-3 pl-8.5">
              <p>
                To <strong>protect confidential PDFs with a password</strong>, choose your file from your{" "}
                <Link href="/lock-pdf" className="text-red-600 hover:underline">
                  device
                </Link>{" "}
                and enter a strong password.
              </p>
              <p>
                The file will be encrypted using bank-grade AES-256 encryption. The password will be required whenever the document is opened or printed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
