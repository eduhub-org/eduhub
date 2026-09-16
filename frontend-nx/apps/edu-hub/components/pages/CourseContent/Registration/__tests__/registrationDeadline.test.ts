import { isRegistrationClosed } from '../types';

/**
 * How the value reaches the component: a date-only scalar turned into a Date by
 * the Course.applicationEnd merge in config/apollo.ts, so it lands on UTC
 * midnight of the calendar day it stands for.
 */
const applicationEnd = (day: string) => new Date(day);

describe('isRegistrationClosed', () => {
  // 11:00 in Europe/Berlin on 2026-09-14.
  const onDeadlineDay = new Date('2026-09-14T09:00:00Z');

  it('keeps the deadline day itself open', () => {
    expect(isRegistrationClosed(applicationEnd('2026-09-14'), onDeadlineDay)).toBe(false);
  });

  it('closes from the following day', () => {
    expect(isRegistrationClosed(applicationEnd('2026-09-13'), onDeadlineDay)).toBe(true);
  });

  it('stays open well before the deadline', () => {
    expect(isRegistrationClosed(applicationEnd('2026-09-30'), onDeadlineDay)).toBe(false);
  });

  it('holds the deadline day open for its whole length, in the app timezone', () => {
    const day = applicationEnd('2026-09-14');
    // 22:01Z on the 13th is already the 14th in Berlin; 21:59Z on the 14th is
    // still the 14th. Both must read as open, and the boundary must not move
    // with the runner's own timezone - the check used to compare against the
    // visitor's local midnight, which closed the day early at and west of UTC.
    expect(isRegistrationClosed(day, new Date('2026-09-13T22:01:00Z'))).toBe(false);
    expect(isRegistrationClosed(day, new Date('2026-09-14T21:59:00Z'))).toBe(false);
    expect(isRegistrationClosed(day, new Date('2026-09-14T22:01:00Z'))).toBe(true);
  });
});
