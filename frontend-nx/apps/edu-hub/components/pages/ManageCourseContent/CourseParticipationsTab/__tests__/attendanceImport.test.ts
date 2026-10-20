import { AttendanceStatus_enum } from '../../../../../__generated__/globalTypes';
import { groupSessionsIntoAttendanceDays } from '../../../../../helpers/attendanceDays';
import { ParsedAttendanceCsv } from '../../ParticipantExport/participantExport';
import { planAttendanceImport } from '../attendanceImport';

const { ATTENDED, MISSED } = AttendanceStatus_enum;

const days = groupSessionsIntoAttendanceDays(
  [
    { id: 1, startDateTime: '2026-10-14T08:00:00Z', isMandatory: true },
    { id: 2, startDateTime: '2026-10-14T13:00:00Z', isMandatory: true },
    { id: 3, startDateTime: '2026-10-15T08:00:00Z', isMandatory: true },
    { id: 4, startDateTime: '2026-10-20T08:00:00Z', isMandatory: true },
  ],
  'Europe/Berlin'
);
const now = new Date('2026-10-16T12:00:00Z');

const attendance = (id: number, sessionId: number, status: AttendanceStatus_enum, source = 'ZOOM') => ({
  id,
  status,
  source,
  Session: { id: sessionId },
});

const participants = [
  { userId: 'ada', email: 'Ada@Example.com', Attendances: [attendance(1, 1, ATTENDED), attendance(2, 2, ATTENDED)] },
  { userId: 'grace', email: 'grace@example.com', Attendances: [] },
];

const parsed = (rows: ParsedAttendanceCsv['rows'], headers = ['14.10.2026', '15.10.2026', '20.10.2026', '01.01.2026']) => ({
  hasEmailColumn: true,
  dayColumns: headers.map((header) => ({
    header: `Anwesend ${header}`,
    dayKey: header.split('.').reverse().join('-'),
  })),
  rows,
  invalidCells: [],
});

describe('planAttendanceImport', () => {
  it('writes every session of a day and skips what is already recorded', () => {
    const plan = planAttendanceImport({
      parsed: parsed([
        { line: 2, email: 'ada@example.com', statusByDay: { '2026-10-14': ATTENDED, '2026-10-15': MISSED } },
        { line: 3, email: 'grace@example.com', statusByDay: { '2026-10-14': MISSED, '2026-10-15': ATTENDED } },
      ]),
      days,
      participants,
      now,
    });

    expect(plan.changes).toEqual([
      { userId: 'ada', sessionId: 3, status: MISSED },
      { userId: 'grace', sessionId: 1, status: MISSED },
      { userId: 'grace', sessionId: 2, status: MISSED },
      { userId: 'grace', sessionId: 3, status: ATTENDED },
    ]);
    expect(plan).toMatchObject({ matchedCount: 2, attendedDays: 1, missedDays: 2 });
    expect(plan.importedDayKeys).toEqual(['2026-10-14', '2026-10-15']);
  });

  it('ignores days without a session and days still ahead', () => {
    const plan = planAttendanceImport({
      parsed: parsed([{ line: 2, email: 'grace@example.com', statusByDay: { '2026-10-20': MISSED, '2026-01-01': MISSED } }]),
      days,
      participants,
      now,
    });
    expect(plan.ignoredColumns).toEqual(['Anwesend 20.10.2026', 'Anwesend 01.01.2026']);
    expect(plan.changes).toEqual([]);
  });

  it('aligns a day whose sessions disagree', () => {
    const plan = planAttendanceImport({
      parsed: parsed([{ line: 2, email: 'x@example.com', statusByDay: {} }, { line: 3, email: 'ada@example.com', statusByDay: { '2026-10-14': MISSED } }]),
      days,
      participants: [{ ...participants[0], Attendances: [attendance(1, 1, ATTENDED), attendance(2, 2, MISSED)] }],
      now,
    });
    expect(plan.changes).toEqual([{ userId: 'ada', sessionId: 1, status: MISSED }]);
    expect(plan.unknownEmails).toEqual(['x@example.com']);
  });
});
