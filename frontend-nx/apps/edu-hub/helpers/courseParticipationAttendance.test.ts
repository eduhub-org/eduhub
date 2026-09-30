import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  applyAttendanceOverrides,
  attendanceOverrideKey,
  collapseAttendancesBySession,
  countMandatorySessions,
  getAttendanceStatusFromMap,
  getNextAttendanceStatus,
  groupAttendancesByUser,
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

  it('groups separately loaded attendance rows by participant', () => {
    const result = groupAttendancesByUser([
      {
        id: 1,
        userId: 'user-1',
        sessionId: 10,
        status: AttendanceStatus_enum.ATTENDED,
        source: 'ZOOM',
      },
      {
        id: 2,
        userId: 'user-2',
        sessionId: 11,
        status: AttendanceStatus_enum.MISSED,
        source: 'INSTRUCTOR',
      },
      {
        id: 3,
        userId: null,
        sessionId: 12,
        status: AttendanceStatus_enum.NO_INFO,
        source: 'ZOOM',
      },
    ]);

    expect(result['user-1']).toEqual([
      expect.objectContaining({ id: 1, Session: { id: 10 } }),
    ]);
    expect(result['user-2']).toEqual([
      expect.objectContaining({ id: 2, Session: { id: 11 } }),
    ]);
    expect(Object.keys(result)).toHaveLength(2);
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

  it('ignores optional sessions when calculating the overall state', () => {
    const optionalSessions = [
      { id: 1 },
      { id: 2, isMandatory: false },
      { id: 3, isMandatory: false },
    ];
    const bySession = collapseAttendancesBySession([
      attendance(1, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'),
      attendance(2, 2, AttendanceStatus_enum.MISSED, 'ZOOM'),
    ]);

    // Session 2 was missed and session 3 is unchecked, but both are optional.
    expect(getAttendanceStatusFromMap(bySession, optionalSessions, 0)).toBe('passed');
    expect(countMandatorySessions(optionalSessions)).toBe(1);
  });

  it('treats sessions without an explicit flag as mandatory', () => {
    const unflagged = [{ id: 1 }, { id: 2, isMandatory: null }];
    expect(countMandatorySessions(unflagged)).toBe(2);
  });
});
