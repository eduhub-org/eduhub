import { ATTENDANCE_SOURCE_INSTRUCTOR, pickEffectiveAttendance } from './attendance';

type TestRow = { id: number; status: string; source: string | null };

const row = (id: number, status: string, source: string | null): TestRow => ({
  id,
  status,
  source,
});

describe('pickEffectiveAttendance', () => {
  it('returns undefined for an empty list', () => {
    expect(pickEffectiveAttendance<TestRow>([], (a) => a.id)).toBeUndefined();
  });

  it('picks the INSTRUCTOR row over a newer automated row', () => {
    const instructor = row(5, 'MISSED', ATTENDANCE_SOURCE_INSTRUCTOR);
    const zoomLater = row(10, 'ATTENDED', 'ZOOM');
    expect(pickEffectiveAttendance([instructor, zoomLater], (a) => a.id)).toBe(instructor);
  });

  it('picks the INSTRUCTOR row regardless of insertion order', () => {
    const zoomLater = row(10, 'ATTENDED', 'ZOOM');
    const instructor = row(5, 'MISSED', ATTENDANCE_SOURCE_INSTRUCTOR);
    expect(pickEffectiveAttendance([zoomLater, instructor], (a) => a.id)).toBe(instructor);
  });

  it('picks the latest INSTRUCTOR row after repeated toggles', () => {
    const first = row(7, 'ATTENDED', ATTENDANCE_SOURCE_INSTRUCTOR);
    const second = row(12, 'MISSED', ATTENDANCE_SOURCE_INSTRUCTOR);
    const third = row(20, 'ATTENDED', ATTENDANCE_SOURCE_INSTRUCTOR);
    const zoom = row(3, 'ATTENDED', 'ZOOM');
    expect(pickEffectiveAttendance([first, zoom, third, second], (a) => a.id)).toBe(third);
  });

  it('falls back to highest tie-break value when no INSTRUCTOR row exists', () => {
    const zoomOld = row(3, 'MISSED', 'ZOOM');
    const limesurveyNew = row(8, 'ATTENDED', 'LIMESURVEY');
    expect(pickEffectiveAttendance([zoomOld, limesurveyNew], (a) => a.id)).toBe(limesurveyNew);
  });

  it('treats a null source as automated (INSTRUCTOR still wins)', () => {
    const legacyNull = row(3, 'ATTENDED', null);
    const instructor = row(1, 'MISSED', ATTENDANCE_SOURCE_INSTRUCTOR);
    expect(pickEffectiveAttendance([legacyNull, instructor], (a) => a.id)).toBe(instructor);
  });

  it('supports non-id tie-break (e.g. updated_at for participant view)', () => {
    type TsRow = { id: number; updated_at: number; source: string | null };
    const earlier: TsRow = { id: 1, updated_at: 100, source: 'ZOOM' };
    const later: TsRow = { id: 2, updated_at: 200, source: 'ZOOM' };
    const instructorEarly: TsRow = { id: 3, updated_at: 50, source: ATTENDANCE_SOURCE_INSTRUCTOR };
    // The late ZOOM row has the larger updated_at, but INSTRUCTOR still wins.
    expect(
      pickEffectiveAttendance([earlier, later, instructorEarly], (a) => a.updated_at)
    ).toBe(instructorEarly);
  });
});
