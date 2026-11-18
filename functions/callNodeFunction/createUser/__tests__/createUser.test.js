import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

const del = jest.fn();
const KcAdminClient = jest.fn(() => ({ users: { del } }));
const authenticateKeycloakAdmin = jest.fn();
jest.unstable_mockModule('@keycloak/keycloak-admin-client', () => ({
  default: KcAdminClient,
}));
jest.unstable_mockModule('../../lib/keycloak.js', () => ({
  authenticateKeycloakAdmin,
}));
const { default: createUser } = await import('../index.js');

const logger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
const req = {
  body: { input: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' } },
};
const saved = {};
const ENV = ['HASURA_ENDPOINT', 'HASURA_ADMIN_SECRET', 'ENVIRONMENT'];

beforeEach(() => {
  jest.clearAllMocks();
  for (const name of ENV) saved[name] = process.env[name];
  delete process.env.HASURA_ENDPOINT;
  process.env.HASURA_ADMIN_SECRET = 'secret';
  process.env.ENVIRONMENT = 'production';
});

afterEach(() => {
  for (const name of ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

it('returns the normal failure response when HASURA_ENDPOINT is missing', async () => {
  await expect(createUser(req, logger)).resolves.toEqual({
    success: false,
    error:
      'An error occurred while creating the user. Please check the server logs for details.',
    messageKey: 'USER_CREATION_FAILED',
  });
  expect(authenticateKeycloakAdmin).not.toHaveBeenCalled();
  expect(del).not.toHaveBeenCalled();
});
