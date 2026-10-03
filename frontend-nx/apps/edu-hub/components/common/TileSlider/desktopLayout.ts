export const TILE_WIDTH = 325;
export const NAVIGATION_WIDTH = 48;
export const TILE_GAP = 11;
export const EDGE_OFFSET = 12;
const DESKTOP_GRADIENT_WIDTH = 80;

/** Leave a usable neighbor preview at the ends, including near-exact fits. */
export function desktopTileWidth(containerWidth: number, itemCount: number): number {
  if (containerWidth <= 0 || itemCount === 0) return TILE_WIDTH;

  const edgeCards = Math.max(1, Math.floor((containerWidth - EDGE_OFFSET + TILE_GAP) / (TILE_WIDTH + TILE_GAP)));
  if (itemCount <= edgeCards) {
    return Math.min(TILE_WIDTH, (containerWidth - 2 * EDGE_OFFSET - (itemCount - 1) * TILE_GAP) / itemCount);
  }

  const preview = containerWidth - EDGE_OFFSET - edgeCards * (TILE_WIDTH + TILE_GAP);
  // Round down so subpixel layout cannot make the preview smaller than a control.
  return Math.floor((TILE_WIDTH - Math.max(0, NAVIGATION_WIDTH - preview) / edgeCards) * 100) / 100;
}

/**
 * Center complete cards between fixed controls, advancing one card per snap.
 * The first/last snaps keep the normal inset instead of empty navigation gutters.
 */
export function desktopSnapGrid(containerWidth: number, tileWidth: number, itemCount: number) {
  const step = tileWidth + TILE_GAP;
  const contentWidth = itemCount * step - TILE_GAP;
  const first = -EDGE_OFFSET;
  const last = contentWidth - containerWidth + EDGE_OFFSET;
  const completeCards = Math.max(
    1,
    Math.floor((containerWidth - 2 * (NAVIGATION_WIDTH + TILE_GAP) + TILE_GAP) / step)
  );
  const groupWidth = completeCards * step - TILE_GAP;
  const inset = (containerWidth - groupWidth) / 2;
  const slidesGrid = Array.from({ length: itemCount }, (_, index) =>
    index === 0 || last <= first ? index * step + first : index * step - inset
  );
  const snapGrid = slidesGrid.filter((position) => position <= last);

  if (last <= first) return { slidesGrid, snapGrid: [first], gradientWidth: NAVIGATION_WIDTH };
  if (last - snapGrid[snapGrid.length - 1] > 0.01) snapGrid.push(last);

  // Use the smallest preview at any resting position. This stays fixed during
  // navigation, including the asymmetric first/last positions.
  const edgeCards = Math.floor((containerWidth - EDGE_OFFSET + TILE_GAP) / step);
  const edgePreview = containerWidth - EDGE_OFFSET - edgeCards * step;
  const gradientWidth = Math.min(DESKTOP_GRADIENT_WIDTH, inset - TILE_GAP, edgePreview);

  return { slidesGrid, snapGrid, gradientWidth };
}
