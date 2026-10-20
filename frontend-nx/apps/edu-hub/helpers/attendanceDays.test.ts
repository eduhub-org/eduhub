import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import { getAttendanceStatusFromDays, getDayStatus, groupSessionsIntoAttendanceDays } from './attendanceDays';

const { ATTENDED, MISSED, NO_INFO } = AttendanceStatus_enum;
const TZ = 'Europe/Berlin';

const session = (id: number, startDateTime: string, isMandatory: boolean | null = true) => ({
  id,
  startDateTime,
  isMandatory,
});

// Two sessions on 14 Oct (one late in the evening, still the 14th in Berlin), one on the 15th.
const sessions = [
  session(1, '2026-10-14T08:00:00Z'),
  session(2, '2026-10-14T21:30:00Z'),
  session(3, '2026-10-15T08:00:00Z'),
  session(4, '2026-10-16T08:00:00Z', false),
];
const days = groupSessionsIntoAttendanceDays(sessions, TZ);
const status = (entries: Record<number, AttendanceStatus_enum>) =>
  Object.fromEntries(Object.entries(entries).map(([id, s]) => [id, { status: s }]));

describe('groupSessionsIntoAttendanceDays', () => {
  it('buckets sessions by their local calendar day', () => {
    expect(days.map((day) => [day.dayKey, day.sessions.map((s) => s.id), day.mandatory])).toEqual([
      ['2026-10-14', [1, 2], true],
      ['2026-10-15', [3], true],
      ['2026-10-16', [4], false],
    ]);
  });

  it('switches the day at local midnight, not UTC', () => {
    // 22:30 UTC on the 14th is 00:30 on the 15th in Berlin.
    const [late] = groupSessionsIntoAttendanceDays([session(1, '2026-10-14T22:30:00Z')], TZ);
    expect(late.dayKey).toBe('2026-10-15');
  });
});

describe('getDayStatus', () => {
  it('counts a day as attended when any session was attended', () => {
    expect(getDayStatus(days[0], status({ 1: MISSED, 2: ATTENDED }))).toBe(ATTENDED);
  });

  it('counts a day as missed when sessions were missed and none attended', () => {
    expect(getDayStatus(days[0], status({ 1: MISSED }))).toBe(MISSED);
  });

  it('has no info without recorded attendance', () => {
    expect(getDayStatus(days[0], status({}))).toBe(NO_INFO);
    expect(getDayStatus(days[0], status({ 1: NO_INFO }))).toBe(NO_INFO);
  });

  it('ignores optional sessions on a mandatory day', () => {
    const [day] = groupSessionsIntoAttendanceDays(
      [session(1, '2026-10-14T08:00:00Z'), session(2, '2026-10-14T12:00:00Z', false)],
      TZ
    );
    expect(getDayStatus(day, status({ 1: MISSED, 2: ATTENDED }))).toBe(MISSED);
  });

  it('uses the optional sessions of an optional day', () => {
    expect(getDayStatus(days[2], status({ 4: ATTENDED }))).toBe(ATTENDED);
  });
});

describe('getAttendanceStatusFromDays', () => {
  it('counts a missed day once, however many sessions it had', () => {
    const missedFirstDay = status({ 1: MISSED, 2: MISSED, 3: ATTENDED });
    expect(getAttendanceStatusFromDays(days, missedFirstDay, 0)).toBe('failed');
    expect(getAttendanceStatusFromDays(days, missedFirstDay, 1)).toBe('passed');
  });

  it('is uncertain while unrecorded mandatory days could still exceed the limit', () => {
    expect(getAttendanceStatusFromDays(days, status({ 1: ATTENDED }), 0)).toBe('uncertain');
    expect(getAttendanceStatusFromDays(days, status({ 1: ATTENDED }), 1)).toBe('passed');
  });

  it('never counts optional days', () => {
    expect(getAttendanceStatusFromDays(days, status({ 1: ATTENDED, 3: ATTENDED, 4: MISSED }), 0)).toBe('passed');
  });
});
