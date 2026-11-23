/**
 * @jest-environment node
 */
import { onProposalMetric, ProposalMetric } from './metrics';
import { createCourseSetup } from './operations';
import { signProposal, verifyProposal } from './proposals';
import { createFakeCourseStore, createWorld, FakeWorld } from './testing/fakeCourseStore';

const SECRET = 'test-secret';

const setupFor = (world: FakeWorld, userId: string, role: string, now?: () => number) =>
  createCourseSetup({ store: createFakeCourseStore(world, userId, role), secret: SECRET, now });

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return 'NO_ERROR';
};

const newSession = {
  title: 'Neuronale Netze',
  startDateTime: '2027-01-26T18:00:00+01:00',
  endDateTime: '2027-01-26T19:30:00+01:00',
};

let metrics: ProposalMetric[];
let unsubscribe: () => void;
let world: FakeWorld;
beforeEach(() => {
  world = createWorld();
  metrics = [];
  unsubscribe = onProposalMetric((m) => metrics.push(m));
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
});
afterEach(() => {
  unsubscribe();
  jest.restoreAllMocks();
});

/** Every operation, called on `courseId`, for the role-matrix tests. */
const operations = (setup: ReturnType<typeof setupFor>, courseId: number) => ({
  get_course: () => setup.getCourse({ courseId }),
  get_registration_count: () => setup.getRegistrationCount({ courseId }),
  propose_course_texts: () => setup.proposeCourseTexts({ courseId, texts: { tagline: 'Neu' } }),
  propose_course_settings: () => setup.proposeCourseSettings({ courseId, settings: { maxParticipants: 99 } }),
  propose_sessions: () => setup.proposeSessions({ courseId, sessions: [newSession] }),
});

describe('who may use each operation', () => {
  const opNames = Object.keys(operations(setupFor(createWorld(), 'x', 'x'), 1));

  it.each(opNames)('%s works for the instructor of the course, its Org Admin and an admin', async (op) => {
    for (const [userId, role] of [
      ['ins-1', 'instructor'],
      ['oa-1', 'org_admin'],
      ['admin', 'admin'],
    ]) {
      const run = operations(setupFor(createWorld(), userId, role), 1)[op as 'get_course'];
      await expect(run()).resolves.toBeDefined();
    }
  });

  it.each(opNames)('%s refuses an instructor of another course', async (op) => {
    const run = operations(setupFor(world, 'ins-2', 'instructor'), 1)[op as 'get_course'];
    expect(await errorCode(run())).toBe('NOT_FOUND');
  });

  it.each(opNames)('%s refuses an Org Admin of another organization', async (op) => {
    const run = operations(setupFor(world, 'oa-2', 'org_admin'), 1)[op as 'get_course'];
    expect(await errorCode(run())).toBe('NOT_FOUND');
  });

  it.each(opNames)('%s refuses a plain user', async (op) => {
    const run = operations(setupFor(world, 'u-1', 'user'), 1)[op as 'get_course'];
    expect(await errorCode(run())).toBe('FORBIDDEN');
  });

  it.each(opNames)('%s refuses a role the token does not allow', async (op) => {
    const run = operations(setupFor(world, 'u-1', 'admin'), 1)[op as 'get_course'];
    expect(await errorCode(run())).toBe('UNAUTHENTICATED');
  });

  it('list_courses only lists the courses the caller manages', async () => {
    const ids = async (userId: string, role: string) =>
      (await setupFor(world, userId, role).listCourses()).courses.map((c) => c.id);
    expect(await ids('ins-1', 'instructor')).toEqual([1]);
    expect(await ids('oa-1', 'org_admin')).toEqual([2, 1]);
    expect(await ids('oa-2', 'org_admin')).toEqual([3]);
    expect(await ids('admin', 'admin')).toEqual([3, 2, 1]);
    expect(await errorCode(setupFor(world, 'u-1', 'user').listCourses())).toBe('FORBIDDEN');
  });

  it('apply refuses an instructor of another course, even with a validly signed proposal', async () => {
    const proposal = await setupFor(world, 'ins-1', 'instructor').proposeCourseTexts({
      courseId: 1,
      texts: { tagline: 'Neu' },
    });
    // Forge the same change for ins-2: the signature is valid, but ins-2 doesn't manage course 1.
    const payload = verifyProposal(proposal.proposedChangeId, SECRET);
    const forged = signProposal({ ...payload, userId: 'ins-2' }, SECRET);
    const result = setupFor(world, 'ins-2', 'instructor').applyProposedChange({ proposedChangeId: forged });
    expect(await errorCode(result)).toBe('NOT_FOUND');
    expect(world.courses[0].fields.tagline).toBe('Kurz');
  });

  it('apply refuses a proposal made by someone else', async () => {
    const proposal = await setupFor(world, 'ins-1', 'instructor').proposeCourseTexts({
      courseId: 1,
      texts: { tagline: 'Neu' },
    });
    const result = setupFor(world, 'oa-1', 'org_admin').applyProposedChange(proposal);
    expect(await errorCode(result)).toBe('FORBIDDEN');
    expect(world.courses[0].fields.tagline).toBe('Kurz');
  });

  it('refuses settings the role may not change in Hasura', async () => {
    const result = setupFor(world, 'ins-1', 'instructor').proposeCourseSettings({
      courseId: 1,
      settings: { applicationEnd: '2027-02-01' },
    });
    expect(await errorCode(result)).toBe('FORBIDDEN');
    await expect(
      setupFor(world, 'oa-1', 'org_admin').proposeCourseSettings({ courseId: 1, settings: { applicationEnd: '2027-02-01' } })
    ).resolves.toMatchObject({ status: 'PROPOSED' });
  });
});

