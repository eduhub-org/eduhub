import { desktopSnapGrid, desktopTileWidth, EDGE_OFFSET, NAVIGATION_WIDTH, TILE_GAP } from '../desktopLayout';

describe('desktop slider layout', () => {
  it.each([960, 1216])('centers a group of complete cards at %ipx', (width) => {
    const tileWidth = desktopTileWidth(width, 10);
    const { snapGrid } = desktopSnapGrid(width, tileWidth, 10);
    const completeCards = width === 960 ? 2 : 3;
    const inset = (width - (completeCards * tileWidth + (completeCards - 1) * TILE_GAP)) / 2;

    expect(tileWidth).toBe(325);
    expect(tileWidth + TILE_GAP - snapGrid[1]).toBe(inset);
    expect(inset - TILE_GAP).toBeGreaterThanOrEqual(NAVIGATION_WIDTH);
    expect(snapGrid[2] - snapGrid[1]).toBe(tileWidth + TILE_GAP);
  });

  it('keeps the first and last cards at the narrow inset', () => {
    const width = 960;
    const tileWidth = desktopTileWidth(width, 7);
    const { snapGrid } = desktopSnapGrid(width, tileWidth, 7);

    expect(-snapGrid[0]).toBe(EDGE_OFFSET);
    expect(7 * tileWidth + 6 * TILE_GAP - snapGrid[snapGrid.length - 1]).toBe(width - EDGE_OFFSET);
  });

  it('never leaves tiny neighbor previews at desktop resting positions', () => {
    for (let width = 768; width <= 1920; width += 1) {
      const tileWidth = desktopTileWidth(width, 10);
      const { slidesGrid, snapGrid, gradientWidth } = desktopSnapGrid(width, tileWidth, 10);
      const step = tileWidth + TILE_GAP;

      expect(tileWidth).toBeLessThanOrEqual(325);
      expect(gradientWidth).toBeGreaterThanOrEqual(NAVIGATION_WIDTH);
      expect(gradientWidth).toBeLessThanOrEqual(80);
      expect(slidesGrid[0]).toBe(snapGrid[0]);
      expect(snapGrid.every((snap, index) => index === 0 || snap > snapGrid[index - 1])).toBe(true);
      snapGrid.forEach((snap, index) => {
        const visible = Array.from({ length: 10 }, (_, card) => ({
          left: card * step - snap,
          right: card * step - snap + tileWidth,
        })).filter((card) => card.right > 0 && card.left < width);

        if (index > 0) expect(visible[0].right).toBeGreaterThanOrEqual(gradientWidth - 0.02);
        if (index < snapGrid.length - 1) {
          expect(width - visible[visible.length - 1].left).toBeGreaterThanOrEqual(gradientWidth - 0.02);
        }
        visible.filter((card) => card.left >= 0 && card.right <= width).forEach((card) => {
          if (index > 0) expect(card.left).toBeGreaterThanOrEqual(gradientWidth);
          if (index < snapGrid.length - 1) expect(card.right).toBeLessThanOrEqual(width - gradientWidth);
        });
      });
    }
  });

  it.each([960, 1216])('extends the fade to 80px when previews allow it at %ipx', (width) => {
    const tileWidth = desktopTileWidth(width, 10);
    expect(desktopSnapGrid(width, tileWidth, 10).gradientWidth).toBe(80);
  });

  it('caps the fade at the smaller end preview for near-exact fits', () => {
    const width = 1010;
    const tileWidth = desktopTileWidth(width, 10);
    expect(desktopSnapGrid(width, tileWidth, 10).gradientWidth).toBeCloseTo(48, 1);
  });

  it.each([0, 1, 2, 3])('does not add navigation when %i cards fit', (count) => {
    const tileWidth = desktopTileWidth(1216, count);
    expect(desktopSnapGrid(1216, tileWidth, count).snapGrid).toEqual([-EDGE_OFFSET]);
  });

  it('shrinks a nearly fitting row rather than scrolling a few pixels', () => {
    const tileWidth = desktopTileWidth(1010, 3);
    expect(tileWidth).toBeLessThan(325);
    expect(desktopSnapGrid(1010, tileWidth, 3).snapGrid).toEqual([-EDGE_OFFSET]);
  });
});
