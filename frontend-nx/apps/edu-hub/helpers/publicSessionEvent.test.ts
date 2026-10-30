import { buildEventFromSession } from './publicSessionEvent';

const course = {
  title: 'Machine Learning',
  tagline: 'Learn ML from scratch.',
  coverImage: 'https://example.com/cover.jpg',
  language: 'EN',
  contentDescriptionField1: 'Twelve weekly sessions.',
};

const texts = {
  tagline: 'Open session of "Machine Learning"',
  aboutSessionHeading: 'About this session',
  aboutCourseHeading: 'About the course "Machine Learning"',
};

describe('buildEventFromSession', () => {
  it('combines the session and the course into an unpublished event', () => {
    const event = buildEventFromSession(
      course,
      { id: 29, title: 'Guest talk', description: 'A talk by Ada.', startDateTime: new Date('2026-11-05T17:00:00Z') },
      3,
      texts,
      'Europe/Berlin'
    );

    expect(event).toEqual({
      programId: 3,
      sourceSessionId: 29,
      published: false,
      title: 'Guest talk',
      tagline: texts.tagline,
      coverImage: course.coverImage,
      language: 'EN',
      applicationEnd: '2026-11-05',
      maxMissedSessions: 0,
      headingDescriptionField1: 'About this session',
      contentDescriptionField1: 'A talk by Ada.',
      headingDescriptionField2: texts.aboutCourseHeading,
      contentDescriptionField2: 'Learn ML from scratch.\n\nTwelve weekly sessions.',
    });
  });

  it('falls back to the course title and leaves out an empty session description', () => {
    const event = buildEventFromSession(
      { ...course, tagline: null, contentDescriptionField1: null },
      { id: 29, title: '  ', description: ' ', startDateTime: new Date('2026-11-05T17:00:00Z') },
      3,
      texts,
      'Europe/Berlin'
    );

    expect(event.title).toBe('Machine Learning');
    expect(event.headingDescriptionField1).toBeNull();
    expect(event.contentDescriptionField1).toBeNull();
    expect(event.contentDescriptionField2).toBeNull();
  });

  it("takes the deadline from the session's day in the app's time zone", () => {
    // 23:30 UTC on 5 November is already 6 November in Berlin.
    const event = buildEventFromSession(
      course,
      { id: 29, title: 'Late talk', description: null, startDateTime: '2026-11-05T23:30:00Z' },
      3,
      texts,
      'Europe/Berlin'
    );

    expect(event.applicationEnd).toBe('2026-11-06');
  });
});
