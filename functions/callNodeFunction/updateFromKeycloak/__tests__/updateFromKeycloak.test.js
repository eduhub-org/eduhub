import { jest } from '@jest/globals';

const USER_ID = '6a1b2c3d-0000-4000-8000-000000000001';

const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

const keycloakUser = (overrides = {}) => ({
  id: USER_ID,
  username: 'alex@beispiel.de',
  firstName: 'Alex',
  lastName: 'Beispiel',
  email: 'alex@beispiel.de',
  attributes: { matrix_user_handle: ['alex.beispiel.6a1b2c'] },
  ...overrides,
});

describe('updateFromKeycloak', () => {
  let updateFromKeycloak;
  let identity;
  let requestMock;
  const kc = {
    auth: jest.fn(),
    setConfig: jest.fn(),
    users: { findOne: jest.fn(), update: jest.fn() },
  };

  const actionRequest = (headers = {}) => ({
    headers,
    body: {
      action: { name: 'updateFromKeycloak' },
      input: { userid: USER_ID },
      session_variables: { 'x-hasura-role': 'user', 'x-hasura-user-id': USER_ID },
      request_query: 'mutation update_User($id: ID!) { updateFromKeycloak(userid: $id) { result } }',
    },
  });

  /** Hasura's answers by query, so each test states the database it needs. */
  const database = ({ row = null, holders = [], updatedRows = 1, insertError = null } = {}) =>
    jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('User_by_pk')) return { User_by_pk: row };
      if (query.includes('insert_User')) {
        if (insertError) throw insertError;
        return { insert_User: { returning: [{ id: USER_ID }] } };
      }
      if (query.includes('update_User')) return { update_User: { affected_rows: updatedRows } };
      if (query.includes('User(')) return { User: holders };
      throw new Error(`Unexpected query: ${query.slice(0, 60)}`);
    });

  beforeAll(async () => {
    jest.unstable_mockModule('@keycloak/keycloak-admin-client', () => ({
      default: jest.fn().mockImplementation(() => kc),
    }));
    jest.unstable_mockModule('graphql-request', () => {
      const actual = jest.requireActual('graphql-request');
      return {
        ...actual,
        GraphQLClient: jest.fn().mockImplementation(() => ({
          request: (...args) => requestMock(...args),
        })),
      };
    });
    ({ default: updateFromKeycloak } = await import('../index.js'));
    ({ identity } = await import('../../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    process.env.KEYCLOAK_URL = 'http://keycloak:8080';
    process.env.KEYCLOAK_PW = 'kc-password';
    kc.auth.mockReset().mockResolvedValue(undefined);
    kc.users.findOne.mockReset().mockResolvedValue(keycloakUser());
    kc.users.update.mockReset().mockResolvedValue(undefined);
    requestMock = database();
  });

  it('creates the User row on the first login', async () => {
    const result = await updateFromKeycloak(actionRequest(), logger);

    expect(result).toEqual({ result: 'updateFromKeycloak function finished' });
    const insert = requestMock.mock.calls.find(([document]) => String(document).includes('insert_User'));
    expect(insert[1]).toMatchObject({ id: USER_ID, email: 'alex@beispiel.de', matrixUserHandle: 'alex.beispiel.6a1b2c' });
    expect(kc.auth).toHaveBeenCalledWith(expect.objectContaining({ password: 'kc-password', clientId: 'admin-cli' }));
  });

  it('updates an existing row and keeps its Matrix handle', async () => {
    requestMock = database({ row: { id: USER_ID, status: 'ACTIVE', matrixUserHandle: 'kept.handle.6a1b2c' } });

    const result = await updateFromKeycloak(actionRequest(), logger);

    expect(result.result).toBe('updateFromKeycloak function finished');
    const update = requestMock.mock.calls.find(
      ([document]) => String(document).includes('update_User') && String(document).includes('firstName')
    );
    expect(update[1].matrixUserHandle).toBe('kept.handle.6a1b2c');
  });

  it('backfills a missing Matrix handle in Keycloak', async () => {
    kc.users.findOne.mockResolvedValue(keycloakUser({ attributes: {} }));

    await updateFromKeycloak(actionRequest(), logger);

    expect(kc.users.update).toHaveBeenCalledWith(
      { id: USER_ID },
      expect.objectContaining({ attributes: { matrix_user_handle: ['alex.beispiel.6a1b2c'] } })
    );
  });

  it.each([
    ['a deleted account', () => { requestMock = database({ row: { id: USER_ID, status: 'DELETED' } }); }, 403],
    ['an unknown Keycloak user', () => { kc.users.findOne.mockResolvedValue(undefined); }, 404],
    ['a failed lookup', () => { requestMock = jest.fn(async () => { throw new Error('down'); }); }, 500],
    ['a failed insert', () => { requestMock = database({ insertError: new Error('conflict') }); }, 400],
    ['an account deleted during the sync', () => {
      requestMock = database({ row: { id: USER_ID, status: 'ACTIVE' }, updatedRows: 0 });
    }, 403],
    ['a Keycloak login failure', () => { kc.auth.mockRejectedValue(new Error('401')); }, 500],
  ])('fails with an HTTP error for %s', async (_label, arrange, status) => {
    arrange();

    const result = await updateFromKeycloak(actionRequest(), logger);

    expect(result.httpStatus).toBe(status);
    expect(result.success).toBe(false);
    expect(typeof result.message).toBe('string');
  });

  describe('through the identity unit', () => {
    const response = () => {
      const res = {};
      res.status = jest.fn(() => res);
      res.json = jest.fn(() => res);
      return res;
    };
    const call = async (request) => {
      const res = response();
      await identity(request, res);
      return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
    };

    it('answers the action with the result', async () => {
      const { status, body } = await call(
        actionRequest({ 'hasura-secret': 'test-secret', 'function-name': 'updateFromKeycloak' })
      );

      expect(status).toBe(200);
      expect(body).toEqual({ result: 'updateFromKeycloak function finished' });
    });

    it('answers 401 without the secret', async () => {
      const { status } = await call(actionRequest({ 'function-name': 'updateFromKeycloak' }));

      expect(status).toBe(401);
      expect(kc.users.findOne).not.toHaveBeenCalled();
    });

    it('answers 403 for a deleted account as a GraphQL error body', async () => {
      requestMock = database({ row: { id: USER_ID, status: 'DELETED' } });
      const { status, body } = await call(actionRequest({ 'hasura-secret': 'test-secret' }));

      expect(status).toBe(403);
      expect(body).toEqual({ success: false, message: 'Account deleted', error: 'Account deleted' });
    });

    // forward_client_headers: a caller's own routing header must not pick
    // another identity handler for this action.
    it('rejects a forwarded header naming another handler', async () => {
      const { status } = await call(
        actionRequest({ 'hasura-secret': 'test-secret', 'function-name': 'updateAdminUser' })
      );

      expect(status).toBe(400);
      expect(kc.users.findOne).not.toHaveBeenCalled();
    });
  });
});
