import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('graphql-request', () => ({
  GraphQLClient: jest.fn(() => ({ request })),
}));
const { default: createMatrixRoom } = await import('../index.js');

const realFetch = global.fetch;
const realEnv = { ...process.env };
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

const req = {
  body: {
    session_variables: { 'x-hasura-role': 'admin' },
    input: { courseId: 7, roomName: 'Kurs 7' },
  },
};

// Hasura: course 7 in program 3, which already has a space, with one instructor.
const hasuraResponses = {
  GetCourseContext: {
    Course_by_pk: {
      id: 7,
      title: 'Kurs 7',
      matrixRoomId: null,
      Program: { id: 3, shortTitle: 'P3', matrixSpaceId: '!space:test' },
    },
  },
  GetCourseInstructors: { CourseInstructor: [{ User: { matrixUserHandle: 'ina.lehr.abc123' } }] },
  SetCourseRoomIfEmpty: { update_Course: { affected_rows: 1, returning: [] } },
};

/** Fake homeserver whose default room version is `defaultVersion`. */
const mockHomeserver = (defaultVersion) => {
  global.fetch = jest.fn(async (url) => {
    if (url.endsWith('/capabilities')) {
      return jsonResponse({ capabilities: { 'm.room_versions': { default: defaultVersion } } });
    }
    if (url.endsWith('/createRoom')) return jsonResponse({ room_id: '!course:test' });
    return jsonResponse({});
  });
};

const createRoomBody = () => {
  const [, init] = global.fetch.mock.calls.find(([url]) => url.endsWith('/createRoom'));
  return JSON.parse(init.body);
};

const powerLevelUsers = (body) =>
  body.initial_state.find((event) => event.type === 'm.room.power_levels').content.users;

beforeEach(() => {
  Object.assign(process.env, {
    HASURA_ENDPOINT: 'http://hasura.test/v1/graphql',
    HASURA_ADMIN_SECRET: 'secret',
    MATRIX_HOMESERVER_URL: 'https://matrix.test',
    MATRIX_ADMIN_ACCESS_TOKEN: 'bot-token',
    MATRIX_ELEMENT_CLIENT_URL: 'https://element.test',
    MATRIX_MAIN_SPACE_ID: '!main:test',
    MATRIX_ADMIN_USER_ID: '@bot:test',
    MATRIX_SERVER_NAME: 'test',
  });
  request.mockImplementation(async ({ document }) => {
    const name = Object.keys(hasuraResponses).find((key) => document.includes(key));
    return hasuraResponses[name];
  });
});

afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...realEnv };
  jest.clearAllMocks();
});

it('leaves the creating bot out of power_levels.users in room version 12', async () => {
  mockHomeserver('12');

  const result = await createMatrixRoom(req, logger);

  expect(result).toMatchObject({ success: true, roomId: '!course:test' });
  const body = createRoomBody();
  expect(body.room_version).toBe('12');
  expect(powerLevelUsers(body)).toEqual({ '@ina.lehr.abc123:test': 50 });
});

it('keeps the bot at power level 100 in room versions before 12', async () => {
  mockHomeserver('11');

  const result = await createMatrixRoom(req, logger);

  expect(result).toMatchObject({ success: true, roomId: '!course:test' });
  const body = createRoomBody();
  expect(body.room_version).toBe('11');
  expect(powerLevelUsers(body)).toEqual({ '@bot:test': 100, '@ina.lehr.abc123:test': 50 });
});
