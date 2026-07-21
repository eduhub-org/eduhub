import { useLayoutEffect, useRef, useState } from 'react';

import {
  fitFontSizeToHeight,
  resolveTileTitleFontSizePx,
  TILE_TITLE_FONT_SIZE_MIN_PX,
} from './tileTitleFontSize';

/**
 * Returns refs for a title box + text node, and a font size that fits the title
 * into that box. Starts from a length-based estimate, then shrinks further if
 * the text still overflows. Put `titleBoxRef` on the height-constrained wrapper
 * and `titleRef` on the text element (so the text can stay bottom-aligned).
 */
export const useFittingTileTitleFontSize = (title: string) => {
  const titleBoxRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleFontSizePx, setTitleFontSizePx] = useState(() => resolveTileTitleFontSizePx(title));

  useLayoutEffect(() => {
    const box = titleBoxRef.current;
    const el = titleRef.current;
    if (!box || !el) return;

    const initial = resolveTileTitleFontSizePx(title);
    const availableHeight = box.clientHeight;
    if (availableHeight <= 0) {
      setTitleFontSizePx(initial);
      return;
    }

    const fitted = fitFontSizeToHeight(
      (size) => {
        el.style.fontSize = `${size}px`;
        return el.scrollHeight;
      },
      availableHeight,
      initial,
      TILE_TITLE_FONT_SIZE_MIN_PX
    );
    setTitleFontSizePx(fitted);
  }, [title]);

  return { titleBoxRef, titleRef, titleFontSizePx };
};
