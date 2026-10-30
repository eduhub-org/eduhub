import { shouldShowExtendedApplicationBanner } from '../extendedApplicationBanner';

const day = (value: string) => new Date(value);

describe('shouldShowExtendedApplicationBanner', () => {
  // 11:00 in Europe/Berlin on 2026-10-28.
  const now = new Date('2026-10-28T10:00:00Z');

  it('shows the badge on the extended deadline day itself', () => {
    expect(shouldShowExtendedApplicationBanner(day('2026-10-28'), day('2026-10-20'), true, now)).toBe(true);
  });

  it('shows the badge before the extended deadline', () => {
    expect(shouldShowExtendedApplicationBanner(day('2026-11-02'), day('2026-10-20'), true, now)).toBe(true);
  });

  it('hides the badge once the extended deadline has passed', () => {
    expect(shouldShowExtendedApplicationBanner(day('2026-10-27'), day('2026-10-20'), true, now)).toBe(false);
  });

  it('hides the badge while the program deadline is still open', () => {
    expect(shouldShowExtendedApplicationBanner(day('2026-11-02'), day('2026-10-28'), true, now)).toBe(false);
  });

  it('hides the badge when the program has it disabled', () => {
    expect(shouldShowExtendedApplicationBanner(day('2026-10-28'), day('2026-10-20'), false, now)).toBe(false);
  });
});
