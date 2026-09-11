import {
  compareByUpcoming,
  formatDayHeading,
  formatSessionDateSpan,
  groupSessionsByDay,
  isPastEvent,
  lastSessionEnd,
  nextSessionStart,
  sessionDayKey,
  sortEventCoursesByUpcoming,
} from './sessionSchedule';

const TZ = 'Europe/Berlin';

// All fixtures are written in UTC; Europe/Berlin is UTC+2 in September, so
// "2025-09-12T08:00:00Z" is 10:00 local.
const session = (start: string, end?: string | null) => ({ startDateTime: start, endDateTime: end ?? null });

describe('sessionDayKey', () => {
  it('keys by the local day, not the UTC day', () => {
    // 22:30 UTC is 00:30 the next day in Berlin.
    expect(sessionDayKey('2025-09-12T22:30:00Z', TZ)).toBe('2025-09-13');
  });

  it('returns null for an unparseable date', () => {
    expect(sessionDayKey('not-a-date', TZ)).toBeNull();
  });
});

describe('groupSessionsByDay', () => {
  it('buckets by day and sorts days and sessions ascending', () => {
    const groups = groupSessionsByDay(
      [
        session('2025-09-13T08:00:00Z', '2025-09-13T10:00:00Z'),
        session('2025-09-12T13:00:00Z', '2025-09-12T15:00:00Z'),
        session('2025-09-12T08:00:00Z', '2025-09-12T10:00:00Z'),
      ],
      TZ
    );

    expect(groups.map((g) => g.dayKey)).toEqual(['2025-09-12', '2025-09-13']);
    expect(groups[0].sessions.map((s) => s.startDateTime)).toEqual([
      '2025-09-12T08:00:00Z',
      '2025-09-12T13:00:00Z',
    ]);
    expect(groups[1].sessions).toHaveLength(1);
  });

  it('returns an empty list for no sessions and drops unparseable ones', () => {
    expect(groupSessionsByDay([], TZ)).toEqual([]);
    expect(groupSessionsByDay([session('nonsense')], TZ)).toEqual([]);
  });
});

describe('formatDayHeading', () => {
  it('renders the weekday in the requested locale', () => {
    expect(formatDayHeading('2025-09-12T08:00:00Z', TZ, 'de')).toBe('Freitag, 12.09.2025');
    expect(formatDayHeading('2025-09-12T08:00:00Z', TZ, 'en')).toBe('Friday, 12.09.2025');
  });
});

describe('lastSessionEnd', () => {
  it('takes the maximum end, not the end of the last-starting session', () => {
    // The 09:00 session runs all day and outlasts the 13:00 one.
    const end = lastSessionEnd([
      session('2025-09-12T07:00:00Z', '2025-09-12T16:00:00Z'),
      session('2025-09-12T11:00:00Z', '2025-09-12T12:00:00Z'),
    ]);
    expect(end?.toISOString()).toBe('2025-09-12T16:00:00.000Z');
  });

  it('falls back to the start when a session has no end', () => {
    expect(lastSessionEnd([session('2025-09-12T07:00:00Z', null)])?.toISOString()).toBe(
      '2025-09-12T07:00:00.000Z'
    );
  });

  it('is null without sessions', () => {
    expect(lastSessionEnd([])).toBeNull();
  });
});

describe('formatSessionDateSpan', () => {
  it('shows a single session as one day with its time range', () => {
    expect(formatSessionDateSpan([session('2025-09-12T08:00:00Z', '2025-09-12T15:30:00Z')], TZ)).toBe(
      '12.09.2025, 10:00 – 17:30'
    );
  });

  it('uses the earliest start and the latest end within one day', () => {
    expect(
      formatSessionDateSpan(
        [
          session('2025-09-12T11:00:00Z', '2025-09-12T12:00:00Z'),
          session('2025-09-12T08:00:00Z', '2025-09-12T15:30:00Z'),
        ],
        TZ
      )
    ).toBe('12.09.2025, 10:00 – 17:30');
  });

  it('shows a day range when the sessions span several days', () => {
    expect(
      formatSessionDateSpan(
        [
          session('2025-09-14T08:00:00Z', '2025-09-14T10:00:00Z'),
          session('2025-09-12T08:00:00Z', '2025-09-12T10:00:00Z'),
        ],
        TZ
      )
    ).toBe('12.09.2025 – 14.09.2025');
  });

  it('drops the range when start and end times are identical', () => {
    expect(formatSessionDateSpan([session('2025-09-12T08:00:00Z', '2025-09-12T08:00:00Z')], TZ)).toBe(
      '12.09.2025, 10:00'
    );
  });

  it('is null without sessions', () => {
    expect(formatSessionDateSpan([], TZ)).toBeNull();
  });
});