describe('propose and apply', () => {
  it('a proposal saves nothing until it is applied', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const proposal = await setup.proposeCourseTexts({
      courseId: 1,
      language: 'de',
      texts: { tagline: 'Lerne, wie Maschinen lernen', title: 'Einführung in Machine Learning' },
    });
    expect(proposal).toMatchObject({
      status: 'PROPOSED',
      kind: 'course_texts',
      before: { tagline: 'Kurz' },
      after: { tagline: 'Lerne, wie Maschinen lernen' },
    });
    // The unchanged title is left out of the change.
    expect(proposal.after).not.toHaveProperty('title');
    expect(world.courses[0].fields.tagline).toBe('Kurz');

    await expect(setup.applyProposedChange(proposal)).resolves.toMatchObject({ status: 'APPLIED' });
    expect(world.courses[0].fields.tagline).toBe('Lerne, wie Maschinen lernen');
    expect(metrics).toEqual([
      { metric: 'mcp_proposal', event: 'created', kind: 'course_texts' },
      { metric: 'mcp_proposal', event: 'applied', kind: 'course_texts' },
    ]);
  });

  it('texts must be written in the course language', async () => {
    const result = setupFor(world, 'ins-1', 'instructor').proposeCourseTexts({
      courseId: 1,
      language: 'en',
      texts: { tagline: 'Learn how machines learn' },
    });
    expect(await errorCode(result)).toBe('INVALID');
  });

  it('normalizes settings and refuses a change that changes nothing', async () => {
    const setup = setupFor(world, 'oa-1', 'org_admin');
    const proposal = await setup.proposeCourseSettings({
      courseId: 1,
      settings: { startTime: '18:30', weekDay: 'thursday', maxParticipants: 20 },
    });
    expect(proposal.after).toEqual({ startTime: '18:30:00', weekDay: 'THURSDAY' });
    await setup.applyProposedChange(proposal);
    expect(world.courses[0].fields).toMatchObject({ startTime: '18:30:00', weekDay: 'THURSDAY' });

    expect(await errorCode(setup.proposeCourseSettings({ courseId: 1, settings: { startTime: '18:30' } }))).toBe(
      'NO_CHANGE'
    );
  });

  it('applying a stale proposal fails with a clear error', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const first = await setup.proposeCourseTexts({ courseId: 1, texts: { tagline: 'Erste Fassung' } });
    const second = await setup.proposeCourseSettings({ courseId: 1, settings: { maxParticipants: 30 } });
    await setup.applyProposedChange(first);

    await expect(setup.applyProposedChange(second)).rejects.toMatchObject({
      code: 'STALE',
      message: expect.stringContaining('has changed since this change was proposed'),
    });
    expect(world.courses[0].fields.maxParticipants).toBe(20);
  });

  it('a proposal cannot be applied twice', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const proposal = await setup.proposeCourseTexts({ courseId: 1, texts: { tagline: 'Neu' } });
    await setup.applyProposedChange(proposal);
    expect(await errorCode(setup.applyProposedChange(proposal))).toBe('STALE');
  });

  it('a Session change by someone else makes a Session proposal stale', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const mine = await setup.proposeSessions({ courseId: 1, deleteSessionIds: [12] });
    const theirs = await setupFor(world, 'oa-1', 'org_admin').proposeSessions({
      courseId: 1,
      changes: [{ sessionId: 11, title: 'Kick-off' }],
    });
    await setupFor(world, 'oa-1', 'org_admin').applyProposedChange(theirs);
    expect(await errorCode(setup.applyProposedChange(mine))).toBe('STALE');
  });

  it('refuses altered and expired proposals', async () => {
    let now = Date.parse('2026-11-22T10:00:00Z');
    const setup = setupFor(world, 'ins-1', 'instructor', () => now);
    const proposal = await setup.proposeCourseTexts({ courseId: 1, texts: { tagline: 'Neu' } });

    const [v, body, sig] = proposal.proposedChangeId.split('.');
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    const altered = `${v}.${Buffer.from(JSON.stringify({ ...payload, courseId: 3 })).toString('base64url')}.${sig}`;
    expect(await errorCode(setup.applyProposedChange({ proposedChangeId: altered }))).toBe('INVALID');

    now += 25 * 60 * 60 * 1000;
    expect(await errorCode(setup.applyProposedChange(proposal))).toBe('EXPIRED');
    await expect(setup.discardProposedChange(proposal)).resolves.toMatchObject({ status: 'DISCARDED' });
  });

  it('discarding saves nothing', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const proposal = await setup.proposeCourseTexts({ courseId: 1, texts: { tagline: 'Neu' } });
    await expect(setup.discardProposedChange(proposal)).resolves.toMatchObject({ status: 'DISCARDED' });
    expect(world.courses[0].fields.tagline).toBe('Kurz');
    expect(metrics.map((m) => m.event)).toEqual(['created']);
  });
});

