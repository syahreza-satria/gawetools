/**
 * Page order for saddle-stitch printing. With N pages (padded to a multiple of 4), sheet k carries
 * front: N-1-2k | 2k and back: 2k+1 | N-2-2k  (1-based: N,1 / 2,N-1 / N-2,3 / 4,N-3 ...).
 * `null` marks a blank filler page.
 */
export function bookletOrder(count: number): (number | null)[][] {
  const total = Math.ceil(count / 4) * 4;
  const pick = (i: number) => (i < count ? i : null);
  const sides: (number | null)[][] = [];
  for (let k = 0; k < total / 4; k++) {
    sides.push([pick(total - 1 - 2 * k), pick(2 * k)]);
    sides.push([pick(2 * k + 1), pick(total - 2 - 2 * k)]);
  }
  return sides;
}
