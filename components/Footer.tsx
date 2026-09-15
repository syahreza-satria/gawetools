import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            Gawe<span className="text-sky-600">Tools</span>
          </span>
          <span>•</span>
          <span>© {new Date().getFullYear()} GaweTools. All rights reserved.</span>
        </div>

        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/merge-pdf" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            Gabung PDF
          </Link>
          <Link href="/split-pdf" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            Pisah PDF
          </Link>
          <Link href="/compress-pdf" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            Kompres PDF
          </Link>
          <Link href="/lock-pdf" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            Kunci PDF
          </Link>
          <Link href="/guide" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            Panduan
          </Link>
        </nav>
      </div>
    </footer>
  );
}
