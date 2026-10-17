// Document-scanning helpers: perspective correction (hand-written homography, no OpenCV) and filters.
export interface Pt {
  x: number;
  y: number;
}

/** Corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Pt, Pt, Pt, Pt];

export type ScanFilter = "original" | "gray" | "bw";

/** Solves A·x = b (n×n) by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const d = M[col][col] || 1e-12;
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

/** Homography H (3×3, h33 = 1) mapping the rectangle (0,0)-(w,h) onto `quad`. */
function homographyFromRect(w: number, h: number, quad: Quad): number[] {
  const dst: Pt[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dst[i];
    const { x: X, y: Y } = quad[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  return [...solve(A, b), 1];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Output size for a quad: average of opposite edge lengths, capped to `maxDim` on the long side. */
export function outputSize(quad: Quad, maxDim: number): { w: number; h: number } {
  let w = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2;
  let h = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  const scale = Math.min(1, maxDim / Math.max(w, h, 1));
  w = Math.max(16, Math.round(w * scale));
  h = Math.max(16, Math.round(h * scale));
  return { w, h };
}

/** Flattens the area inside `quad` (source pixel coordinates) into an upright rectangle (inverse mapping, bilinear). */
export function warpPerspective(source: HTMLCanvasElement, quad: Quad, maxDim: number): HTMLCanvasElement {
  const { w, h } = outputSize(quad, maxDim);
  const sctx = source.getContext("2d", { willReadFrequently: true });
  if (!sctx) throw new Error("Gagal membuat canvas context");
  const sw = source.width;
  const sh = source.height;
  const src = sctx.getImageData(0, 0, sw, sh).data;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Gagal membuat canvas context");
  const dstImg = octx.createImageData(w, h);
  const dst = dstImg.data;

  const H = homographyFromRect(w, h, quad);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const z = H[6] * x + H[7] * y + 1;
      const sx = (H[0] * x + H[1] * y + H[2]) / z;
      const sy = (H[3] * x + H[4] * y + H[5]) / z;
      const o = (y * w + x) * 4;
      if (sx < 0 || sy < 0 || sx > sw - 1 || sy > sh - 1) {
        dst[o] = dst[o + 1] = dst[o + 2] = 255;
        dst[o + 3] = 255;
        continue;
      }
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, sw - 1);
      const y1 = Math.min(y0 + 1, sh - 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c] * (1 - fx) + src[i10 + c] * fx;
        const bottom = src[i01 + c] * (1 - fx) + src[i11 + c] * fx;
        dst[o + c] = top * (1 - fy) + bottom * fy;
      }
      dst[o + 3] = 255;
    }
  }
  octx.putImageData(dstImg, 0, 0);
  return out;
}

/** Applies a filter in place. "bw" uses an adaptive (local-mean) threshold so shadows do not turn black. */
export function applyScanFilter(canvas: HTMLCanvasElement, filter: ScanFilter): void {
  if (filter === "original") return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;

  if (filter === "gray") {
    for (let i = 0; i < gray.length; i++) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = gray[i];
  } else {
    // Integral image for O(1) window means.
    const stride = w + 1;
    const integral = new Float64Array(stride * (h + 1));
    for (let y = 0; y < h; y++) {
      let rowSum = 0;
      for (let x = 0; x < w; x++) {
        rowSum += gray[y * w + x];
        integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
      }
    }
    const half = Math.max(7, Math.floor(Math.min(w, h) / 16));
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half);
      const y1 = Math.min(h, y + half + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half);
        const x1 = Math.min(w, x + half + 1);
        const sum = integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0];
        const mean = sum / ((x1 - x0) * (y1 - y0));
        const v = gray[y * w + x] < mean * 0.9 ? 0 : 255;
        const o = (y * w + x) * 4;
        d[o] = d[o + 1] = d[o + 2] = v;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}
