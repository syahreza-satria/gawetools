// Main-thread side of the reusable Web Worker pattern.
// The caller creates the Worker (the `new Worker(new URL(...), import.meta.url)` expression must
// appear literally in the caller so the bundler can detect it) and the worker file uses `defineWorker`.
export interface RunInWorkerOptions<TProgress> {
  transfer?: Transferable[];
  onProgress?: (progress: TProgress) => void;
}

export function runInWorker<TIn, TOut, TProgress = unknown>(
  createWorker: () => Worker,
  input: TIn,
  options: RunInWorkerOptions<TProgress> = {}
): Promise<TOut> {
  return new Promise<TOut>((resolve, reject) => {
    const worker = createWorker();

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: "progress" | "result" | "error"; data?: unknown; message?: string };
      if (msg.type === "progress") {
        options.onProgress?.(msg.data as TProgress);
      } else if (msg.type === "result") {
        worker.terminate();
        resolve(msg.data as TOut);
      } else {
        worker.terminate();
        reject(new Error(msg.message ?? "Proses di worker gagal."));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "Worker gagal dijalankan."));
    };

    worker.postMessage(input, options.transfer ?? []);
  });
}
