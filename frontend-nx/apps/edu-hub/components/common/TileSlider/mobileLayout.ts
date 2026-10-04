import { TILE_GAP } from './desktopLayout';

export const MOBILE_EDGE_OFFSET = 12;

/** Keep centered snaps, but bound them to the actual first/last card edges. */
export function mobileSnapGrid(
  containerWidth: number,
  tileWidth: number,
  itemCount: number,
  snapGrid: number[],
  edgeOffset: number
) {
  if (itemCount === 0) return [0];

  const first = -edgeOffset;
  const contentWidth = itemCount * tileWidth + (itemCount - 1) * TILE_GAP;
  const last = Math.max(first, contentWidth - containerWidth + edgeOffset);

  // Swiper subtracts both offsets from its slide area before applying bounds,
  // which otherwise counts them again at the last snap. Collapse duplicate
  // stops when the complete row fits so native overflow state stays correct.
  return Array.from(new Set(snapGrid.map((snap) => Math.min(last, Math.max(first, snap)))));
}
