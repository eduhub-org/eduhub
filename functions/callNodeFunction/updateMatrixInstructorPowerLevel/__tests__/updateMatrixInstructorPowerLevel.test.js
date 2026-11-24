import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  GraphQLClient: jest.fn(() => ({ request })),
}));
const { default: updateMatrixInstructorPowerLevel } = await import('../index.js');

const realFetch = global.fetch;
const realEnv = { ...process.env };
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

// Course room as createMatrixRoom sets it up: settings that only the bot may change.
const currentPowerLevels = {
  users: { '@other.lehr:test': 50 },
  users_default: 0,
  events_default: 0,
  state_default: 50,
  events: {
    'm.room.encryption': 100,
    'm.room.power_levels': 100,
    'm.room.join_rules': 100,
    'm.room.history_visibility': 100,
    'm.room.tombstone': 100,
    'm.room.server_acl': 100,
  },
  redact: 50,
  ban: 50,
  kick: 50,
  invite: 0,
};

const hasuraResponses = {
  GetCourseMatrixAndProgram: { Course_by_pk: { id: 7, matrixRoomId: '!course:test', Program: null } },
  GetUserMatrixHandle: { User_by_pk: { id: 'u1', matrixUserHandle: 'ina.lehr.abc123' } },
};

const eventFor = (op) => {
  const row = { courseId: 7, userId: 'u1' };
  return { body: { event: { op, data: op === 'INSERT' ? { new: row } : { old: row } } } };
};

const writtenPowerLevels = () => {
  const [, init] = global.fetch.mock.calls.find(([, options]) => options?.method === 'PUT');
  return JSON.parse(init.body);
};

beforeEach(() => {
  Object.assign(process.env, {
    HASURA_ENDPOINT: 'http://hasura.test/v1/graphql',
    HASURA_ADMIN_SECRET: 'secret',
    MATRIX_HOMESERVER_URL: 'https://matrix.test',
    MATRIX_ADMIN_ACCESS_TOKEN: 'bot-token',
    MATRIX_ADMIN_USER_ID: '@bot:test',
    MATRIX_SERVER_NAME: 'test',
  });
  request.mockImplementation(async ({ document }) => {
    const name = Object.keys(hasuraResponses).find((key) => document.includes(key));
    return hasuraResponses[name];
  });
  global.fetch = jest.fn(async (_url, options) =>
    options?.method === 'PUT' ? jsonResponse({ event_id: '$pl' }) : jsonResponse(structuredClone(currentPowerLevels))
  );
});

afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...realEnv };
  jest.clearAllMocks();
});

it('keeps the bot-only settings when it makes someone an instructor', async () => {
  const result = await updateMatrixInstructorPowerLevel(eventFor('INSERT'), logger);

  expect(result).toMatchObject({ success: true, messageKey: 'MATRIX_INSTRUCTOR_POWER_LEVEL_UPDATED' });
  const written = writtenPowerLevels();
  expect(written.users).toEqual({ '@other.lehr:test': 50, '@ina.lehr.abc123:test': 50 });
  expect(written.events).toEqual(currentPowerLevels.events);
  expect(written.state_default).toBe(50);
});

it('keeps the bot-only settings when it removes an instructor', async () => {
  hasuraResponses.GetUserMatrixHandle.User_by_pk.matrixUserHandle = 'other.lehr';
  try {
    const result = await updateMatrixInstructorPowerLevel(eventFor('DELETE'), logger);

    expect(result).toMatchObject({ success: true, messageKey: 'MATRIX_INSTRUCTOR_POWER_LEVEL_UPDATED' });
    const written = writtenPowerLevels();
    expect(written.users).toEqual({});
    expect(written.events).toEqual(currentPowerLevels.events);
  } finally {
    hasuraResponses.GetUserMatrixHandle.User_by_pk.matrixUserHandle = 'ina.lehr.abc123';
  }
});
