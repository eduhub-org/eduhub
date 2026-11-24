/**
 * @jest-environment node
 */
import { OperationError } from '../mcp/errors';
import { createCourseSetup } from '../mcp/operations';
import { createFakeCourseStore, createWorld, FakeWorld } from '../mcp/testing/fakeCourseStore';
import { createProposalsHandler } from './proposals';
import { mockHttp, session } from './testing/helpers';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const SECRET = 'test-secret';

const setup = (world: FakeWorld, userId = 'ins-1') =>
  createProposalsHandler({
    getSession: async () => session({ userId, allowedRoles: ['user', 'instructor'] }),
    courseSetup: (s, role) => createCourseSetup({ store: createFakeCourseStore(world, s.userId, role), secret: SECRET }),
  });

const propose = async (world: FakeWorld, userId = 'ins-1') =>
  createCourseSetup({ store: createFakeCourseStore(world, userId, 'instructor'), secret: SECRET }).proposeCourseTexts({
    courseId: 1,
    texts: { tagline: 'Neue Tagline' },
  });

const post = async (world: FakeWorld, body: unknown, role = 'instructor', userId = 'ins-1') => {
  const http = mockHttp(body, { 'x-hasura-role': role });
  await setup(world, userId)(http.req, http.res);
  return http;
};

it('applies a Proposed Change on the Organizer\'s click', async () => {
  const world = createWorld();
  const { proposedChangeId } = await propose(world);
  const http = await post(world, { proposedChangeId, action: 'apply' });
  expect(http.status).toBe(200);
  expect(http.json).toEqual(expect.objectContaining({ status: 'APPLIED', kind: 'course_texts', courseId: 1 }));
  expect(world.courses.find((c) => c.id === 1)?.fields.tagline).toBe('Neue Tagline');
});

it('discards without saving', async () => {
  const world = createWorld();
  const { proposedChangeId } = await propose(world);
  const http = await post(world, { proposedChangeId, action: 'discard' });
  expect(http.status).toBe(200);
  expect(http.json).toEqual(expect.objectContaining({ status: 'DISCARDED' }));
  expect(world.courses.find((c) => c.id === 1)?.fields.tagline).not.toBe('Neue Tagline');
});

it('refuses a tampered proposal, another user\'s proposal and a role the token lacks', async () => {
  const world = createWorld();
  const { proposedChangeId } = await propose(world);

  const tampered = await post(world, { proposedChangeId: `${proposedChangeId}x`, action: 'apply' });
  expect(tampered.status).toBeGreaterThanOrEqual(400);
  expect(tampered.json.error?.code).toBeTruthy();

  const otherUser = await post(world, { proposedChangeId, action: 'apply' }, 'instructor', 'ins-2');
  expect(otherUser.status).toBeGreaterThanOrEqual(400);

  const admin = await post(world, { proposedChangeId, action: 'apply' }, 'admin');
  expect(admin.status).toBe(403);
  expect(admin.json.error?.code).toBe('ROLE_NOT_ALLOWED');

  expect(world.courses.find((c) => c.id === 1)?.fields.tagline).not.toBe('Neue Tagline');
});

it('answers STALE with 409 when the course changed since the proposal', async () => {
  const world = createWorld();
  const { proposedChangeId } = await propose(world);
  const second = await propose(world);
  await post(world, { proposedChangeId: second.proposedChangeId, action: 'apply' });
  const http = await post(world, { proposedChangeId, action: 'apply' });
  expect(http.status).toBe(409);
  expect(http.json.error?.code).toBe('STALE');
});

it('answers in the asker\'s locale and never passes on the operation\'s own message', async () => {
  const failing = (error: Error) =>
    createProposalsHandler({
      getSession: async () => session({ userId: 'ins-1', allowedRoles: ['user', 'instructor'] }),
      courseSetup: () =>
        ({
          applyProposedChange: async () => {
            throw error;
          },
        } as unknown as ReturnType<typeof createCourseSetup>),
    });
  const raw = 'check constraint of an insert/update permission has failed';

  const hasura = mockHttp({ proposedChangeId: 'p', action: 'apply', locale: 'de' }, { 'x-hasura-role': 'instructor' });
  await failing(new OperationError('HASURA_ERROR', raw))(hasura.req, hasura.res);
  expect(hasura.status).toBe(502);
  expect(hasura.json.error?.code).toBe('HASURA_ERROR');
  expect(hasura.json.error?.message).toContain('Die Änderung konnte nicht gespeichert werden');
  expect(hasura.json.error?.message).not.toContain(raw);

  const crash = mockHttp({ proposedChangeId: 'p', action: 'apply', locale: 'en' }, { 'x-hasura-role': 'instructor' });
  await failing(new Error(raw))(crash.req, crash.res);
  expect(crash.status).toBe(500);
  expect(crash.json.error).toEqual({ code: 'INTERNAL', message: expect.stringContaining('Something went wrong while saving') });
  expect(crash.json.error?.message).not.toContain(raw);
});
