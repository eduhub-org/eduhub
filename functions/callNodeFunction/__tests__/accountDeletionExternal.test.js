import { afterEach, expect, it, jest } from '@jest/globals';

const post = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { post } }));
const { unsubscribeForAccountDeletion } = await import('../syncGhostNewsletterSubscription/index.js');
const { deactivateMatrixUser, getMatrixDeactivationConfig } = await import('../lib/matrixInvite.js');

const realFetch = global.fetch;
const realEnv = { ...process.env };
afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...realEnv };
  jest.clearAllMocks();
});

it('uses the dedicated Synapse admin token, not the room bot token, for deactivation', () => {
  Object.assign(process.env, {
    MATRIX_HOMESERVER_URL: 'https://matrix.test/', MATRIX_SERVER_NAME: 'test',
    MATRIX_ADMIN_ACCESS_TOKEN: 'bot', MATRIX_SYNAPSE_ADMIN_TOKEN: 'synapse-admin',
  });
  expect(getMatrixDeactivationConfig()).toMatchObject({ homeserverUrl: 'https://matrix.test', token: 'synapse-admin' });
  delete process.env.MATRIX_SYNAPSE_ADMIN_TOKEN;
  expect(getMatrixDeactivationConfig().token).toBeNull();
});

it('does not need the room bot token to deactivate Matrix accounts', () => {
  Object.assign(process.env, {
    MATRIX_HOMESERVER_URL: 'https://matrix.test', MATRIX_SERVER_NAME: 'test',
    MATRIX_SYNAPSE_ADMIN_TOKEN: 'synapse-admin',
  });
  delete process.env.MATRIX_ADMIN_ACCESS_TOKEN;
  expect(getMatrixDeactivationConfig()).toMatchObject({ token: 'synapse-admin', serverName: 'test' });
});

it('lets deletion continue for a never-synced subscription without Ghost configuration', async () => {
  await expect(unsubscribeForAccountDeletion({ status: 'ERROR', externalSubscriberId: null, Organization: {} }, 'a@b.c'))
    .resolves.toBeUndefined();
  expect(post).not.toHaveBeenCalled();
});

it('still blocks deletion for a synced subscription without Ghost configuration', async () => {
  await expect(unsubscribeForAccountDeletion({ status: 'SUBSCRIBED', externalSubscriberId: 'm1', Organization: {} }, 'a@b.c'))
    .rejects.toThrow('Newsletter configuration missing');
});

const respond = (status, body = {}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 300, status, headers: { get: () => null }, json: async () => body,
  });
};
const args = { homeserverUrl: 'https://matrix.test', token: 'mx', matrixUserId: '@a.b.123456:test' };

it('erases the Matrix account through the Synapse admin API', async () => {
  respond(200, { id_server_unbind_result: 'success' });
  await expect(deactivateMatrixUser(args)).resolves.toEqual({ deactivated: true });
  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('https://matrix.test/_synapse/admin/v1/deactivate/%40a.b.123456%3Atest');
  expect(JSON.parse(init.body)).toEqual({ erase: true });
});

it('treats a Matrix account that never existed as done', async () => {
  respond(404, { errcode: 'M_NOT_FOUND' });
  await expect(deactivateMatrixUser(args)).resolves.toEqual({ deactivated: false, skipped: true });
});

it('fails on a 404 that is not Synapse reporting an unknown user', async () => {
  respond(404, { errcode: 'M_UNRECOGNIZED' });
  await expect(deactivateMatrixUser(args)).rejects.toThrow('HTTP 404');
});

it('fails when the token is not a Synapse server admin', async () => {
  respond(403, { errcode: 'M_FORBIDDEN', error: 'You are not a server admin' });
  await expect(deactivateMatrixUser(args)).rejects.toThrow('You are not a server admin');
});
