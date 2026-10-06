import type { Course_Course_by_pk_Sessions, Course_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/Course';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { buildCourseIcalEvents } from '../sessionLocations';

jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: () => ({ data: null }),
}));

const KIEL: Course_Course_by_pk_CourseLocations = {
  __typename: 'CourseLocation',
  id: 1,
  locationOption: LocationOption_enum.KIEL,
  defaultSessionAddress: null,
  defaultSessionAddressId: 7,
} as Course_Course_by_pk_CourseLocations;

const session = (id: number, start: string, end: string, title: string, description = ''): Course_Course_by_pk_Sessions =>
  ({
    __typename: 'Session',
    id,
    courseId: 1,
    title,
    description,
    startDateTime: start,
    endDateTime: end,
    isMandatory: true,
    programId: null,
    SessionSpeakers: [],
    SessionAddresses: [
      { __typename: 'SessionAddress', id: id * 10, address: '', locationAddressId: null, locationOption: null, CourseLocation: KIEL },
    ],
  } as unknown as Course_Course_by_pk_Sessions);

const build = (sessions: Course_Course_by_pk_Sessions[]) =>
  buildCourseIcalEvents({
    sessions,
    courseLocations: [KIEL],
    addressMap: new Map([[7, { address: 'Kuhnkestr. 6', shortLabel: 'Coworking' }]]),
    canSeeOnlineLink: false,
    calendarName: 'KI-Abend',
  });

describe('buildCourseIcalEvents', () => {
  it('merges back-to-back sessions into one entry named after the course', () => {
    const [entry, ...rest] = build([
      session(1, '2026-10-01T16:00:00Z', '2026-10-01T17:30:00Z', 'Podiumsdiskussion', 'Mit Gästen'),
      session(2, '2026-10-01T17:30:00Z', '2026-10-01T19:00:00Z', 'Austausch'),
    ]);

    expect(rest).toHaveLength(0);
    expect(entry).toMatchObject({
      uid: 'session-1@eduhub',
      title: 'KI-Abend',
      startDateTime: '2026-10-01T16:00:00.000Z',
      endDateTime: '2026-10-01T19:00:00.000Z',
      location: 'Coworking (Kuhnkestr. 6)',
      description: '18:00–19:30 Podiumsdiskussion\n19:30–21:00 Austausch\n\nPodiumsdiskussion:\nMit Gästen',
    });
  });

  it('keeps sessions apart when there is a break between them', () => {
    const entries = build([
      session(1, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z', 'Morgens', 'Früh'),
      session(2, '2026-10-01T12:00:00Z', '2026-10-01T14:00:00Z', 'Mittags'),
    ]);

    expect(entries.map((entry) => entry.title)).toEqual(['KI-Abend – Morgens', 'KI-Abend – Mittags']);
    expect(entries[0].description).toBe('Früh');
  });
});
