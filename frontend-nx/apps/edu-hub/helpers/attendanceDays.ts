/**
 * Attendance is collected per calendar day: all sessions starting on the same
 * day (in the app's timezone) share one dot, one CSV column and one entry
 * toward `maxMissedSessions`. Storage stays per session, so a day is a view
 * over its sessions and writing a day writes every one of them.
 *
 * Keep the day rule in sync with the `CourseEnrollmentAttendanceStats` view
 * and `check_course_continuation.py`.
 */

import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import type { AttendanceOverallStatus } from './courseParticipationAttendance';
import { isMandatorySession } from './courseParticipationAttendance';
import { groupSessionsByDay } from './sessionSchedule';

interface DaySession {
  id: number;
  startDateTime: Date | string;
  isMandatory?: boolean | null;
}

export interface AttendanceDay<S extends DaySession = DaySession> {
  /** "yyyy-MM-dd" in the app's timezone. */
  dayKey: string;
  dayStart: Date;
  /** Ascending by start time. */
  sessions: S[];
  /** A day counts toward passing as soon as one of its sessions does. */
  mandatory: boolean;
}

export function groupSessionsIntoAttendanceDays<S extends DaySession>(
  sessions: readonly S[],
  timeZone: string
): AttendanceDay<S>[] {
  return groupSessionsByDay([...sessions], timeZone).map((day) => ({
    ...day,
    mandatory: day.sessions.some(isMandatorySession),
  }));
}

/**
 * Attended if any counted session was attended (Zoom may only see someone in
 * one of the day's sessions), else missed if any was missed, else no info.
 * Counted are the mandatory sessions of a mandatory day, all sessions otherwise.
 */
export function getDayStatus(
  day: AttendanceDay,
  attendanceBySession: Readonly<Record<number, { status: AttendanceStatus_enum } | undefined>>
): AttendanceStatus_enum {
  const counted = day.mandatory ? day.sessions.filter(isMandatorySession) : day.sessions;
  const statuses = counted.map((session) => attendanceBySession[session.id]?.status);
  if (statuses.includes(AttendanceStatus_enum.ATTENDED)) return AttendanceStatus_enum.ATTENDED;
  if (statuses.includes(AttendanceStatus_enum.MISSED)) return AttendanceStatus_enum.MISSED;
  return AttendanceStatus_enum.NO_INFO;
}

/** Like the per-session rule, but every mandatory day counts once. */
export function getAttendanceStatusFromDays(
  days: readonly AttendanceDay[],
  attendanceBySession: Readonly<Record<number, { status: AttendanceStatus_enum } | undefined>>,
  maxMissedDays: number
): AttendanceOverallStatus {
  let missed = 0;
  let unchecked = 0;

  for (const day of days) {
    if (!day.mandatory) continue;
    const status = getDayStatus(day, attendanceBySession);
    if (status === AttendanceStatus_enum.MISSED) missed += 1;
    else if (status === AttendanceStatus_enum.NO_INFO) unchecked += 1;
  }

  if (missed > maxMissedDays) return 'failed';
  if (missed + unchecked <= maxMissedDays) return 'passed';
  return 'uncertain';
}
