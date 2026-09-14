import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances,
  CourseParticipations_Course_by_pk_Sessions,
} from '../queries/__generated__/CourseParticipations';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from './attendance';

export type AttendanceLike = Pick<
  CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances,
  'id' | 'status' | 'source' | 'Session'
>;

export type AttendanceOverallStatus = 'passed' | 'failed' | 'uncertain';

export function attendanceOverrideKey(userId: string, sessionId: number): string {
  return `${userId}:${sessionId}`;
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

export function getAttendanceStatusFromMap(
  attendanceBySession: Record<number, AttendanceLike>,
  sessions: readonly Pick<CourseParticipations_Course_by_pk_Sessions, 'id'>[],
  maxMissedSessions: number
): AttendanceOverallStatus {
  let missed = 0;
  let unchecked = 0;

  for (const session of sessions) {
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
  overrides: Readonly<Record<string, AttendanceStatus_enum>>,
  sessions: readonly Pick<CourseParticipations_Course_by_pk_Sessions, 'id'>[]
): readonly T[] {
  if (Object.keys(overrides).length === 0) return enrollments;

  return enrollments.map((enrollment) => {
    const optimisticAttendances: AttendanceLike[] = [];

    for (const session of sessions) {
      const status = overrides[attendanceOverrideKey(enrollment.userId, session.id)];
      if (status === undefined) continue;

      optimisticAttendances.push({
        id: Number.MAX_SAFE_INTEGER,
        status,
        source: ATTENDANCE_SOURCE_INSTRUCTOR,
        Session: { __typename: 'Session', id: session.id },
      });
    }

    if (optimisticAttendances.length === 0) return enrollment;

    return {
      ...enrollment,
      User: {
        ...enrollment.User,
        Attendances: [...enrollment.User.Attendances, ...optimisticAttendances],
      },
    };
  });
}
