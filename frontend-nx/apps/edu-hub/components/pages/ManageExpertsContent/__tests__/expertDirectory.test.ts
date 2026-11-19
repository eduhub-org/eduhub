import { ExpertsList_User } from '../../../../queries/__generated__/ExpertsList';
import {
  closestRole,
  expertCsvRows,
  expertRoles,
  findMatches,
  highlight,
  lastActive,
  matchesAllWords,
  noteOrganizationsFor,
  linkedInSearchUrl,
  mailtoBcc,
  matchedRoleKeys,
  profileKind,
  profileUrl,
  snippet,
  sourcesCondition,
} from '../expertDirectory';

const expert = (overrides: Partial<ExpertsList_User> = {}): ExpertsList_User =>
  ({
    __typename: 'User',
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    picture: null,
    externalProfile: null,
    organizationName: null,
    Organization: { __typename: 'Organization', id: 1, name: 'Analytical Engines' },
    matrixUserHandle: null,
    doNotContact: false,
    CourseInstructors: [
      {
        __typename: 'CourseInstructor',
        id: 10,
        Course: {
          __typename: 'Course',
          id: 100,
          title: 'Deep Learning',
          tagline: 'Neural networks from scratch',
          contentDescriptionField1: '<p>We build a <b>transformer</b> step by step.</p>',
          contentDescriptionField2: null,
          headingDescriptionField1: null,
          headingDescriptionField2: null,
          Program: { __typename: 'Program', id: 1, shortTitle: 'WS24', type: 'COURSES', lectureStart: '2024-10-14', organizationId: 7 },
        },
      },
    ],
    SessionSpeakers: [
      {
        __typename: 'SessionSpeaker',
        id: 20,
        Session: {
          __typename: 'Session',
          id: 200,
          title: 'Ethics of AI',
          description: null,
          startDateTime: '2026-03-01T17:00:00Z',
          Course: {
            __typename: 'Course',
            id: 300,
            title: 'Open Talks',
            Program: { __typename: 'Program', id: 3, shortTitle: 'OT', organizationId: 9 },
          },
        },
      },
    ],
    ProjectMentors: [],
    AchievementOptionMentors: [],
    ExpertNotes: [],
    ...overrides,
  }) as ExpertsList_User;

describe('expertRoles', () => {
  it('lists every role newest first and names event courses as organizer roles', () => {
    const roles = expertRoles(
      expert({
        CourseInstructors: [
          {
            ...expert().CourseInstructors[0],
            Course: {
              ...expert().CourseInstructors[0].Course,
              Program: { __typename: 'Program', id: 2, shortTitle: 'EV', type: 'EVENTS', lectureStart: null, organizationId: 8 },
            },
          },
        ],
      })
    );

    expect(roles.map((role) => [role.kind, role.title])).toEqual([
      ['speaker', 'Ethics of AI'],
      ['organizer', 'Deep Learning'],
    ]);
  });
});

describe('noteOrganizationsFor', () => {
  it('offers only managed organizations the expert worked with', () => {
    const managed = [
      { id: 7, name: 'Courses org' },
      { id: 42, name: 'Unrelated org' },
      { id: 9, name: 'Talks org' },
    ];
    expect(noteOrganizationsFor(managed, expertRoles(expert())).map((org) => org.id)).toEqual([7, 9]);
  });
});

describe('lastActive', () => {
  it('is the date of the newest role', () => {
    expect(lastActive(expertRoles(expert()))?.toISOString()).toBe('2026-03-01T17:00:00.000Z');
  });

  it('reads dates the Apollo cache already turned into Date objects', () => {
    const row = expert();
    const session = row.SessionSpeakers[0].Session;
    const roles = expertRoles(
      expert({
        SessionSpeakers: [{ ...row.SessionSpeakers[0], Session: { ...session, startDateTime: new Date('2027-01-02T10:00:00Z') } }],
      })
    );
    expect(lastActive(roles)?.toISOString()).toBe('2027-01-02T10:00:00.000Z');
  });

  it('is empty without dated roles', () => {
    expect(lastActive([])).toBeNull();
  });
});

