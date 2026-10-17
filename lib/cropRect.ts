// Geometry helpers shared by the image and PDF crop tools. All values are in the same unit
// (image pixels or page fractions); the caller decides which.
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = "move" | "tl" | "t" | "tr" | "r" | "br" | "b" | "bl" | "l";

export const HANDLES: { id: Handle; cls: string; cursor: string; corner: boolean }[] = [
  { id: "tl", cls: "-top-2 -left-2", cursor: "nwse-resize", corner: true },
  { id: "t", cls: "-top-2 left-1/2 -translate-x-1/2", cursor: "ns-resize", corner: false },
  { id: "tr", cls: "-top-2 -right-2", cursor: "nesw-resize", corner: true },
  { id: "r", cls: "top-1/2 -right-2 -translate-y-1/2", cursor: "ew-resize", corner: false },
  { id: "br", cls: "-bottom-2 -right-2", cursor: "nwse-resize", corner: true },
  { id: "b", cls: "-bottom-2 left-1/2 -translate-x-1/2", cursor: "ns-resize", corner: false },
  { id: "bl", cls: "-bottom-2 -left-2", cursor: "nesw-resize", corner: true },
  { id: "l", cls: "top-1/2 -left-2 -translate-y-1/2", cursor: "ew-resize", corner: false },
];

/** Largest centered rectangle with the given ratio (or 90% of the image when free). */
export function fitRect(W: number, H: number, ratio: number | null): Rect {
  if (ratio === null) return { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9 };
  let w = W;
  let h = w / ratio;
  if (h > H) {
    h = H;
    w = h * ratio;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export function applyDrag(
  handle: Handle,
  start: Rect,
  dx: number,
  dy: number,
  W: number,
  H: number,
  ratio: number | null,
  MIN_SIZE = 24
): Rect {
  if (handle === "move") {
    return { ...start, x: clamp(start.x + dx, 0, W - start.w), y: clamp(start.y + dy, 0, H - start.h) };
  }

  const left = handle.includes("l");
  const right = handle.includes("r");
  const top = handle.includes("t");
  const bottom = handle.includes("b");

  if (ratio !== null) {
    // Corner handles only: keep the opposite corner fixed and the ratio constant.
    const ax = left ? start.x + start.w : start.x;
    const ay = top ? start.y + start.h : start.y;
    const px = (left ? start.x : start.x + start.w) + dx;
    const py = (top ? start.y : start.y + start.h) + dy;
    const availX = left ? ax : W - ax;
    const availY = top ? ay : H - ay;
    const maxW = Math.min(availX, availY * ratio);
    let w = Math.max(Math.abs(px - ax), Math.abs(py - ay) * ratio);
    w = clamp(w, Math.min(MIN_SIZE, maxW), maxW);
    const h = w / ratio;
    return { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
  }

  let { x, y, w, h } = start;
  if (left) {
    const nx = clamp(start.x + dx, 0, start.x + start.w - MIN_SIZE);
    w = start.x + start.w - nx;
    x = nx;
  } else if (right) {
    w = clamp(start.w + dx, MIN_SIZE, W - start.x);
  }
  if (top) {
    const ny = clamp(start.y + dy, 0, start.y + start.h - MIN_SIZE);
    h = start.y + start.h - ny;
    y = ny;
  } else if (bottom) {
    h = clamp(start.h + dy, MIN_SIZE, H - start.y);
  }
  return { x, y, w, h };
}

