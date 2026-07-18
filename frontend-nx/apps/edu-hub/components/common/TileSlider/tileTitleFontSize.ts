/** Default title size in tile headers (matches former text-3xl). */
export const TILE_TITLE_FONT_SIZE_MAX_PX = 28;
/** Smallest title size used for very long titles. */
export const TILE_TITLE_FONT_SIZE_MIN_PX = 15;

/**
 * Pick a header title font size from title length so long titles stay readable.
 * Used as the initial size; tiles may shrink further at render time if the text
 * still overflows its box. Tuned for EduHub course titles (InputField max 200).
 */
export const resolveTileTitleFontSizePx = (title: string): number => {
  const length = title.trim().length;
  if (length > 100) return TILE_TITLE_FONT_SIZE_MIN_PX;
  if (length > 80) return 17;
  if (length > 60) return 20;
  if (length > 45) return 24;
  return TILE_TITLE_FONT_SIZE_MAX_PX;
};

/**
 * Shrink a font size until `measureScrollHeight(size)` fits in `availableHeight`,
 * stepping down 1px at a time. Returns `minPx` when even the minimum overflows.
 */
export const fitFontSizeToHeight = (
  measureScrollHeight: (fontSizePx: number) => number,
  availableHeight: number,
  maxPx: number,
  minPx: number
): number => {
  let size = maxPx;
  while (size > minPx && measureScrollHeight(size) > availableHeight) {
    size -= 1;
  }
  return size;
};