describe('Sessions', () => {
  it('can be added, changed and deleted while nobody has registered', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const proposal = await setup.proposeSessions({
      courseId: 1,
      sessions: [{ ...newSession, locations: [{ courseLocationId: 101 }] }],
      changes: [{ sessionId: 11, title: 'Kick-off', locations: [{ courseLocationId: 100, address: 'https://zoom.example/j/2' }] }],
      deleteSessionIds: [12],
    });
    expect(proposal.after).toEqual({
      sessions: [
        expect.objectContaining({
          id: 11,
          title: 'Kick-off',
          locations: [{ courseLocationId: 100, address: 'https://zoom.example/j/2', locationAddressId: null }],
        }),
        expect.objectContaining({
          id: null,
          title: 'Neuronale Netze',
          locations: [{ courseLocationId: 101, address: 'Wall 47-51, 24103 Kiel', locationAddressId: 1 }],
        }),
      ],
    });
    expect(world.courses[0].sessions.map((s) => s.id)).toEqual([11, 12]);

    await setup.applyProposedChange(proposal);
    expect(world.courses[0].sessions.map((s) => s.title)).toEqual(['Kick-off', 'Neuronale Netze']);
  });

  it('new Sessions default to every location option of the course', async () => {
    const proposal = await setupFor(world, 'ins-1', 'instructor').proposeSessions({ courseId: 1, sessions: [newSession] });
    expect((proposal.after as { sessions: { locations: unknown[] }[] }).sessions[0].locations).toHaveLength(2);
  });

  it('are refused at propose once anyone has registered', async () => {
    for (const [userId, role] of [
      ['ins-2', 'instructor'],
      ['oa-1', 'org_admin'],
      ['admin', 'admin'],
    ]) {
      const result = setupFor(world, userId, role).proposeSessions({ courseId: 2, sessions: [newSession] });
      await expect(result).rejects.toMatchObject({
        code: 'REGISTRATIONS_EXIST',
        message: expect.stringContaining('3 people have already registered'),
      });
    }
    expect(world.courses[1].sessions).toHaveLength(1);
  });

  it('are refused at apply when someone registered after the proposal', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    const proposal = await setup.proposeSessions({ courseId: 1, sessions: [newSession] });
    world.courses[0].registrations = 1; // e.g. an application arrives while the Organizer reads the proposal

    expect(await errorCode(setup.applyProposedChange(proposal))).toBe('REGISTRATIONS_EXIST');
    expect(world.courses[0].sessions).toHaveLength(2);
    expect(metrics.map((m) => m.event)).toEqual(['created']);
  });

  it('course texts and settings stay changeable after registrations', async () => {
    const setup = setupFor(world, 'ins-2', 'instructor');
    const proposal = await setup.proposeCourseTexts({ courseId: 2, texts: { tagline: 'New' } });
    await expect(setup.applyProposedChange(proposal)).resolves.toMatchObject({ status: 'APPLIED' });
  });

  it('refuses Sessions of another course, unknown location options and end before start', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    expect(await errorCode(setup.proposeSessions({ courseId: 1, deleteSessionIds: [21] }))).toBe('INVALID');
    expect(
      await errorCode(
        setup.proposeSessions({ courseId: 1, sessions: [{ ...newSession, locations: [{ courseLocationId: 200 }] }] })
      )
    ).toBe('INVALID');
    expect(
      await errorCode(
        setup.proposeSessions({
          courseId: 1,
          sessions: [{ ...newSession, endDateTime: '2027-01-26T17:00:00+01:00' }],
        })
      )
    ).toBe('INVALID');
    expect(await errorCode(setup.proposeSessions({ courseId: 1 }))).toBe('INVALID');
  });
});

