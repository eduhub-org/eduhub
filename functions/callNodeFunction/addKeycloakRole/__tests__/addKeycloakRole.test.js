import { jest } from '@jest/globals';

const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
const USER_ID = 'user-1';

describe('addKeycloakRole', () => {
  let addKeycloakRole;
  let identity;
  const addRoleMock = jest.fn();

  const eventRequest = (headers = { role: 'org_admin' }, userId = USER_ID) => ({
    headers,
    body: { event: { op: 'INSERT', data: { old: null, new: { id: 7, userId } } } },
  });

  beforeAll(async () => {
    jest.unstable_mockModule('../../lib/keycloakClientRole.js', () => ({
      addKeycloakClientRole: addRoleMock,
    }));
    ({ default: addKeycloakRole } = await import('../index.js'));
    ({ identity } = await import('../../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    addRoleMock.mockReset().mockResolvedValue({ granted: true, reason: 'ADDED' });
  });

  it('grants the role named in the role header to the row user', async () => {
    const result = await addKeycloakRole(eventRequest(), logger);

    expect(addRoleMock).toHaveBeenCalledWith(USER_ID, 'org_admin', logger);
    expect(result).toEqual({ success: true, messageKey: 'KEYCLOAK_ROLE_ADDED' });
  });

  it('is a no-op for a role the user already holds', async () => {
    addRoleMock.mockResolvedValue({ granted: true, reason: 'ALREADY_ASSIGNED' });

    const result = await addKeycloakRole(eventRequest(), logger);

    expect(result).toEqual({ success: true, messageKey: 'KEYCLOAK_ROLE_ALREADY_ASSIGNED' });
  });

  it.each([
    ['a role not defined on the client', () => addRoleMock.mockResolvedValue({ granted: false, reason: 'ROLE_UNKNOWN' }), 'KEYCLOAK_ROLE_UNKNOWN'],
    ['missing Keycloak credentials', () => addRoleMock.mockResolvedValue({ granted: false, reason: 'KEYCLOAK_NOT_CONFIGURED' }), 'KEYCLOAK_ROLE_GRANT_FAILED'],
    ['a Keycloak error', () => addRoleMock.mockRejectedValue(new Error('timeout')), 'KEYCLOAK_ROLE_GRANT_FAILED'],
  ])('answers 500 for %s so the trigger retries', async (_label, arrange, messageKey) => {
    arrange();

    const result = await addKeycloakRole(eventRequest(), logger);

    expect(result).toMatchObject({ httpStatus: 500, success: false, messageKey });
  });

  it.each([
    ['no role header', eventRequest({})],
    ['no userId', eventRequest({ role: 'instructor' }, null)],
  ])('answers 400 for %s', async (_label, request) => {
    const result = await addKeycloakRole(request, logger);

    expect(result.httpStatus).toBe(400);
    expect(addRoleMock).not.toHaveBeenCalled();
  });

  describe('through the identity unit', () => {
    const call = async (headers) => {
      const res = {};
      res.status = jest.fn(() => res);
      res.json = jest.fn(() => res);
      await identity(eventRequest(headers), res);
      return res.status.mock.calls[0][0];
    };

    it('runs with the secret and the role header', async () => {
      const status = await call({ 'hasura-secret': 'test-secret', 'function-name': 'addKeycloakRole', role: 'instructor' });

      expect(status).toBe(200);
      expect(addRoleMock).toHaveBeenCalledWith(USER_ID, 'instructor', expect.anything());
    });

    it('answers 401 without the secret', async () => {
      const status = await call({ 'function-name': 'addKeycloakRole', role: 'admin' });

      expect(status).toBe(401);
      expect(addRoleMock).not.toHaveBeenCalled();
    });

    it('answers 500 to Hasura for an undefined role', async () => {
      addRoleMock.mockResolvedValue({ granted: false, reason: 'ROLE_UNKNOWN' });
      const status = await call({ 'hasura-secret': 'test-secret', 'function-name': 'addKeycloakRole', role: 'nope' });

      expect(status).toBe(500);
    });
  });
});
