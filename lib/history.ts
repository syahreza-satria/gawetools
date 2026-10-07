// Download history kept in IndexedDB on this device only.
// Stores metadata (tool, file name, size, time) — never the file contents.
const DB_NAME = "gawetools";
const STORE = "history";
const MAX_ENTRIES = 100;

export interface HistoryEntry {
  id?: number;
  tool: string; // route path, e.g. "/merge-pdf"
  filename: string;
  size: number; // bytes, 0 when unknown
  createdAt: number;
}

export const TOOL_LABELS: Record<string, string> = {
  "/merge-pdf": "Gabung PDF",
  "/split-pdf": "Potong PDF",
  "/compress-pdf": "Kompres PDF",
  "/reorder-pdf": "Atur Halaman PDF",
  "/rotate-pdf": "Putar PDF",
  "/image-to-pdf": "Gambar ke PDF",
  "/lock-pdf": "Kunci PDF",
  "/unlock-pdf": "Buka Kunci PDF",
  "/watermark-pdf": "Watermark PDF",
  "/pdf-to-image": "PDF ke Gambar",
  "/compress-image": "Kompres Gambar",
  "/resize-image": "Resize Gambar",
  "/convert-image": "Konversi Gambar",
  "/watermark-image": "Watermark Gambar",
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB tidak tersedia"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const all = await run<HistoryEntry[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function removeHistory(id: number): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

export async function clearHistory(): Promise<void> {
  await run("readwrite", (s) => s.clear());
}

/** Best-effort: history must never break a download, so all errors are swallowed. */
export async function recordHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): Promise<void> {
  try {
    await run("readwrite", (s) => s.add({ ...entry, createdAt: Date.now() }));
    const all = await listHistory();
    await Promise.all(all.slice(MAX_ENTRIES).map((e) => removeHistory(e.id!)));
  } catch {}
}
