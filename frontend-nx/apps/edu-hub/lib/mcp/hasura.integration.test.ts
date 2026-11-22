/**
 * @jest-environment node
 *
 * Runs the course-setup operations against a real local Hasura with real Keycloak tokens. Skipped
 * unless MCP_IT_HASURA_URL and the tokens are set, so CI (which has no stack) skips it:
 *
 *   MCP_IT_HASURA_URL=http://localhost:8080/v1/graphql \
 *   MCP_IT_TOKEN_INSTRUCTOR=<token of instructor@example.com> \
 *   MCP_IT_TOKEN_ORGADMIN=<token of orgadmin@example.com> \
 *   MCP_IT_TOKEN_USER=<token of user@example.com> \
 *   yarn jest -c apps/edu-hub/jest.config.ts apps/edu-hub/lib/mcp/hasura.integration
 *
 * Seed data it relies on (backend/seeds): instructor@example.com teaches course 7001, which has
 * Registrations; orgadmin@example.com is a settings admin of organization 9100, whose course 9002
 * has none and is in program 9201. The test changes course 9002 and puts it back, and deletes the
 * course it creates in program 9201.
 */
import { createHasuraCourseStore, pickRole } from './hasuraCourseStore';
import { createCourseSetup } from './operations';

const url = process.env.MCP_IT_HASURA_URL;
const tokens = {
  instructor: process.env.MCP_IT_TOKEN_INSTRUCTOR,
  orgadmin: process.env.MCP_IT_TOKEN_ORGADMIN,
  user: process.env.MCP_IT_TOKEN_USER,
};
const enabled = !!(url && tokens.instructor && tokens.orgadmin && tokens.user);

const setupFor = (token: string | undefined, role?: string) =>
  createCourseSetup({
    store: createHasuraCourseStore({ url: url as string, token: token as string, role: pickRole(token as string, role) }),
    secret: 'integration-test-secret',
  });

const SEEDED_WITH_REGISTRATIONS = 7001; // taught by instructor@example.com
const ORG_9100_COURSE = 9002; // organization 9100, no Registrations
const ORG_9100_PROGRAM = 9201; // organization 9100, COURSES

