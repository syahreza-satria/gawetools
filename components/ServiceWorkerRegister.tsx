"use client";

import { useEffect } from "react";
import { purgeExpiredHandoff } from "@/lib/handoff";

/** Registers the offline service worker (production only, to avoid stale caches during development) and clears expired handoff files. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    void purgeExpiredHandoff();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Gagal mendaftarkan service worker:", err);
    });
  }, []);

  return null;
}
