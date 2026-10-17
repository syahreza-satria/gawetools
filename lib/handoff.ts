import { openDb, HANDOFF_STORE as STORE } from "@/lib/db";

// Passes result files between tools (and from the share-target service worker) through IndexedDB.
// Files stay on this device; each entry is removed as soon as it is read and expires after 10 minutes.
export const HANDOFF_MAX_AGE_MS = 10 * 60 * 1000;

interface HandoffRecord {
  id?: number;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
}

export interface HandoffInfo {
  name: string;
  type: string;
  size: number;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

function requestResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function isExpired(r: HandoffRecord, now: number): boolean {
  return now - r.createdAt > HANDOFF_MAX_AGE_MS;
}

/** Replaces any pending handoff with the given files. */
export async function saveHandoff(files: { blob: Blob; name: string }[]): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    const createdAt = Date.now();
    for (const f of files) {
      store.add({ name: f.name, type: f.blob.type, blob: f.blob, createdAt } satisfies HandoffRecord);
    }
    await txDone(tx);
  } finally {
    db.close();
  }
}

/** Reads and deletes all pending handoff files (expired ones are discarded). */
export async function takeHandoff(): Promise<File[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getAll = requestResult<HandoffRecord[]>(store.getAll());
    store.clear();
    const records = await getAll;
    await txDone(tx);
    const now = Date.now();
    return records
      .filter((r) => !isExpired(r, now))
      .map((r) => new File([r.blob], r.name, { type: r.type || r.blob.type }));
  } finally {
    db.close();
  }
}

/** Lists pending handoff files without consuming them (used by the share-target page). */
export async function peekHandoff(): Promise<HandoffInfo[]> {
  const db = await openDb();
  try {
    const records = await requestResult<HandoffRecord[]>(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
    const now = Date.now();
    return records.filter((r) => !isExpired(r, now)).map((r) => ({ name: r.name, type: r.type, size: r.blob.size }));
  } finally {
    db.close();
  }
}

/** Best-effort cleanup of expired entries. */
export async function purgeExpiredHandoff(): Promise<void> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getAll = requestResult<HandoffRecord[]>(store.getAll());
      const records = await getAll;
      const now = Date.now();
      for (const r of records) if (isExpired(r, now)) store.delete(r.id!);
      await txDone(tx);
    } finally {
      db.close();
    }
  } catch {}
}
