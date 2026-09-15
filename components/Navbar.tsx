"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  return (
    <header className="p-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 shadow-xs flex items-center justify-between transition-colors">
      <Link href={"/"} className="font-bold text-xl text-gray-900 dark:text-white">
        Gawe<span className="text-red-600">Tools</span>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href={"/guide"}
          className="text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Panduan
        </Link>
        <Link
          href={"/about"}
          className="text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Tentang Kami
        </Link>
      </div>
    </header>
  );
}
