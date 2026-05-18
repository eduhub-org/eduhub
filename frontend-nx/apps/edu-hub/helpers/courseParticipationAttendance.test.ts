import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  applyAttendanceOverlay,
  attendanceOverlayKey,
  collapseAttendancesBySession,
  getAttendanceStatusFromMap,
  getDotColorForAttendance,
  getNextAttendanceStatus,
} from './courseParticipationAttendance';

type Row = { id: number; status: string; source: string | null; Session: { id: number } };

const row = (id: number, sessionId: number, status: string, source: string | null): Row => ({
  id,
  status,
  source,
  Session: { id: sessionId },
});

describe('courseParticipationAttendance', () => {
  const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('attendanceOverlayKey is stable', () => {
    expect(attendanceOverlayKey('user-1', 42)).toBe('user-1:42');
  });

  it('getNextAttendanceStatus toggles between attended and missed', () => {
    expect(getNextAttendanceStatus(undefined)).toBe(AttendanceStatus_enum.ATTENDED);
    expect(getNextAttendanceStatus(row(1, 1, 'MISSED', 'INSTRUCTOR'))).toBe(
      AttendanceStatus_enum.ATTENDED
    );
    expect(getNextAttendanceStatus(row(1, 1, 'ATTENDED', 'INSTRUCTOR'))).toBe(
      AttendanceStatus_enum.MISSED
    );
  });

  it('getDotColorForAttendance maps status to dot colors', () => {
    expect(getDotColorForAttendance(undefined)).toBe('grey');
    expect(getDotColorForAttendance(row(1, 1, 'ATTENDED', 'INSTRUCTOR'))).toBe('lightgreen');
    expect(getDotColorForAttendance(row(1, 1, 'MISSED', 'INSTRUCTOR'))).toBe('red');
  });

  it('getAttendanceStatusFromMap respects maxMissedSessions', () => {
    const bySession = {
      1: row(1, 1, 'ATTENDED', 'INSTRUCTOR'),
      2: row(2, 2, 'MISSED', 'INSTRUCTOR'),
      3: row(3, 3, 'MISSED', 'INSTRUCTOR'),
    };
    expect(getAttendanceStatusFromMap(bySession, sessions, 1)).toBe('failed');
    expect(getAttendanceStatusFromMap(bySession, sessions, 2)).toBe('passed');
  });

  it('applyAttendanceOverlay adds synthetic instructor rows', () => {
    const enrollments = [
      {
        userId: 'u1',
        User: {
          Attendances: [row(5, 1, 'ATTENDED', 'ZOOM')],
        },
      },
    ];
    const overlay = { [attendanceOverlayKey('u1', 1)]: AttendanceStatus_enum.MISSED };
    const result = applyAttendanceOverlay(enrollments, overlay, sessions);
    const effective = collapseAttendancesBySession(result[0].User.Attendances);
    expect(effective[1]?.status).toBe(AttendanceStatus_enum.MISSED);
    expect(effective[1]?.source).toBe('INSTRUCTOR');
  });

  it('collapseAttendancesBySession prefers instructor over zoom', () => {
    const attendances = [
      row(1, 1, 'ATTENDED', 'ZOOM'),
      row(2, 1, 'MISSED', 'INSTRUCTOR'),
    ];
    const effective = collapseAttendancesBySession(attendances);
    expect(effective[1]?.status).toBe('MISSED');
  });
});