describe('creating a course', () => {
  const draft = { programId: 10, title: 'Generative KI im Alltag' };
  const NOW = Date.parse('2026-11-22T10:00:00Z');

  it('an Org Admin proposes a course with the manage page defaults and applies it', async () => {
    const setup = setupFor(world, 'oa-1', 'org_admin', () => NOW);
    const proposal = await setup.proposeCreateCourse({
      ...draft,
      texts: { tagline: 'Was KI heute kann' },
      settings: { maxParticipants: 25 },
      locationOptions: ['online', 'KIEL'],
    });
    expect(proposal).toMatchObject({
      status: 'PROPOSED',
      kind: 'create_course',
      before: null,
      after: {
        program: { id: 10, title: 'Wintersemester' },
        title: 'Generative KI im Alltag',
        tagline: 'Was KI heute kann',
        language: 'DE',
        applicationEnd: '2027-01-31', // the program's default, as it is still in the future
        maxMissedSessions: 2,
        maxParticipants: 25,
        locationOptions: ['ONLINE', 'KIEL'],
      },
    });
    expect(world.courses).toHaveLength(3);

    const applied = await setup.applyProposedChange(proposal);
    expect(applied).toMatchObject({ status: 'APPLIED', kind: 'create_course', programId: 10 });
    const created = world.courses.find((c) => c.id === (applied as { courseId: number }).courseId);
    expect(created?.fields).toMatchObject({ title: 'Generative KI im Alltag', maxParticipants: 25 });
    expect(created?.courseLocations.map((l) => l.locationOption)).toEqual(['ONLINE', 'KIEL']);
    expect(metrics.map((m) => `${m.event}:${m.kind}`)).toEqual(['created:create_course', 'applied:create_course']);

    // The Organizer can now fill it in.
    await expect(
      setup.proposeCourseTexts({ courseId: created?.id as number, texts: { learningGoals: 'Prompts schreiben' } })
    ).resolves.toMatchObject({ status: 'PROPOSED' });
  });

  it('an admin can create courses in any program', async () => {
    const setup = setupFor(world, 'admin', 'admin');
    await expect(setup.proposeCreateCourse({ ...draft, programId: 20 })).resolves.toMatchObject({ status: 'PROPOSED' });
    expect((await setup.listPrograms()).programs.map((p) => p.id)).toEqual([10, 20]);
  });

  it('an instructor cannot create courses', async () => {
    const setup = setupFor(world, 'ins-1', 'instructor');
    expect(await errorCode(setup.proposeCreateCourse(draft))).toBe('FORBIDDEN');
    expect((await setup.listPrograms()).programs).toEqual([]);
  });

  it("an Org Admin cannot create a course in another organization's program", async () => {
    const setup = setupFor(world, 'oa-2', 'org_admin');
    expect(await errorCode(setup.proposeCreateCourse(draft))).toBe('NOT_FOUND');
    expect((await setup.listPrograms()).programs.map((p) => p.id)).toEqual([20]);
  });

  it('a plain user is refused', async () => {
    expect(await errorCode(setupFor(world, 'u-1', 'user').proposeCreateCourse(draft))).toBe('FORBIDDEN');
  });

  it('apply re-checks the rules: a forged create proposal for another program is refused', async () => {
    const proposal = await setupFor(world, 'oa-1', 'org_admin').proposeCreateCourse(draft);
    const payload = verifyProposal(proposal.proposedChangeId, SECRET);
    const forged = signProposal(
      { ...payload, userId: 'oa-2', changes: { ...(payload.changes as object), programId: 10 } } as typeof payload,
      SECRET
    );
    const result = setupFor(world, 'oa-2', 'org_admin').applyProposedChange({ proposedChangeId: forged });
    expect(await errorCode(result)).toBe('NOT_FOUND');
    expect(world.courses).toHaveLength(3);
  });

  it('applying the same create proposal twice creates only one course', async () => {
    const setup = setupFor(world, 'oa-1', 'org_admin');
    const proposal = await setup.proposeCreateCourse(draft);
    await setup.applyProposedChange(proposal);
    await expect(setup.applyProposedChange(proposal)).rejects.toMatchObject({
      code: 'ALREADY_APPLIED',
      message: expect.stringContaining('no second one was created'),
    });
    expect(world.courses).toHaveLength(4);
  });

  it('refuses unknown location options and columns the role may not set on insert', async () => {
    const setup = setupFor(world, 'oa-1', 'org_admin');
    expect(await errorCode(setup.proposeCreateCourse({ ...draft, locationOptions: ['MARS'] }))).toBe('INVALID');
    expect(
      await errorCode(setup.proposeCreateCourse({ ...draft, settings: { sessionReminderLeadHours: 48 } }))
    ).toBe('FORBIDDEN');
  });

  it('uses today as application end when the program default has passed', async () => {
    world.programs[0].defaultApplicationEnd = '2026-01-31';
    const proposal = await setupFor(world, 'oa-1', 'org_admin', () => NOW).proposeCreateCourse(draft);
    expect(proposal.after).toMatchObject({ applicationEnd: '2026-11-22' });
  });
});

describe('listing courses', () => {
  it('list_courses pages through all managed courses', async () => {
    const base = world.courses[0];
    for (let id = 100; id < 250; id++) world.courses.push({ ...structuredClone(base), id });
    const setup = setupFor(world, 'ins-1', 'instructor');
    const first = await setup.listCourses();
    expect(first).toMatchObject({ hasMore: true, nextBeforeId: 150 });
    expect(first.courses).toHaveLength(100);
    const second = await setup.listCourses({ beforeId: first.nextBeforeId });
    expect(second.hasMore).toBe(false);
    expect(second).not.toHaveProperty('nextBeforeId');
    expect([...first.courses, ...second.courses].map((c) => c.id)).toHaveLength(151);
  });
});
