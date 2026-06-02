import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  applyAttendanceOverlay,
  attendanceOverlayKey,
  collapseAttendancesBySession,
  getAttendanceStatusFromMap,
  getDotColorForAttendance,
  getNextAttendanceStatus,
} from './courseParticipationAttendance';

type Row = {
  __typename: 'Attendance';
  id: number;
  status: AttendanceStatus_enum;
  source: string;
  Session: { __typename: 'Session'; id: number };
};

const row = (id: number, sessionId: number, status: AttendanceStatus_enum, source: string): Row => ({
  __typename: 'Attendance',
  id,
  status,
  source,
  Session: { __typename: 'Session', id: sessionId },
});

describe('courseParticipationAttendance', () => {
  const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('attendanceOverlayKey is stable', () => {
    expect(attendanceOverlayKey('user-1', 42)).toBe('user-1:42');
  });

  it('getNextAttendanceStatus toggles between attended and missed', () => {
    expect(getNextAttendanceStatus(undefined)).toBe(AttendanceStatus_enum.ATTENDED);
    expect(getNextAttendanceStatus(row(1, 1, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'))).toBe(
      AttendanceStatus_enum.ATTENDED
    );
    expect(getNextAttendanceStatus(row(1, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'))).toBe(
      AttendanceStatus_enum.MISSED
    );
  });

  it('getDotColorForAttendance maps status to dot colors', () => {
    expect(getDotColorForAttendance(undefined)).toBe('grey');
    expect(getDotColorForAttendance(row(1, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'))).toBe(
      'lightgreen'
    );
    expect(getDotColorForAttendance(row(1, 1, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'))).toBe(
      'red'
    );
  });

  it('getAttendanceStatusFromMap respects maxMissedSessions', () => {
    const bySession = {
      1: row(1, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR'),
      2: row(2, 2, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'),
      3: row(3, 3, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'),
    };
    expect(getAttendanceStatusFromMap(bySession, sessions, 1)).toBe('failed');
    expect(getAttendanceStatusFromMap(bySession, sessions, 2)).toBe('passed');
  });

  it('applyAttendanceOverlay adds synthetic instructor rows', () => {
    const enrollments = [
      {
        userId: 'u1',
        User: {
          Attendances: [row(5, 1, AttendanceStatus_enum.ATTENDED, 'ZOOM')],
        },
      },
    ];
    const overlay = { [attendanceOverlayKey('u1', 1)]: AttendanceStatus_enum.MISSED };
    const result = applyAttendanceOverlay(enrollments, overlay, sessions);
    const effective = collapseAttendancesBySession(result[0].User.Attendances);
    expect(effective[1]?.status).toBe(AttendanceStatus_enum.MISSED);
    expect(effective[1]?.source).toBe('INSTRUCTOR');
  });

  it('applyAttendanceOverlay overrides an existing INSTRUCTOR row', () => {
    const enrollments = [
      {
        userId: 'u1',
        User: {
          Attendances: [row(42, 1, AttendanceStatus_enum.ATTENDED, 'INSTRUCTOR')],
        },
      },
    ];
    const overlay = { [attendanceOverlayKey('u1', 1)]: AttendanceStatus_enum.MISSED };
    const result = applyAttendanceOverlay(enrollments, overlay, sessions);
    const effective = collapseAttendancesBySession(result[0].User.Attendances);
    expect(effective[1]?.status).toBe(AttendanceStatus_enum.MISSED);
  });

  it('collapseAttendancesBySession prefers instructor over zoom', () => {
    const attendances = [
      row(1, 1, AttendanceStatus_enum.ATTENDED, 'ZOOM'),
      row(2, 1, AttendanceStatus_enum.MISSED, 'INSTRUCTOR'),
    ];
    const effective = collapseAttendancesBySession(attendances);
    expect(effective[1]?.status).toBe(AttendanceStatus_enum.MISSED);
  });
});
