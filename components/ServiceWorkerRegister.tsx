"use client";

import { useEffect } from "react";

/** Registers the offline service worker (production only, to avoid stale caches during development). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Gagal mendaftarkan service worker:", err);
    });
  }, []);

  return null;
}
