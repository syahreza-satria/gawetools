import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm">
            Gawe<span className="text-red-600">Tools</span>
          </span>
          <span>•</span>
          <span>© {new Date().getFullYear()} GaweTools. All rights reserved.</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/merge-pdf" className="hover:text-red-600 transition-colors">
            Gabung PDF
          </Link>
          <Link href="/split-pdf" className="hover:text-red-600 transition-colors">
            Pisah PDF
          </Link>
          <Link href="/compress-pdf" className="hover:text-red-600 transition-colors">
            Kompres PDF
          </Link>
        </nav>
      </div>
    </footer>
  );
}
