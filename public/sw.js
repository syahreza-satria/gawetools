// GaweTools service worker: lets pages that were opened once work offline.
// Strategy: static assets cache-first, pages network-first with cache fallback.
// Only same-origin GET requests are handled; user files never pass through here.
const VERSION = "v2";
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
  "/history",
  "/guide",
  "/about",
];
const PRECACHE_STATIC = ["/pdf.worker.min.mjs", "/logo_gawetools.png", "/icon-192.png", "/icon-512.png"];

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
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2?|mjs)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // HTML navigations and RSC payloads used by client-side navigation
    event.respondWith(networkFirst(request));
  }
});