/** Deletes a course as the Org Admin (cleanup only; not an MCP operation). */
const deleteCourseAsOrgAdmin = async (id: number) => {
  await fetch(url as string, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokens.orgadmin}`, 'x-hasura-role': 'org_admin', 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'mutation ($id: Int!) { delete_Course_by_pk(id: $id) { id } }', variables: { id } }),
  });
};

(enabled ? describe : describe.skip)('course setup against local Hasura', () => {
  beforeAll(() => jest.spyOn(console, 'info').mockImplementation(() => undefined));
  afterAll(() => jest.restoreAllMocks());

  it('an instructor reads and proposes for their own course', async () => {
    const setup = setupFor(tokens.instructor, 'instructor');
    const course = await setup.getCourse({ courseId: SEEDED_WITH_REGISTRATIONS });
    expect(course.registrationCount).toBeGreaterThan(0);
    await expect(
      setup.proposeCourseTexts({ courseId: SEEDED_WITH_REGISTRATIONS, texts: { tagline: `${course.tagline} (neu)` } })
    ).resolves.toMatchObject({ status: 'PROPOSED' });
    expect((await setup.listCourses()).courses.map((c) => c.id)).toContain(SEEDED_WITH_REGISTRATIONS);
  });

  it("an instructor can't change Sessions once anyone has registered", async () => {
    const result = setupFor(tokens.instructor, 'instructor').proposeSessions({
      courseId: SEEDED_WITH_REGISTRATIONS,
      deleteSessionIds: [72101],
    });
    await expect(result).rejects.toMatchObject({ code: 'REGISTRATIONS_EXIST' });
  });

  it("an instructor can't touch a course they don't teach", async () => {
    const result = setupFor(tokens.instructor, 'instructor').getCourse({ courseId: ORG_9100_COURSE });
    await expect(result).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it("an instructor can't change settings their role can't update in Hasura", async () => {
    const result = setupFor(tokens.instructor, 'instructor').proposeCourseSettings({
      courseId: SEEDED_WITH_REGISTRATIONS,
      settings: { applicationEnd: '2030-01-01' },
    });
    await expect(result).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it("an Org Admin can't touch another organization's course", async () => {
    const result = setupFor(tokens.orgadmin, 'org_admin').proposeCourseTexts({
      courseId: SEEDED_WITH_REGISTRATIONS,
      texts: { tagline: 'x' },
    });
    await expect(result).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('a plain user is refused, and so is a role their token does not have', async () => {
    await expect(setupFor(tokens.user).listCourses()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(setupFor(tokens.user, 'admin').listCourses()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('an Org Admin applies texts; a stale proposal fails', async () => {
    const setup = setupFor(tokens.orgadmin, 'org_admin');
    const original = (await setup.getCourse({ courseId: ORG_9100_COURSE })).tagline as string | null;
    const first = await setup.proposeCourseTexts({ courseId: ORG_9100_COURSE, texts: { tagline: 'MCP test A' } });
    const second = await setup.proposeCourseTexts({ courseId: ORG_9100_COURSE, texts: { tagline: 'MCP test B' } });
    try {
      await expect(setup.applyProposedChange(first)).resolves.toMatchObject({ status: 'APPLIED' });
      expect((await setup.getCourse({ courseId: ORG_9100_COURSE })).tagline).toBe('MCP test A');
      await expect(setup.applyProposedChange(second)).rejects.toMatchObject({ code: 'STALE' });
    } finally {
      const revert = await setup.proposeCourseTexts({ courseId: ORG_9100_COURSE, texts: { tagline: original ?? '' } });
      await setup.applyProposedChange(revert);
    }
  });

  it('an Org Admin adds and deletes a Session while nobody has registered', async () => {
    const setup = setupFor(tokens.orgadmin, 'org_admin');
    const before = await setup.getCourse({ courseId: ORG_9100_COURSE });
    expect(before.registrationCount).toBe(0);

    const add = await setup.proposeSessions({
      courseId: ORG_9100_COURSE,
      sessions: [{ title: 'MCP test session', startDateTime: '2030-01-08T18:00:00+01:00', endDateTime: '2030-01-08T19:30:00+01:00' }],
    });
    await setup.applyProposedChange(add);
    const added = (await setup.getCourse({ courseId: ORG_9100_COURSE })).sessions.find(
      (s) => s.title === 'MCP test session'
    );
    expect(added).toBeDefined();

    const remove = await setup.proposeSessions({ courseId: ORG_9100_COURSE, deleteSessionIds: [added?.id as number] });
    await setup.applyProposedChange(remove);
    expect((await setup.getCourse({ courseId: ORG_9100_COURSE })).sessions).toHaveLength(before.sessions.length);
  });

  it('an Org Admin creates a course in their program; an instructor and another org are refused', async () => {
    await expect(
      setupFor(tokens.instructor, 'instructor').proposeCreateCourse({ programId: ORG_9100_PROGRAM, title: 'x' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      setupFor(tokens.orgadmin, 'org_admin').proposeCreateCourse({ programId: 6, title: 'x' }) // organization 0
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const setup = setupFor(tokens.orgadmin, 'org_admin');
    expect((await setup.listPrograms()).programs.map((p) => p.id)).toContain(ORG_9100_PROGRAM);
    const proposal = await setup.proposeCreateCourse({
      programId: ORG_9100_PROGRAM,
      title: `MCP test course ${Date.now()}`,
      texts: { tagline: 'Created by the integration test' },
      locationOptions: ['ONLINE', 'KIEL'],
    });
    const applied = (await setup.applyProposedChange(proposal)) as { courseId: number };
    try {
      const course = await setup.getCourse({ courseId: applied.courseId });
      expect(course).toMatchObject({ tagline: 'Created by the integration test', maxMissedSessions: 2, language: 'DE' });
      expect(course.courseLocations.map((l) => l.locationOption)).toEqual(['ONLINE', 'KIEL']);
      await expect(setup.applyProposedChange(proposal)).rejects.toMatchObject({ code: 'ALREADY_APPLIED' });
    } finally {
      await deleteCourseAsOrgAdmin(applied.courseId);
    }
  });
});
