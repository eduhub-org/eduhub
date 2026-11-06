import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import type {
  CourseParticipations_Course_by_pk_CourseEnrollments,
  CourseParticipations_Course_by_pk_Sessions,
} from '../queries/__generated__/CourseParticipations';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from './attendance';

/** What the automatic check recorded for an Attendance (shown in the dot hover). */
export interface AttendanceDetails {
  startDateTime?: string | null;
  endDateTime?: string | null;
  totalAttendanceTime?: number | null;
  interruptionCount?: number | null;
  location?: string | null;
  recordedIdentifier?: string | null;
  matchType?: string | null;
  matchScore?: number | null;
  closestCandidates?: unknown;
}

export interface AttendanceLike extends AttendanceDetails {
  id: number;
  status: AttendanceStatus_enum;
  source: string;
  Session: { __typename?: 'Session'; id: number };
}

export interface AttendanceRowLike extends AttendanceDetails {
  id: number;
  userId: string | null;
  sessionId: number;
  status: AttendanceStatus_enum;
  source: string;
}

/** Override value that removes the Manual Attendance of a session. */
export const REVERT_TO_AUTOMATIC = 'REVERT_TO_AUTOMATIC' as const;
export type AttendanceOverride = AttendanceStatus_enum | typeof REVERT_TO_AUTOMATIC;

export type CourseEnrollmentWithAttendances = Omit<
  CourseParticipations_Course_by_pk_CourseEnrollments,
  'User'
> & {
  User: CourseParticipations_Course_by_pk_CourseEnrollments['User'] & {
    Attendances: AttendanceLike[];
  };
};

export type AttendanceOverallStatus = 'passed' | 'failed' | 'uncertain';

export function attendanceOverrideKey(userId: string, sessionId: number): string {
  return `${userId}:${sessionId}`;
}

export function groupAttendancesByUser(
  attendances: readonly AttendanceRowLike[]
): Record<string, AttendanceLike[]> {
  const result: Record<string, AttendanceLike[]> = {};

  for (const attendance of attendances) {
    if (!attendance.userId) continue;

    const userAttendances = result[attendance.userId] ?? [];
    const { sessionId, ...rest } = attendance;
    userAttendances.push({
      ...rest,
      Session: { id: sessionId },
    });
    result[attendance.userId] = userAttendances;
  }

  return result;
}

export function collapseAttendancesBySession(
  attendances: readonly AttendanceLike[]
): Record<number, AttendanceLike> {
  const result: Record<number, AttendanceLike> = {};

  for (const attendance of attendances) {
    const sessionId = attendance.Session.id;
    const current = result[sessionId];
    const attendanceIsInstructor = attendance.source === ATTENDANCE_SOURCE_INSTRUCTOR;
    const currentIsInstructor = current?.source === ATTENDANCE_SOURCE_INSTRUCTOR;

    if (
      !current ||
      (attendanceIsInstructor && !currentIsInstructor) ||
      (attendanceIsInstructor === currentIsInstructor && attendance.id > current.id)
    ) {
      result[sessionId] = attendance;
    }
  }

  return result;
}

export interface SessionAttendances {
  /** Latest Manual Attendance (source INSTRUCTOR); it always takes precedence. */
  manual?: AttendanceLike;
  /** Latest automatic Attendance, kept underneath a Manual Attendance. */
  automatic?: AttendanceLike;
}

export function splitAttendancesBySession(
  attendances: readonly AttendanceLike[]
): Record<number, SessionAttendances> {
  const result: Record<number, SessionAttendances> = {};

  for (const attendance of attendances) {
    const entry = (result[attendance.Session.id] ??= {});
    const kind = attendance.source === ATTENDANCE_SOURCE_INSTRUCTOR ? 'manual' : 'automatic';
    const current = entry[kind];
    if (!current || attendance.id > current.id) entry[kind] = attendance;
  }

  return result;
}

const isDecided = (status: AttendanceStatus_enum | undefined): boolean =>
  status === AttendanceStatus_enum.ATTENDED || status === AttendanceStatus_enum.MISSED;

/**
 * What a click on an attendance dot does: flip the shown status, and when the
 * flip lands on the automatic result, remove the Manual Attendance instead of
 * adding another one. Without an automatic result: unknown → attended →
 * missed → unknown.
 */
