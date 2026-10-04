import { MOBILE_EDGE_OFFSET, mobileSnapGrid } from '../mobileLayout';

describe('mobile slider edge alignment', () => {
  it('keeps equal first/last insets without moving centered middle snaps', () => {
    const snaps = mobileSnapGrid(390, 294, 3, [-12, 257, 550], MOBILE_EDGE_OFFSET);

    expect(snaps).toEqual([-12, 257, 526]);
    expect(-snaps[0]).toBe(MOBILE_EDGE_OFFSET);
    expect(390 - (3 * 294 + 2 * 11 - snaps[2])).toBe(MOBILE_EDGE_OFFSET);
    expect(294 + 11 - snaps[1]).toBe((390 - 294) / 2);
  });

  it('removes the extra offset at the last of two cards', () => {
    expect(mobileSnapGrid(390, 294, 2, [-12, 245], MOBILE_EDGE_OFFSET)).toEqual([-12, 221]);
  });

  it('keeps narrow desktop rows flush with their content grid', () => {
    expect(mobileSnapGrid(640, 325, 2, [0, 21], 0)).toEqual([0, 21]);
  });

  it('collapses duplicate stops when every card fits', () => {
    expect(mobileSnapGrid(767, 325, 2, [-12, 12], MOBILE_EDGE_OFFSET)).toEqual([-12]);
    expect(mobileSnapGrid(767, 325, 2, [0, 0], 0)).toEqual([0]);
  });

  it('keeps a single card at the starting inset', () => {
    expect(mobileSnapGrid(390, 294, 1, [-12], MOBILE_EDGE_OFFSET)).toEqual([-12]);
  });

  it('handles an empty row', () => {
    expect(mobileSnapGrid(390, 294, 0, [], MOBILE_EDGE_OFFSET)).toEqual([0]);
  });
});
