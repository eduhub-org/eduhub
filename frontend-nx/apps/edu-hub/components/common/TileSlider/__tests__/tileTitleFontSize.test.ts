import {
  fitFontSizeToHeight,
  resolveTileTitleFontSizePx,
  TILE_TITLE_FONT_SIZE_MAX_PX,
  TILE_TITLE_FONT_SIZE_MIN_PX,
} from '../tileTitleFontSize';

describe('resolveTileTitleFontSizePx', () => {
  it('uses the max size for short titles', () => {
    expect(resolveTileTitleFontSizePx('Werkstudent Frontend')).toBe(TILE_TITLE_FONT_SIZE_MAX_PX);
  });

  it('steps down as the title gets longer', () => {
    expect(resolveTileTitleFontSizePx('a'.repeat(50))).toBe(24);
    expect(resolveTileTitleFontSizePx('a'.repeat(70))).toBe(20);
    expect(resolveTileTitleFontSizePx('a'.repeat(90))).toBe(17);
    expect(resolveTileTitleFontSizePx('a'.repeat(110))).toBe(TILE_TITLE_FONT_SIZE_MIN_PX);
  });

  it('uses the minimum size near the course title input limit (200)', () => {
    expect(resolveTileTitleFontSizePx('a'.repeat(200))).toBe(TILE_TITLE_FONT_SIZE_MIN_PX);
  });
});

describe('fitFontSizeToHeight', () => {
  it('keeps max size when content already fits', () => {
    const size = fitFontSizeToHeight(() => 80, 100, 28, 15);
    expect(size).toBe(28);
  });

  it('shrinks until the measured height fits', () => {
    const size = fitFontSizeToHeight((fontSize) => fontSize * 5, 80, 28, 15);
    // 16 * 5 = 80 fits; 17 * 5 = 85 overflows
    expect(size).toBe(16);
  });

  it('stops at minPx when even the minimum overflows', () => {
    const size = fitFontSizeToHeight(() => 999, 50, 28, 15);
    expect(size).toBe(15);
  });
});
