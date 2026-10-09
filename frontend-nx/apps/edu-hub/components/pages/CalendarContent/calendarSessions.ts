import { Session_bool_exp } from '../../../__generated__/globalTypes';
import { CalendarSessions_Session } from '../../../queries/__generated__/CalendarSessions';

export const ALL_PROGRAMS = 'all';

export type SessionKind = 'COURSES' | 'EVENTS';

export interface CalendarRange {
  start: Date;
  end: Date;
}

interface CalendarProgram {
  id: number;
  title: string;
  shortTitle?: string | null;
  lectureStart?: string | null;
  lectureEnd?: string | null;
}

// The programs whose sessions the calendar shows. `null` means unscoped (a super-admin looking at
// every program), an empty list means nothing is visible.
export const scopedProgramIds = (selection: string, programs: CalendarProgram[], isAdmin: boolean): number[] | null => {
  if (selection !== ALL_PROGRAMS) return [Number(selection)];
  return isAdmin ? null : programs.map((program) => program.id);
};

// The session filter for the calendar: the selected program scope (course sessions via their
// course, program sessions via their own programId) and, when given, the visible date range.
// Loading by range is what keeps the visible month populated: a global "first N sessions" query
// only ever returned the oldest sessions and left the current months empty.
export const buildSessionWhere = (programIds: number[] | null, range: CalendarRange | null): Session_bool_exp => {
  const conditions: Session_bool_exp[] = [];
  if (programIds) {
    conditions.push({
      _or: [{ programId: { _in: programIds } }, { Course: { programId: { _in: programIds } } }],
    });
  }
  if (range) {
    conditions.push({
      startDateTime: { _lt: range.end.toISOString() },
      endDateTime: { _gt: range.start.toISOString() },
    });
  }
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
};

export const sessionProgram = (session: CalendarSessions_Session) => session.Course?.Program ?? session.Program ?? null;

// Classified by Program.type (shortTitle is a free-text label); degree programs count as courses.
export const sessionKind = (session: CalendarSessions_Session): SessionKind =>
  sessionProgram(session)?.type === 'EVENTS' ? 'EVENTS' : 'COURSES';

// The session's own address decides; an address without a course location (a free-text or saved
// address) falls back to the course's location so the session still gets its location colour.
export const resolveLocation = (session: CalendarSessions_Session): string | undefined =>
  session.SessionAddresses[0]?.CourseLocation?.locationOption ??
  session.Course?.CourseLocations[0]?.locationOption ??
  undefined;

export const resolveAddress = (session: CalendarSessions_Session): string | undefined => {
  const addr = session.SessionAddresses[0];
  if (!addr) return undefined;
  const direct = addr.address?.trim();
  if (direct) return direct;
  const fromLocation = addr.LocationAddress?.address?.trim() || addr.LocationAddress?.shortLabel?.trim();
  if (fromLocation) return fromLocation;
  return addr.CourseLocation?.defaultSessionAddress?.trim() || undefined;
};

export interface SessionFilters {
  kinds: SessionKind[];
  locations: string[];
  courseIds: number[];
}

// Client-side filters on the loaded sessions. An empty location or course selection means "all";
// kinds are always explicit.
export const filterSessions = (
  sessions: CalendarSessions_Session[],
  { kinds, locations, courseIds }: SessionFilters
): CalendarSessions_Session[] =>
  sessions.filter((session) => {
    if (!kinds.includes(sessionKind(session))) return false;
    if (locations.length > 0) {
      const location = resolveLocation(session);
      if (!location || !locations.includes(location)) return false;
    }
    if (courseIds.length > 0 && !(session.courseId && courseIds.includes(session.courseId))) return false;
    return true;
  });

export const coursesOfSessions = (sessions: CalendarSessions_Session[]): { id: number; title: string }[] => {
  const courses = new Map<number, string>();
  sessions.forEach((session) => {
    if (session.Course) courses.set(session.Course.id, session.Course.title);
  });
  return Array.from(courses, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
};

// Whether `date` lies outside the program's lecture period, i.e. whether selecting the program
// should move the calendar to the period's start so the admin does not land on an empty month.
export const isOutsideLecturePeriod = (program: CalendarProgram, date: Date): boolean => {
  if (!program.lectureStart) return false;
  const start = new Date(program.lectureStart);
  if (date < start) return true;
  if (!program.lectureEnd) return false;
  // lectureEnd is a date: the period runs through the whole of that day.
  const end = new Date(program.lectureEnd);
  end.setDate(end.getDate() + 1);
  return date >= end;
};
