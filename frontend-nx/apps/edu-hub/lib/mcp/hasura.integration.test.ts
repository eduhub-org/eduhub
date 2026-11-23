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

/** A raw Hasura call as the Org Admin, for cleanup only (not an MCP operation); fails loudly. */
const asOrgAdmin = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url as string, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokens.orgadmin}`, 'x-hasura-role': 'org_admin', 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors) throw new Error(`Cleanup failed: ${JSON.stringify(body.errors ?? response.status)}`);
  return body.data as T;
};

const deleteCourseAsOrgAdmin = async (id: number) => {
  const data = await asOrgAdmin<{ delete_Course_by_pk: { id: number } | null }>(
    'mutation ($id: Int!) { delete_Course_by_pk(id: $id) { id } }',
    { id }
  );
  if (data.delete_Course_by_pk?.id !== id) throw new Error(`Cleanup failed: course ${id} was not deleted`);
};

/** Removes this run's test Sessions by their unique title, even if an apply's response was lost. */
const deleteSessionsTitled = (title: string) =>
  asOrgAdmin('mutation ($courseId: Int!, $title: String!) { delete_Session(where: { courseId: { _eq: $courseId }, title: { _eq: $title } }) { affected_rows } }', {
    courseId: ORG_9100_COURSE,
    title,
  });

const RUN = Date.now();

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
      // Restore the exact value, null included (the text tools only take strings).
      await asOrgAdmin('mutation ($id: Int!, $tagline: String) { update_Course_by_pk(pk_columns: { id: $id }, _set: { tagline: $tagline }) { id } }', {
        id: ORG_9100_COURSE,
        tagline: original,
      });
    }
  });

  it('an Org Admin adds and deletes a Session while nobody has registered', async () => {
    const setup = setupFor(tokens.orgadmin, 'org_admin');
    const title = `MCP test session ${RUN}`;
    expect((await setup.getCourse({ courseId: ORG_9100_COURSE })).registrationCount).toBe(0);
    try {
      const add = await setup.proposeSessions({
        courseId: ORG_9100_COURSE,
        sessions: [{ title, startDateTime: '2030-01-08T18:00:00+01:00', endDateTime: '2030-01-08T19:30:00+01:00' }],
      });
      await setup.applyProposedChange(add);
      const added = (await setup.getCourse({ courseId: ORG_9100_COURSE })).sessions.filter((s) => s.title === title);
      expect(added).toHaveLength(1);

      const remove = await setup.proposeSessions({ courseId: ORG_9100_COURSE, deleteSessionIds: [added[0].id] });
      await setup.applyProposedChange(remove);
      expect((await setup.getCourse({ courseId: ORG_9100_COURSE })).sessions.some((s) => s.title === title)).toBe(false);
    } finally {
      await deleteSessionsTitled(title);
    }
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
