import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { CalendarSessions_Session } from '../../../../queries/__generated__/CalendarSessions';
import {
  ALL_PROGRAMS,
  buildSessionWhere,
  coursesOfSessions,
  filterSessions,
  isOutsideLecturePeriod,
  scopedProgramIds,
  SessionKind,
  sessionKind,
} from '../calendarSessions';

const session = (
  id: number,
  {
    course,
    programType = 'COURSES',
    location,
  }: { course?: { id: number; title: string }; programType?: string; location?: LocationOption_enum } = {}
): CalendarSessions_Session => {
  const program = { __typename: 'Program' as const, id: 1, type: programType, title: 'P', shortTitle: null };
  return {
    __typename: 'Session',
    id,
    startDateTime: '2026-10-09T10:00:00Z',
    endDateTime: '2026-10-09T12:00:00Z',
    title: `Session ${id}`,
    description: '',
    courseId: course?.id ?? null,
    programId: course ? null : 1,
    Program: course ? null : program,
    Course: course
      ? {
          __typename: 'Course',
          ...course,
          CourseLocations: location
            ? [{ __typename: 'CourseLocation', id: 1, locationOption: location, defaultSessionAddress: null }]
            : [],
          Program: program,
        }
      : null,
    SessionAddresses: [],
    SessionSpeakers: [],
  };
};

describe('scopedProgramIds', () => {
  const programs = [
    { id: 3, title: 'A' },
    { id: 5, title: 'B' },
  ];

  it('leaves a super-admin looking at all programs unscoped', () => {
    expect(scopedProgramIds(ALL_PROGRAMS, programs, true)).toBeNull();
  });

  it('limits an org admin looking at all programs to the programs they manage', () => {
    expect(scopedProgramIds(ALL_PROGRAMS, programs, false)).toEqual([3, 5]);
  });

  it('uses the selected program', () => {
    expect(scopedProgramIds('5', programs, true)).toEqual([5]);
  });
});

describe('buildSessionWhere', () => {
  const range = { start: new Date('2026-10-01T00:00:00Z'), end: new Date('2026-11-01T00:00:00Z') };

  it('loads sessions overlapping the visible range', () => {
    expect(buildSessionWhere(null, range)).toEqual({
      startDateTime: { _lt: '2026-11-01T00:00:00.000Z' },
      endDateTime: { _gt: '2026-10-01T00:00:00.000Z' },
    });
  });

  it('matches course sessions and program sessions of the scoped programs', () => {
    expect(buildSessionWhere([7], null)).toEqual({
      _or: [{ programId: { _in: [7] } }, { Course: { programId: { _in: [7] } } }],
    });
  });

  it('combines scope and range', () => {
    expect(buildSessionWhere([7], range)).toHaveProperty('_and');
  });
});

describe('filterSessions', () => {
  const kiel = session(1, { course: { id: 10, title: 'Zeta' }, location: LocationOption_enum.KIEL });
  const online = session(2, { course: { id: 11, title: 'Alpha' }, location: LocationOption_enum.ONLINE });
  const event = session(3, { course: { id: 12, title: 'Meetup' }, programType: 'EVENTS' });
  const programSession = session(4);
  const all = [kiel, online, event, programSession];
  const kinds: SessionKind[] = ['COURSES', 'EVENTS'];

  it('keeps everything without filters', () => {
    expect(filterSessions(all, { kinds, locations: [], courseIds: [] })).toHaveLength(4);
  });

  it('filters by kind', () => {
    expect(filterSessions(all, { kinds: ['EVENTS'], locations: [], courseIds: [] })).toEqual([event]);
    expect(sessionKind(programSession)).toBe('COURSES');
  });

  it('filters by location and course', () => {
    expect(filterSessions(all, { kinds, locations: [LocationOption_enum.ONLINE], courseIds: [] })).toEqual([online]);
    expect(filterSessions(all, { kinds, locations: [], courseIds: [10] })).toEqual([kiel]);
  });

  it('lists the courses of the loaded sessions by title', () => {
    expect(coursesOfSessions(all).map((course) => course.title)).toEqual(['Alpha', 'Meetup', 'Zeta']);
  });
});

describe('isOutsideLecturePeriod', () => {
  const program = { id: 1, title: 'WiSe', lectureStart: '2026-10-15', lectureEnd: '2027-02-15' };

  it('is false inside the period, including its last day', () => {
    expect(isOutsideLecturePeriod(program, new Date('2026-11-01T12:00:00'))).toBe(false);
    expect(isOutsideLecturePeriod(program, new Date('2027-02-15T18:00:00'))).toBe(false);
  });

  it('is true before and after the period', () => {
    expect(isOutsideLecturePeriod(program, new Date('2026-10-09T12:00:00'))).toBe(true);
    expect(isOutsideLecturePeriod(program, new Date('2027-03-01T12:00:00'))).toBe(true);
  });

  it('is false without a lecture start', () => {
    expect(isOutsideLecturePeriod({ id: 1, title: 'x' }, new Date())).toBe(false);
  });
});
