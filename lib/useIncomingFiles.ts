"use client";

import { useEffect, useRef } from "react";
import { fileKind, type FileKind } from "@/lib/tools";
import { takeHandoff } from "@/lib/handoff";

// React StrictMode (dev) runs effects twice; share one read so the second run does not find an empty store.
let pendingTake: Promise<File[]> | null = null;
function takeHandoffOnce(): Promise<File[]> {
  if (!pendingTake) {
    pendingTake = takeHandoff();
    const clear = () => setTimeout(() => (pendingTake = null), 1000);
    pendingTake.then(clear, clear);
  }
  return pendingTake;
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Lets users paste files (Ctrl+V) from the clipboard anywhere on the page. */
export function usePasteFiles(kind: FileKind, onFiles: (files: File[]) => void, disabled = false) {
  const latest = useLatest(onFiles);

  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const pasted = Array.from(e.clipboardData?.files ?? []);
      const accepted = pasted.filter((f) => fileKind(f) === kind);
      if (accepted.length === 0) return;
      e.preventDefault();
      latest.current(accepted);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [kind, disabled, latest]);
}

/** Loads files handed over by another tool when the page is opened with ?from=handoff. */
export function useHandoffFiles(kind: FileKind, onFiles: (files: File[]) => void) {
  const latest = useLatest(onFiles);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") !== "handoff") return;
    let cancelled = false;
    takeHandoffOnce()
      .then((files) => {
        if (cancelled) return;
        const accepted = files.filter((f) => fileKind(f) === kind);
        if (accepted.length > 0) latest.current(accepted);
      })
      .catch(() => {})
      .finally(() => {
        // Drop the query so a reload does not look like a fresh handoff.
        if (!cancelled) window.history.replaceState(null, "", window.location.pathname);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, latest]);
}

/** Paste + handoff in one call: use this in every tool page. */
export function useIncomingFiles(kind: FileKind, onFiles: (files: File[]) => void, disabled = false) {
  usePasteFiles(kind, onFiles, disabled);
  useHandoffFiles(kind, onFiles);
}
