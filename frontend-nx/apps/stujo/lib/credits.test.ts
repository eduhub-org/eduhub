import { summarizeCredits } from './credits';

describe('summarizeCredits', () => {
  it('treats no credits as nothing free', () => {
    expect(summarizeCredits([])).toEqual({ unlimited: false, total: 0, hasFree: false });
    expect(summarizeCredits(undefined)).toEqual({ unlimited: false, total: 0, hasFree: false });
  });

  it('sums countable credits', () => {
    expect(summarizeCredits([{ remaining: 2 }, { remaining: 3, unlimited: false }])).toEqual({
      unlimited: false,
      total: 5,
      hasFree: true,
    });
  });

  it('ignores exhausted credits', () => {
    expect(summarizeCredits([{ remaining: 0 }])).toEqual({
      unlimited: false,
      total: 0,
      hasFree: false,
    });
  });

  it('reports an unlimited grant without counting its remaining', () => {
    expect(summarizeCredits([{ remaining: 0, unlimited: true }])).toEqual({
      unlimited: true,
      total: 0,
      hasFree: true,
    });
  });

  it('keeps countable and unlimited grants apart', () => {
    expect(summarizeCredits([{ remaining: 4 }, { remaining: 99, unlimited: true }])).toEqual({
      unlimited: true,
      total: 4,
      hasFree: true,
    });
  });
});
