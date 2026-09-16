import { buildCourseStructuredData, StructuredDataCourse } from './courseStructuredData';

jest.mock('./filehandling', () => ({
  getPublicImageUrl: (filePath: string | null) => (filePath ? `https://cdn.example/${filePath}` : null),
}));

const OPTIONS = { siteUrl: 'https://edu.example' };

const baseCourse = (overrides: Partial<StructuredDataCourse> = {}): StructuredDataCourse => ({
  id: 42,
  title: 'Prototyping Week',
  tagline: 'Build something in five days',
  coverImage: 'cover.png',
  language: 'DE',
  applicationEnd: '2025-09-01T00:00:00Z',
  basePrice: 2500,
  currency: 'EUR',
  Program: { type: 'EVENTS' },
  CourseLocations: [{ locationOption: 'KIEL', defaultSessionAddress: 'Fraunhoferstr. 13, Kiel' }],
  Sessions: [
    {
      id: 1,
      title: 'Kickoff',
      description: 'Intro and teams',
      startDateTime: '2025-09-12T08:00:00Z',
      endDateTime: '2025-09-12T10:00:00Z',
      SessionSpeakers: [{ User: { firstName: 'Ada', lastName: 'Lovelace' } }],
    },
    {
      id: 2,
      title: 'Demo Day',
      description: null,
      startDateTime: '2025-09-14T08:00:00Z',
      endDateTime: '2025-09-14T12:00:00Z',
      SessionSpeakers: [{ User: { firstName: 'Ada', lastName: 'Lovelace' } }],
    },
  ],
  CourseInstructors: [{ User: { firstName: 'Grace', lastName: 'Hopper' } }],
  ...overrides,
});

describe('buildCourseStructuredData - events', () => {
  it('builds an Event spanning the sessions, with one subEvent each', () => {
    const data = buildCourseStructuredData(baseCourse(), OPTIONS)!;

    expect(data['@type']).toBe('Event');
    expect(data.name).toBe('Prototyping Week');
    expect(data.url).toBe('https://edu.example/course/42');
    expect(data.image).toBe('https://cdn.example/cover.png');
    expect(data.startDate).toBe('2025-09-12T08:00:00.000Z');
    expect(data.endDate).toBe('2025-09-14T12:00:00.000Z');
    expect(data.eventStatus).toBe('https://schema.org/EventScheduled');
    expect(data.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
    expect(data.location).toEqual([
      { '@type': 'Place', name: 'KIEL', address: 'Fraunhoferstr. 13, Kiel' },
    ]);
    expect(data.subEvent).toHaveLength(2);
    expect(data.subEvent[0]).toMatchObject({
      '@type': 'Event',
      name: 'Kickoff',
      description: 'Intro and teams',
      startDate: '2025-09-12T08:00:00.000Z',
    });
    // De-duplicated across sessions.
    expect(data.performer).toEqual([{ '@type': 'Person', name: 'Ada Lovelace' }]);
  });

  it('omits subEvent for a single-session event', () => {
    const data = buildCourseStructuredData(
      baseCourse({ Sessions: [baseCourse().Sessions![0]] }),
      OPTIONS
    )!;
    expect(data.subEvent).toBeUndefined();
    expect(data.startDate).toBe('2025-09-12T08:00:00.000Z');
    expect(data.endDate).toBe('2025-09-12T10:00:00.000Z');
  });

  it('reports a mixed attendance mode and a virtual location', () => {
    const data = buildCourseStructuredData(
      baseCourse({
        CourseLocations: [
          { locationOption: 'KIEL', defaultSessionAddress: null },
          { locationOption: 'ONLINE', defaultSessionAddress: null },
        ],
      }),
      OPTIONS
    )!;
    expect(data.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode');
    expect(data.location).toEqual([
      { '@type': 'Place', name: 'KIEL', address: 'KIEL' },
      { '@type': 'VirtualLocation', url: 'https://edu.example/course/42' },
    ]);
  });

  it('prices the offer in euros, not cents', () => {
    const data = buildCourseStructuredData(baseCourse(), OPTIONS)!;
    expect(data.offers).toMatchObject({ price: '25.00', priceCurrency: 'EUR' });
  });

  it('marks a course without a base price as free', () => {
    const data = buildCourseStructuredData(baseCourse({ basePrice: null }), OPTIONS)!;
    expect(data.offers.price).toBe('0.00');
  });
});

describe('buildCourseStructuredData - courses', () => {
  it('builds a Course with a CourseInstance rather than an Event', () => {
    const data = buildCourseStructuredData(
      baseCourse({ Program: { type: 'COURSES' } }),
      OPTIONS
    )!;

    expect(data['@type']).toBe('Course');
    expect(data.provider).toEqual({
      '@type': 'EducationalOrganization',
      name: 'EduHub',
      url: 'https://edu.example',
    });
    expect(data.inLanguage).toBe('de');
    expect(data.hasCourseInstance).toMatchObject({
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      startDate: '2025-09-12T08:00:00.000Z',
      endDate: '2025-09-14T12:00:00.000Z',
      instructor: [{ '@type': 'Person', name: 'Grace Hopper' }],
    });
    expect(data.subEvent).toBeUndefined();
  });

  it('defaults an unknown program type to Course', () => {
    const data = buildCourseStructuredData(baseCourse({ Program: null }), OPTIONS)!;
    expect(data['@type']).toBe('Course');
  });
});

describe('buildCourseStructuredData - degrees', () => {
  const degree = () =>
    baseCourse({
      Program: { type: 'DEGREES' },
      Sessions: [],
      requiredEcts: 12.5,
      maxParticipants: 30,
      DegreeCourses: [
        { Course: { id: 7, title: 'Published member', published: true, Program: { published: true } } },
        { Course: { id: 8, title: 'Unpublished member', published: false, Program: { published: true } } },
        { Course: { id: 9, title: 'Hidden program', published: true, Program: { published: false } } },
      ],
    });

  it('builds an EducationalOccupationalProgram listing only published members', () => {
    const data = buildCourseStructuredData(degree(), OPTIONS)!;

    expect(data['@type']).toBe('EducationalOccupationalProgram');
    expect(data.numberOfCredits).toBe(12.5);
    expect(data.maximumEnrollment).toBe(30);
    expect(data.applicationDeadline).toBe('2025-09-01T00:00:00.000Z');
    expect(data.hasCourse).toEqual([
      { '@type': 'Course', name: 'Published member', url: 'https://edu.example/course/7' },
    ]);
  });

  it('omits the properties EduHub does not model', () => {
    const data = buildCourseStructuredData(degree(), OPTIONS)!;
    for (const absent of [
      'timeToComplete',
      'startDate',
      'endDate',
      'educationalCredentialAwarded',
      'educationalProgramMode',
      'occupationalCategory',
      'termsPerYear',
      'programPrerequisites',
    ]) {
      expect(data[absent]).toBeUndefined();
    }
  });
});

describe('buildCourseStructuredData - guards', () => {
  it('returns null without a course', () => {
    expect(buildCourseStructuredData(null, OPTIONS)).toBeNull();
    expect(buildCourseStructuredData(undefined, OPTIONS)).toBeNull();
  });

  it('drops empty optional fields instead of emitting nulls', () => {
    const data = buildCourseStructuredData(
      baseCourse({ coverImage: null, tagline: null, contentDescriptionField1: null, CourseLocations: [] }),
      OPTIONS
    )!;
    expect('image' in data).toBe(false);
    expect('description' in data).toBe(false);
    expect('location' in data).toBe(false);
    expect('eventAttendanceMode' in data).toBe(false);
  });
});
