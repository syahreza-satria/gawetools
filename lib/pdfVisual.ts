import type { PDFPage } from "pdf-lib";

export interface VisualPageInfo {
  /** Page size as the viewer shows it (pdf points, /Rotate applied). */
  width: number;
  height: number;
  /** Display rotation in degrees: 0, 90, 180 or 270. */
  rotation: 0 | 90 | 180 | 270;
  /** Maps a point on the visual page (origin bottom-left) to the page's own, unrotated coordinates. */
  toPage: (vx: number, vy: number) => { x: number; y: number };
}

/**
 * pdf-lib draws in the page's unrotated space, but users think in the page as displayed.
 * This describes the displayed page and converts display coordinates back, so overlays
 * (page numbers, signatures) land correctly on pages that carry a /Rotate entry.
 */
export function describeVisualPage(page: PDFPage): VisualPageInfo {
  const box = page.getMediaBox();
  const W = box.width;
  const H = box.height;
  const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
  const swap = rotation === 90 || rotation === 270;

  const toPage = (vx: number, vy: number) => {
    switch (rotation) {
      case 90:
        return { x: box.x + (W - vy), y: box.y + vx };
      case 180:
        return { x: box.x + (W - vx), y: box.y + (H - vy) };
      case 270:
        return { x: box.x + vy, y: box.y + (H - vx) };
      default:
        return { x: box.x + vx, y: box.y + vy };
    }
  };

  return { width: swap ? H : W, height: swap ? W : H, rotation, toPage };
}