describe('findMatches', () => {
  it('names the field and role each search word was found in', () => {
    const row = expert();
    const roles = expertRoles(row);
    const matches = findMatches(row, roles, 'Transformer');

    expect(matches).toHaveLength(1);
    expect(matches[0].role?.title).toBe('Deep Learning');
    expect(matches[0].field).toBe('description');
    expect(matches[0].snippet).toBe('We build a transformer step by step.');
    expect(matchedRoleKeys(matches)).toEqual(new Set(['instructor-10']));
  });

  it('explains hits in the person fields and in several roles', () => {
    const row = expert();
    const matches = findMatches(row, expertRoles(row), 'ada ai');

    expect(matches.map((match) => [match.role?.title ?? null, match.field])).toEqual([
      [null, 'name'],
      [null, 'email'],
      ['Ethics of AI', 'title'],
    ]);
  });

  it('finds nothing without a search', () => {
    const row = expert();
    expect(findMatches(row, expertRoles(row), '  ')).toEqual([]);
  });
});

describe('snippet and highlight', () => {
  it('cuts long text around the first hit', () => {
    const text = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`;
    const cut = snippet(text, ['needle']);

    expect(cut.startsWith('…')).toBe(true);
    expect(cut.endsWith('…')).toBe(true);
    expect(cut).toContain('needle');
  });

  it('marks every occurrence regardless of case', () => {
    expect(highlight('AI and ai', ['ai'])).toEqual([
      { text: 'AI', hit: true },
      { text: ' and ', hit: false },
      { text: 'ai', hit: true },
    ]);
  });
});

describe('profile links', () => {
  it('adds a missing scheme and tells LinkedIn and Xing apart', () => {
    const url = profileUrl('www.linkedin.com/in/ada');
    expect(url).toBe('https://www.linkedin.com/in/ada');
    expect(profileKind(url as string)).toBe('linkedin');
    expect(profileKind('https://www.xing.com/profile/Ada')).toBe('xing');
    expect(profileKind('https://ada.example.org')).toBe('other');
  });

  it('ignores values that are not web addresses', () => {
    expect(profileUrl('')).toBeNull();
    expect(profileUrl('just my name')).toBeNull();
  });

  it('searches LinkedIn for name and organization', () => {
    expect(linkedInSearchUrl(expert())).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=Ada%20Lovelace%20Analytical%20Engines'
    );
  });
});

describe('contacting and exporting', () => {
  const blocked = expert({ id: 'u2', email: 'no@example.com', doNotContact: true });

  it('leaves people marked do-not-contact out of a group mail', () => {
    expect(mailtoBcc([expert(), blocked])).toBe('mailto:?bcc=ada%40example.com');
    expect(mailtoBcc([blocked])).toBeNull();
  });

  it('exports the visible columns without people marked do-not-contact', () => {
    expect(expertCsvRows([expert(), blocked], ['h'])).toEqual([
      ['h'],
      ['Ada', 'Lovelace', 'Analytical Engines', 'ada@example.com', '2026'],
    ]);
  });
});

describe('semantic search helpers', () => {
  const matches = [
    { sourceType: 'COURSE', sourceId: 100, similarity: 0.62 },
    { sourceType: 'SESSION', sourceId: 200, similarity: 0.71 },
    { sourceType: 'PROJECT', sourceId: 999, similarity: 0.9 },
  ];

  it('looks people up by the matched sources of each kind', () => {
    expect(sourcesCondition(matches)).toEqual({
      _or: [
        { CourseInstructors: { courseId: { _in: [100] } } },
        { SessionSpeakers: { sessionId: { _in: [200] } } },
        { ProjectMentors: { projectId: { _in: [999] } } },
        { AchievementOptionMentors: { achievementOptionId: { _in: [] } } },
      ],
    });
  });

  it('tells whether the keyword search lists a person', () => {
    const row = expert();
    expect(matchesAllWords(row, expertRoles(row), 'transformer ada')).toBe(true);
    expect(matchesAllWords(row, expertRoles(row), 'transformer gardening')).toBe(false);
  });

  it("picks the person's role closest to the search", () => {
    const closest = closestRole(expertRoles(expert()), matches);
    expect(closest?.role.title).toBe('Ethics of AI');
    expect(closest?.similarity).toBe(0.71);
    expect(closestRole(expertRoles(expert()), [{ sourceType: 'COURSE', sourceId: 1, similarity: 1 }])).toBeNull();
  });
});
