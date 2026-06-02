import { ATTENDANCE_SOURCE_INSTRUCTOR, pickEffectiveAttendance } from './attendance';
import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import { DotColor } from '../components/common/Dot';
import {
  CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances,
  CourseParticipations_Course_by_pk_Sessions,
} from '../queries/__generated__/CourseParticipations';

export type AttendanceLike = Pick<
  CourseParticipations_Course_by_pk_CourseEnrollments_User_Attendances,
  'id' | 'status' | 'source' | 'Session'
>;

export type AttendanceOverallStatus = 'passed' | 'failed' | 'uncertain';

export function attendanceOverlayKey(userId: string, sessionId: number): string {
  return `${userId}:${sessionId}`;
}

export function collapseAttendancesBySession(
  attendances: readonly AttendanceLike[]
): Record<number, AttendanceLike> {
  const bySession = attendances.reduce<Record<number, AttendanceLike[]>>((prev, curr) => {
    const bucket = prev[curr.Session.id] ?? [];
    bucket.push(curr);
    prev[curr.Session.id] = bucket;
    return prev;
  }, {});

  const result: Record<number, AttendanceLike> = {};
  for (const [sessionId, rows] of Object.entries(bySession)) {
    const effective = pickEffectiveAttendance(rows, (a) => a.id);
    if (effective !== undefined) {
      result[Number(sessionId)] = effective;
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
    const att = attendanceBySession[session.id];
    if (!att) {
      unchecked += 1;
    } else if (att.status === AttendanceStatus_enum.MISSED) {
      missed += 1;
    } else if (att.status === AttendanceStatus_enum.NO_INFO) {
      unchecked += 1;
    }
  }

  if (missed > maxMissedSessions) return 'failed';
  if (missed + unchecked <= maxMissedSessions) return 'passed';
  return 'uncertain';
}

export function getDotColorForAttendance(att: AttendanceLike | undefined): DotColor {
  if (!att) return 'grey';
  if (att.status === AttendanceStatus_enum.MISSED) return 'red';
  if (att.status === AttendanceStatus_enum.ATTENDED) return 'lightgreen';
  return 'grey';
}

export function getNextAttendanceStatus(att: AttendanceLike | undefined): AttendanceStatus_enum {
  if (
    !att ||
    att.status === AttendanceStatus_enum.MISSED ||
    att.status === AttendanceStatus_enum.NO_INFO
  ) {
    return AttendanceStatus_enum.ATTENDED;
  }
  return AttendanceStatus_enum.MISSED;
}

/**
 * Merges instructor overlay statuses into enrollments as synthetic INSTRUCTOR rows
 * so pickEffectiveAttendance continues to prefer them over automated sources.
 */
export function applyAttendanceOverlay<T extends { userId: string; User: { Attendances: AttendanceLike[] } }>(
  enrollments: readonly T[],
  overlay: Readonly<Record<string, AttendanceStatus_enum>>,
  sessions: readonly Pick<CourseParticipations_Course_by_pk_Sessions, 'id'>[]
): T[] {
  if (Object.keys(overlay).length === 0) {
    return [...enrollments];
  }

  return enrollments.map((enrollment) => {
    const additions: AttendanceLike[] = [];
    // Use ids above any real DB id so synthetic rows beat existing INSTRUCTOR
    // rows in pickEffectiveAttendance's largest-id tie-break.
    let tempId = Number.MAX_SAFE_INTEGER;

    for (const session of sessions) {
      const key = attendanceOverlayKey(enrollment.userId, session.id);
      const status = overlay[key];
      if (status === undefined) continue;

      additions.push({
        id: tempId,
        status,
        source: ATTENDANCE_SOURCE_INSTRUCTOR,
        Session: { __typename: 'Session', id: session.id },
      });
      tempId -= 1;
    }

    if (additions.length === 0) {
      return enrollment;
    }

    return {
      ...enrollment,
      User: {
        ...enrollment.User,
        Attendances: [...enrollment.User.Attendances, ...additions],
      },
    };
  });
}
