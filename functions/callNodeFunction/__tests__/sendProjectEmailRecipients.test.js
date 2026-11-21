describe('resolveJoinRequestRecipients', () => {
  let resolveJoinRequestRecipients;

  beforeAll(async () => {
    ({ resolveJoinRequestRecipients } = await import('../sendProjectEmail/index.js'));
  });

  const user = (id) => ({ id, email: `${id}@example.com` });
  const project = ({ authors = [], mentors = [], instructors = [] } = {}) => ({
    ProjectAuthors: authors.map(([id, participationStatus]) => ({ participationStatus, User: user(id) })),
    ProjectMentors: mentors.map((id) => ({ User: user(id) })),
    ProjectCourses: [{ Course: { CourseInstructors: instructors.map((id) => ({ User: user(id) })) } }],
  });
  const ids = (users) => users.map((u) => u.id);

  it('tells only the accepted team, not mentors or instructors', () => {
    const p = project({
      authors: [['ann', 'ACCEPTED'], ['bob', 'ACCEPTED'], ['eve', 'REQUESTED'], ['dan', 'DECLINED']],
      mentors: ['mia'],
      instructors: ['ivo'],
    });
    expect(ids(resolveJoinRequestRecipients(p))).toEqual(['ann', 'bob']);
  });

  it('falls back to mentors while the project has no team', () => {
    const p = project({ authors: [['eve', 'REQUESTED']], mentors: ['mia'], instructors: ['ivo'] });
    expect(ids(resolveJoinRequestRecipients(p))).toEqual(['mia']);
  });

  it('falls back to course instructors without team or mentors', () => {
    const p = project({ authors: [['eve', 'REQUESTED']], instructors: ['ivo'] });
    expect(ids(resolveJoinRequestRecipients(p))).toEqual(['ivo']);
  });
});
