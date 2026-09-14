import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  applyAttendanceOverrides,
  attendanceOverrideKey,
  collapseAttendancesBySession,
  getAttendanceStatusFromMap,
  getNextAttendanceStatus,
} from './courseParticipationAttendance';

type AttendanceRow = {
  __typename: 'Attendance';
  id: number;
  status: AttendanceStatus_enum;
  source: string;
  Session: { __typename: 'Session'; id: number };
};

const attendance = (
  id: number,
  sessionId: number,
  status: AttendanceStatus_enum,
  source: string
): AttendanceRow => ({
  __typename: 'Attendance',
  id,
  status,
  source,
  Session: { __typename: 'Session', id: sessionId },
});

describe('course participation attendance', () => {
  const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('prefers the latest instructor row over automated rows', () => {
    const result = collapseAttendancesBySession([
      attendance(10, 1, AttendanceStatus_enum.ATTENDED, 'ZOOM'),
      attendance(4, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'),
      attendance(7, 1, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'),
    ]);

    expect(result[1]?.id).toBe(7);
    expect(result[1]?.status).toBe(AttendanceStatus_enum.MISSED);
  });

  it('toggles attended and treats every other state as attended next', () => {
    expect(getNextAttendanceStatus(AttendanceStatus_enum.ATTENDED)).toBe(
      AttendanceStatus_enum.MISSED
    );
    expect(getNextAttendanceStatus(AttendanceStatus_enum.MISSED)).toBe(
      AttendanceStatus_enum.ATTENDED
    );
    expect(getNextAttendanceStatus(AttendanceStatus_enum.NO_INFO)).toBe(
      AttendanceStatus_enum.ATTENDED
    );
    expect(getNextAttendanceStatus(undefined)).toBe(AttendanceStatus_enum.ATTENDED);
  });

  it('uses an optimistic instructor row as the effective attendance', () => {
    const enrollments = [
      {
        userId: 'user-1',
        User: {
          Attendances: [attendance(42, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR')],
        },
      },
    ];
    const overrides = {
      [attendanceOverrideKey('user-1', 1)]: AttendanceStatus_enum.MISSED,
    };

    const result = applyAttendanceOverrides(enrollments, overrides, sessions);
    const effective = collapseAttendancesBySession(result[0].User.Attendances);

    expect(effective[1]?.status).toBe(AttendanceStatus_enum.MISSED);
    expect(effective[1]?.source).toBe('INSTRUCTOR');
  });

  it('calculates the overall attendance state from the effective rows', () => {
    const bySession = collapseAttendancesBySession([
      attendance(1, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'),
      attendance(2, 2, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'),
    ]);

    expect(getAttendanceStatusFromMap(bySession, sessions, 0)).toBe('failed');
    expect(getAttendanceStatusFromMap(bySession, sessions, 1)).toBe('uncertain');
    expect(getAttendanceStatusFromMap(bySession, sessions, 2)).toBe('passed');
  });
});