export function getNextAttendanceOverride(
  manualStatus: AttendanceStatus_enum | undefined,
  automaticStatus: AttendanceStatus_enum | undefined
): AttendanceOverride {
  const automatic = isDecided(automaticStatus) ? automaticStatus : undefined;
  if (manualStatus === undefined) {
    return automatic === AttendanceStatus_enum.ATTENDED
      ? AttendanceStatus_enum.MISSED
      : AttendanceStatus_enum.ATTENDED;
  }
  if (automatic === undefined) {
    return manualStatus === AttendanceStatus_enum.ATTENDED ? AttendanceStatus_enum.MISSED : REVERT_TO_AUTOMATIC;
  }
  const flipped =
    manualStatus === AttendanceStatus_enum.ATTENDED ? AttendanceStatus_enum.MISSED : AttendanceStatus_enum.ATTENDED;
  return flipped === automatic ? REVERT_TO_AUTOMATIC : flipped;
}

/** Sessions are mandatory unless explicitly marked otherwise. */
export function isMandatorySession(session: { isMandatory?: boolean | null }): boolean {
  return session.isMandatory !== false;
}

export function countMandatorySessions(
  sessions: readonly { isMandatory?: boolean | null }[]
): number {
  return sessions.filter(isMandatorySession).length;
}

/** Optional sessions are tracked but never count toward passing. */
export function getAttendanceStatusFromMap(
  attendanceBySession: Record<number, AttendanceLike>,
  sessions: readonly (Pick<CourseParticipations_Course_by_pk_Sessions, 'id'> & {
    isMandatory?: boolean | null;
  })[],
  maxMissedSessions: number
): AttendanceOverallStatus {
  let missed = 0;
  let unchecked = 0;

  for (const session of sessions) {
    if (!isMandatorySession(session)) continue;
    const attendance = attendanceBySession[session.id];
    if (!attendance || attendance.status === AttendanceStatus_enum.NO_INFO) {
      unchecked += 1;
    } else if (attendance.status === AttendanceStatus_enum.MISSED) {
      missed += 1;
    }
  }

  if (missed > maxMissedSessions) return 'failed';
  if (missed + unchecked <= maxMissedSessions) return 'passed';
  return 'uncertain';
}

export function getNextAttendanceStatus(
  currentStatus: AttendanceStatus_enum | undefined
): AttendanceStatus_enum {
  return currentStatus === AttendanceStatus_enum.ATTENDED
    ? AttendanceStatus_enum.MISSED
    : AttendanceStatus_enum.ATTENDED;
}

/**
 * Add local instructor rows so the existing precedence logic renders a click
 * immediately while the insert and background synchronization are in flight.
 */
export function applyAttendanceOverrides<
  T extends { userId: string; User: { Attendances: AttendanceLike[] } },
>(
  enrollments: readonly T[],
  overrides: Readonly<Record<string, AttendanceOverride>>,
  sessions: readonly Pick<CourseParticipations_Course_by_pk_Sessions, 'id'>[]
): readonly T[] {
  if (Object.keys(overrides).length === 0) return enrollments;

  return enrollments.map((enrollment) => {
    const optimisticAttendances: AttendanceLike[] = [];
    const revertedSessionIds = new Set<number>();

    for (const session of sessions) {
      const override = overrides[attendanceOverrideKey(enrollment.userId, session.id)];
      if (override === undefined) continue;

      // A newer click replaces any earlier Manual Attendance of the session.
      revertedSessionIds.add(session.id);
      if (override === REVERT_TO_AUTOMATIC) continue;

      optimisticAttendances.push({
        id: Number.MAX_SAFE_INTEGER,
        status: override,
        source: ATTENDANCE_SOURCE_INSTRUCTOR,
        Session: { __typename: 'Session', id: session.id },
      });
    }

    if (revertedSessionIds.size === 0) return enrollment;

    const kept = enrollment.User.Attendances.filter(
      (attendance) =>
        attendance.source !== ATTENDANCE_SOURCE_INSTRUCTOR || !revertedSessionIds.has(attendance.Session.id)
    );

    return {
      ...enrollment,
      User: {
        ...enrollment.User,
        Attendances: [...kept, ...optimisticAttendances],
      },
    };
  });
}
