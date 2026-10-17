// Worker side of the reusable Web Worker pattern (see runInWorker.ts).
interface WorkerScope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent) => void) | null;
}

export interface WorkerContext<TProgress> {
  progress: (data: TProgress) => void;
}

export interface WorkerOutput<TOut> {
  result: TOut;
  transfer?: Transferable[];
}

export function defineWorker<TIn, TOut, TProgress = unknown>(
  handler: (input: TIn, ctx: WorkerContext<TProgress>) => Promise<WorkerOutput<TOut>>
): void {
  const scope = self as unknown as WorkerScope;
  scope.onmessage = async (e: MessageEvent) => {
    try {
      const { result, transfer } = await handler(e.data as TIn, {
        progress: (data) => scope.postMessage({ type: "progress", data }),
      });
      scope.postMessage({ type: "result", data: result }, transfer ?? []);
    } catch (err) {
      scope.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };
}
