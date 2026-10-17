// Shared IndexedDB connection. Every store the app (and public/sw.js) uses is created here,
// so bumping DB_VERSION never drops existing data: stores are only created when missing.
// Keep the version and store definitions in sync with public/sw.js.
export const DB_NAME = "gawetools";
export const DB_VERSION = 2;
export const HISTORY_STORE = "history";
export const HANDOFF_STORE = "handoff";

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB tidak tersedia"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(HANDOFF_STORE)) {
        db.createObjectStore(HANDOFF_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
