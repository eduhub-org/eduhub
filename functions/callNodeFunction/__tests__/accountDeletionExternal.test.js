import { afterEach, expect, it, jest } from '@jest/globals';

const post = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { post } }));
const { unsubscribeForAccountDeletion } = await import('../syncGhostNewsletterSubscription/index.js');
const { deactivateMatrixUser } = await import('../lib/matrixInvite.js');

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
  jest.clearAllMocks();
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

it('fails when the token is not a Synapse server admin', async () => {
  respond(403, { errcode: 'M_FORBIDDEN', error: 'You are not a server admin' });
  await expect(deactivateMatrixUser(args)).rejects.toThrow('You are not a server admin');
});
