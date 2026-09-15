"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Files, Layers, Scissors, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="p-4 bg-white font-bold">
      <a href={'/'}>GAWETOOLS</a>
    </header>
  );
}