describe('nextSessionStart / isPastEvent', () => {
  const now = new Date('2025-09-13T09:00:00Z');
  const twoDayEvent = [
    session('2025-09-12T08:00:00Z', '2025-09-12T10:00:00Z'),
    session('2025-09-14T08:00:00Z', '2025-09-14T10:00:00Z'),
  ];

  it('finds the first session that has not started', () => {
    expect(nextSessionStart(twoDayEvent, now)?.toISOString()).toBe('2025-09-14T08:00:00.000Z');
  });

  it('is null once everything has started', () => {
    expect(nextSessionStart([session('2025-09-12T08:00:00Z', '2025-09-12T10:00:00Z')], now)).toBeNull();
  });

  it('marks an event past only after its last session ended', () => {
    expect(isPastEvent(twoDayEvent, now)).toBe(false);
    expect(isPastEvent(twoDayEvent, new Date('2025-09-15T00:00:00Z'))).toBe(true);
  });

  it('never marks a course without sessions as past', () => {
    expect(isPastEvent([], now)).toBe(false);
  });
});

describe('compareByUpcoming', () => {
  const now = new Date('2025-09-13T09:00:00Z');
  const soon = { Sessions: [session('2025-09-14T08:00:00Z', '2025-09-14T10:00:00Z')] };
  const later = { Sessions: [session('2025-09-20T08:00:00Z', '2025-09-20T10:00:00Z')] };
  const running = {
    Sessions: [
      session('2025-09-12T08:00:00Z', '2025-09-12T10:00:00Z'),
      session('2025-09-13T08:00:00Z', '2025-09-13T18:00:00Z'),
    ],
  };
  const longPast = { Sessions: [session('2025-01-10T08:00:00Z', '2025-01-10T10:00:00Z')] };
  const recentPast = { Sessions: [session('2025-09-01T08:00:00Z', '2025-09-01T10:00:00Z')] };
  const undated = { Sessions: [] };

  it('puts upcoming first, then past newest-first, then undated', () => {
    const sorted = [longPast, undated, later, recentPast, soon].sort((a, b) => compareByUpcoming(a, b, now));
    expect(sorted).toEqual([soon, later, recentPast, longPast, undated]);
  });

  it('keeps an event that is currently running ahead of later ones', () => {
    const sorted = [later, running].sort((a, b) => compareByUpcoming(a, b, now));
    expect(sorted).toEqual([running, later]);
  });
});

describe('sortEventCoursesByUpcoming', () => {
  const now = new Date('2025-09-13T09:00:00Z');
  const event = (id: string, start: string) => ({
    id,
    Program: { type: 'EVENTS' },
    Sessions: [session(start, start)],
  });

  it('orders an all-event list by next session', () => {
    const input = [event('late', '2025-09-20T08:00:00Z'), event('soon', '2025-09-14T08:00:00Z')];
    expect(sortEventCoursesByUpcoming(input, now).map((c) => c.id)).toEqual(['soon', 'late']);
  });

  it('leaves a mixed list untouched', () => {
    const input = [
      event('late', '2025-09-20T08:00:00Z'),
      { id: 'course', Program: { type: 'COURSES' }, Sessions: [session('2025-09-14T08:00:00Z')] },
    ];
    expect(sortEventCoursesByUpcoming(input, now).map((c) => c.id)).toEqual(['late', 'course']);
  });

  it('does not mutate its input', () => {
    const input = [event('late', '2025-09-20T08:00:00Z'), event('soon', '2025-09-14T08:00:00Z')];
    sortEventCoursesByUpcoming(input, now);
    expect(input.map((c) => c.id)).toEqual(['late', 'soon']);
  });

  it('handles an empty list', () => {
    expect(sortEventCoursesByUpcoming([], now)).toEqual([]);
  });
});
