// GaweTools service worker: lets pages that were opened once work offline.
// Strategy: static assets cache-first, pages network-first with cache fallback.
// Same-origin GET requests are cached. The only POST handled is the PWA share target, which
// stores shared files in IndexedDB on this device and never forwards them to the network.
const VERSION = "v6";
const STATIC_CACHE = `gawetools-static-${VERSION}`;
const PAGE_CACHE = `gawetools-pages-${VERSION}`;

const PRECACHE_PAGES = [
  "/",
  "/merge-pdf",
  "/split-pdf",
  "/compress-pdf",
  "/reorder-pdf",
  "/rotate-pdf",
  "/image-to-pdf",
  "/lock-pdf",
  "/unlock-pdf",
  "/watermark-pdf",
  "/pdf-to-image",
  "/compress-image",
  "/resize-image",
  "/convert-image",
  "/watermark-image",
  "/sign-pdf",
  "/add-page-numbers",
  "/heic-to-jpg",
  "/crop-image",
  "/redact-pdf",
  "/remove-metadata",
  "/pdf-to-text",
  "/photo-background",
  "/fill-pdf-form",
  "/crop-pdf",
  "/grayscale-pdf",
  "/ocr",
  "/scan-document",
  "/compare-pdf",
  "/booklet-pdf",
  "/qr-code",
  "/bagikan",
  "/history",
  "/guide",
  "/about",
];
const PRECACHE_STATIC = ["/pdf.worker.min.mjs", "/logo.svg", "/logo_gawetools.png", "/icon-192.png", "/icon-512.png"];

// IndexedDB layout must match lib/db.ts (same name, version and stores).
const DB_NAME = "gawetools";
const DB_VERSION = 2;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("history")) db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("handoff")) db.createObjectStore("handoff", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function isSupportedShare(file) {
  return file.type === "application/pdf" || /^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

async function storeSharedFiles(files) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("handoff", "readwrite");
      const store = tx.objectStore("handoff");
      store.clear();
      const createdAt = Date.now();
      for (const f of files) store.add({ name: f.name, type: f.type, blob: f, createdAt });
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function handleShareTarget(request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((f) => f instanceof File && isSupportedShare(f));
    if (files.length > 0) await storeSharedFiles(files);
  } catch (err) {
    console.error("Gagal menerima file yang dibagikan:", err);
  }
  return Response.redirect(new URL("/bagikan", self.location.origin).href, 303);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGE_CACHE);
      const statics = await caches.open(STATIC_CACHE);
      // allSettled: one failing URL must not block installation
      await Promise.allSettled([...PRECACHE_PAGES.map((u) => pages.add(u)), ...PRECACHE_STATIC.map((u) => statics.add(u))]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("gawetools-") && !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(PAGE_CACHE)).put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method === "POST" && url.origin === self.location.origin && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(request));
    return;
  }
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || /^\/(?:tesseract|mediapipe|models)\//.test(url.pathname) || /\.(?:png|svg|ico|woff2?|mjs|wasm|tflite)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // HTML navigations and RSC payloads used by client-side navigation
    event.respondWith(networkFirst(request));
  }
});
