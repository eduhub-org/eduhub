/**
 * Session Schedule Helpers
 *
 * Grouping, span formatting and ordering for a course's sessions. Events publish
 * their sessions as a daily agenda and put a date span on the tile, the hero and
 * the info panel, so all of that reasoning lives here rather than being repeated
 * per component.
 *
 * Every function takes the timezone (and where relevant the locale and "now") as
 * an argument instead of reading a context, so they stay pure and unit-testable.
 * Pinning the timezone also keeps server and client rendering in agreement — the
 * same reason `components/common/TileSlider/jobTileHelpers.ts` does it.
 */

import { parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

export type ScheduleSession = {
  startDateTime: Date | string;
  endDateTime?: Date | string | null;
};

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (value == null) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateFnsLocale = (locale: string) => (locale?.toLowerCase().startsWith('de') ? de : enUS);

/** "yyyy-MM-dd" in the given timezone — the grouping key and the day sort key. */
export const sessionDayKey = (value: Date | string, timeZone: string): string | null => {
  const date = toDate(value);
  return date ? formatInTimeZone(date, timeZone, 'yyyy-MM-dd') : null;
};

/**
 * Sessions bucketed by the calendar day they start on: days ascending, and the
 * sessions inside each day ascending by start time. Sessions with an unparseable
 * start are dropped — there is no day to file them under.
 */
export const groupSessionsByDay = <T extends ScheduleSession>(
  sessions: T[],
  timeZone: string
): { dayKey: string; dayStart: Date; sessions: T[] }[] => {
  const buckets = new Map<string, { dayKey: string; dayStart: Date; sessions: T[] }>();

  for (const session of sessions ?? []) {
    const start = toDate(session.startDateTime);
    if (!start) continue;

    const dayKey = formatInTimeZone(start, timeZone, 'yyyy-MM-dd');
    const bucket = buckets.get(dayKey);
    if (bucket) {
      bucket.sessions.push(session);
      if (start < bucket.dayStart) bucket.dayStart = start;
    } else {
      buckets.set(dayKey, { dayKey, dayStart: start, sessions: [session] });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .map((bucket) => ({
      ...bucket,
      sessions: [...bucket.sessions].sort(
        (a, b) => (toDate(a.startDateTime)?.getTime() ?? 0) - (toDate(b.startDateTime)?.getTime() ?? 0)
      ),
    }));
};

/** "Freitag, 12.09.2025" — the heading above one day of an agenda. */
export const formatDayHeading = (dayStart: Date | string, timeZone: string, locale: string): string => {
  const date = toDate(dayStart);
  if (!date) return '';
  return formatInTimeZone(date, timeZone, 'EEEE, dd.MM.yyyy', { locale: dateFnsLocale(locale) });
};

/** Earliest start across all sessions, ignoring the order they arrive in. */
export const firstSessionStart = (sessions: ScheduleSession[]): Date | null => {
  let earliest: Date | null = null;
  for (const session of sessions ?? []) {
    const start = toDate(session.startDateTime);
    if (start && (!earliest || start < earliest)) earliest = start;
  }
  return earliest;
};

/**
 * Latest end across all sessions. Deliberately a max rather than
 * `sessions.at(-1)`: the session that starts last is not necessarily the one
 * that ends last. Falls back to a session's start when it has no end.
 */
export const lastSessionEnd = (sessions: ScheduleSession[]): Date | null => {
  let latest: Date | null = null;
  for (const session of sessions ?? []) {
    const end = toDate(session.endDateTime) ?? toDate(session.startDateTime);
    if (end && (!latest || end > latest)) latest = end;
  }
  return latest;
};

/**
 * The one date line for an event:
 *   multi-day  -> "12.09.2025 – 14.09.2025"
 *   single-day -> "12.09.2025, 10:00 – 17:30"  (earliest start to latest end)
 * null when there are no usable sessions.
 */
export const formatSessionDateSpan = (sessions: ScheduleSession[], timeZone: string): string | null => {
  const start = firstSessionStart(sessions);
  if (!start) return null;
  const end = lastSessionEnd(sessions) ?? start;

  const startDay = formatInTimeZone(start, timeZone, 'dd.MM.yyyy');
  const endDay = formatInTimeZone(end, timeZone, 'dd.MM.yyyy');

  if (startDay !== endDay) {
    return `${startDay} – ${endDay}`;
  }

  const startTime = formatInTimeZone(start, timeZone, 'HH:mm');
  const endTime = formatInTimeZone(end, timeZone, 'HH:mm');
  return startTime === endTime ? `${startDay}, ${startTime}` : `${startDay}, ${startTime} – ${endTime}`;
};

/** Start of the first session that has not started yet, or null if all are past. */
export const nextSessionStart = (sessions: ScheduleSession[], now: Date): Date | null => {
  let next: Date | null = null;
  for (const session of sessions ?? []) {
    const start = toDate(session.startDateTime);
    if (start && start >= now && (!next || start < next)) next = start;
  }
  return next;
};

/** True once every session has finished. A course without sessions is never "past". */
export const isPastEvent = (sessions: ScheduleSession[], now: Date): boolean => {
  const end = lastSessionEnd(sessions);
  return end != null && end < now;
};

/** True while a session is under way: it has started and has not ended. */
export const hasActiveSession = (sessions: ScheduleSession[], now: Date): boolean =>
  (sessions ?? []).some((session) => {
    const start = toDate(session.startDateTime);
    if (!start || start > now) return false;
    const end = toDate(session.endDateTime) ?? start;
    return end >= now;
  });

/**
 * Listing order for events: anything not finished yet first (soonest next
 * session first, so an event already under way stays at the top), then finished
 * ones most-recently-finished first, then anything without a usable date.
 */
export const compareByUpcoming = (
  a: { Sessions?: ScheduleSession[] | null },
  b: { Sessions?: ScheduleSession[] | null },
  now: Date
): number => {
  const rank = (course: { Sessions?: ScheduleSession[] | null }) => {
    const sessions = course.Sessions ?? [];
    const end = lastSessionEnd(sessions);
    if (!end) return { group: 2, time: 0 };
    // Finished: newest first, so the most recent past event leads the tail.
    if (end < now) return { group: 1, time: -end.getTime() };
    // Under way right now: sort as though it starts this instant, so it stays
    // ahead of anything merely scheduled sooner than its own next session.
    if (hasActiveSession(sessions, now)) return { group: 0, time: now.getTime() };
    // Upcoming, or between sessions: order by whichever session comes next.
    return { group: 0, time: (nextSessionStart(sessions, now) ?? end).getTime() };
  };

  const rankA = rank(a);
  const rankB = rank(b);
  return rankA.group !== rankB.group ? rankA.group - rankB.group : rankA.time - rankB.time;
};

/**
 * Orders a course list by its next session, upcoming first.
 *
 * Applied only when every course in the list is an event: courses keep their
 * weekday-based identity and a mixed list has no consistent session ordering, so
 * anything else is returned untouched and keeps the order the query gave it.
 */
export const sortEventCoursesByUpcoming = <
  T extends { Program?: { type?: string | null } | null; Sessions?: ScheduleSession[] | null }
>(
  courses: T[],
  now: Date = new Date()
): T[] => {
  if (courses.length === 0 || !courses.every((course) => course.Program?.type === 'EVENTS')) {
    return courses;
  }
  return [...courses].sort((a, b) => compareByUpcoming(a, b, now));
};
