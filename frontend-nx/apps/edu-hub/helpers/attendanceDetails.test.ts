import { AttendanceStatus_enum } from '../__generated__/globalTypes';
import {
  MANUAL_ATTENDANCE_LOCATION,
  assignRecordsToParticipants,
  attendanceLocationOption,
  attendanceShare,
  parseClosestCandidates,
  summarizeSessionAttendances,
} from './attendanceDetails';

const { ATTENDED, MISSED } = AttendanceStatus_enum;

describe('attendanceLocationOption', () => {
  it('maps Zoom to ONLINE and check-in places to their location', () => {
    expect(attendanceLocationOption('ZOOM', 'ZOOM')).toBe('ONLINE');
    expect(attendanceLocationOption('LIMESURVEY', 'SK')).toBe('KIEL');
    expect(attendanceLocationOption('LIMESURVEY', ' H04 ')).toBe('HEIDE');
    expect(attendanceLocationOption('LIMESURVEY', 'Somewhere')).toBe('Somewhere');
    expect(attendanceLocationOption('LIMESURVEY', null)).toBeNull();
  });
});

describe('summarizeSessionAttendances', () => {
  it('counts effective Attendances with Manual Attendances taking precedence', () => {
    const summary = summarizeSessionAttendances([
      { id: 1, userId: 'a', status: ATTENDED, source: 'ZOOM', location: 'ZOOM' },
      { id: 2, userId: 'b', status: ATTENDED, source: 'LIMESURVEY', location: 'SK' },
      { id: 3, userId: 'c', status: MISSED, source: 'ZOOM', location: null },
      { id: 4, userId: 'c', status: ATTENDED, source: 'INSTRUCTOR', location: null },
      { id: 5, userId: 'd', status: ATTENDED, source: 'ZOOM', location: 'ZOOM' },
      { id: 6, userId: 'd', status: MISSED, source: 'INSTRUCTOR', location: null },
    ]);

    expect(summary).toEqual({
      total: 4,
      attended: 3,
      byLocation: { ONLINE: 1, KIEL: 1, [MANUAL_ATTENDANCE_LOCATION]: 1 },
    });
  });
});

describe('assignRecordsToParticipants', () => {
  const user = (firstName: string, lastName: string) => ({ firstName, lastName });

  it('uses the stored record index of automatic Attendances', () => {
    const result = assignRecordsToParticipants(
      [{ _idx: '0', name: 'Christine' }, { _idx: '1', name: 'Mahmoud' }],
      [
        { source: 'ZOOM', attendanceRecordIndex: 0, recordedIdentifier: 'Christine', matchType: 'PARTIAL_NAME', User: user('Christine', 'Avery') },
        { source: 'INSTRUCTOR', attendanceRecordIndex: null, recordedIdentifier: null, matchType: null, User: user('Rawand', 'Mahmood') },
      ]
    );
    expect(result).toEqual({ '0': 'Christine Avery' });
  });

  it('falls back to the recorded identifier for sessions checked before record indexes existed', () => {
    const result = assignRecordsToParticipants(
      [{ _idx: '0', name: 'Work Laptop', email: 'jane@example.com' }, { _idx: '1', name: 'Bob Builder' }],
      [
        { source: 'ZOOM', attendanceRecordIndex: null, recordedIdentifier: 'jane@example.com', matchType: 'EMAIL', User: user('Jane', 'Doe') },
        { source: 'ZOOM', attendanceRecordIndex: null, recordedIdentifier: 'Bob Builder', matchType: 'NONE', User: user('Bob', 'Smith') },
      ]
    );
    expect(result).toEqual({ '0': 'Jane Doe' });
  });
});

describe('attendanceShare and parseClosestCandidates', () => {
  it('relates the online time to the session duration', () => {
    expect(attendanceShare(3150, '2026-11-03T15:00:00Z', '2026-11-03T16:45:00Z')).toBeCloseTo(0.5);
    expect(attendanceShare(null, '2026-11-03T15:00:00Z', '2026-11-03T16:45:00Z')).toBeNull();
  });

  it('ignores malformed candidate entries', () => {
    expect(
      parseClosestCandidates([{ location: 'ONLINE', identifier: 'Christine', score: 75 }, { identifier: 3 }, null])
    ).toEqual([{ location: 'ONLINE', identifier: 'Christine', score: 75 }]);
    expect(parseClosestCandidates('nope')).toEqual([]);
  });
});
