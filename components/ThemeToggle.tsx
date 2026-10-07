"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// The inline script in app/layout.tsx sets the `dark` class before hydration,
// so the <html> class list is the source of truth for the current theme.
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const subscribeNoop = () => () => {};

export default function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className="p-2 cursor-pointer rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
