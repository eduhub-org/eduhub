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

  // Bound the native centered middle snaps, but supply the actual edge stops
  // ourselves so widget insets do not depend on Swiper's native offsets.
  // Collapse duplicates when the complete row fits to preserve overflow state.
  const middleSnaps = snapGrid.slice(1, -1).map((snap) => Math.min(last, Math.max(first, snap)));
  return Array.from(new Set([first, ...middleSnaps, last]));
}
