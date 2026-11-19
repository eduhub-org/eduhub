import { jest } from '@jest/globals';

const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
const USER_ID = 'user-1';

describe('removeKeycloakRole', () => {
  let removeKeycloakRole;
  let identity;
  let requestMock;
  const kc = {
    auth: jest.fn(),
    setConfig: jest.fn(),
    clients: { find: jest.fn() },
    users: { listClientRoleMappings: jest.fn(), delClientRoleMappings: jest.fn() },
  };

  const deleteEvent = (headers = { role: 'org_admin' }, userId = USER_ID) => ({
    headers,
    body: { event: { op: 'DELETE', data: { old: { id: 7, userId }, new: null } } },
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
    ({ default: removeKeycloakRole } = await import('../index.js'));
    ({ identity } = await import('../../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    requestMock = jest.fn(async () => ({ OrganizationAdmin: [], CourseInstructor: [] }));
    kc.auth.mockReset().mockResolvedValue(undefined);
    kc.clients.find.mockReset().mockResolvedValue([{ id: 'hasura-client-uuid' }]);
    kc.users.listClientRoleMappings.mockReset().mockResolvedValue([{ id: 'role-1', name: 'org_admin' }]);
    kc.users.delClientRoleMappings.mockReset().mockResolvedValue(undefined);
  });

  it('revokes the role once the last grant is gone', async () => {
    const result = await removeKeycloakRole(deleteEvent(), logger);

    expect(kc.users.delClientRoleMappings).toHaveBeenCalledWith({
      id: USER_ID,
      clientUniqueId: 'hasura-client-uuid',
      roles: [{ id: 'role-1', name: 'org_admin' }],
    });
    expect(result).toMatchObject({ success: true });
  });

  it('keeps the role while another grant remains', async () => {
    requestMock = jest.fn(async () => ({ OrganizationAdmin: [{ id: 3 }] }));

    const result = await removeKeycloakRole(deleteEvent(), logger);

    expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/keeping 'org_admin'/);
  });

  it('is a no-op for a role the user does not hold', async () => {
    kc.users.listClientRoleMappings.mockResolvedValue([]);

    const result = await removeKeycloakRole(deleteEvent(), logger);

    expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it.each([
    ['no userId', () => deleteEvent({ role: 'org_admin' }, null), 400],
    ['no role header', () => deleteEvent({}), 400],
    ['unreadable remaining grants', () => {
      requestMock = jest.fn(async () => { throw new Error('down'); });
      return deleteEvent();
    }, 500],
    ['a missing hasura client', () => {
      kc.clients.find.mockResolvedValue([]);
      return deleteEvent();
    }, 500],
    ['a Keycloak error', () => {
      kc.auth.mockRejectedValue(new Error('401'));
      return deleteEvent();
    }, 500],
  ])('fails with %s', async (_label, arrange, status) => {
    const result = await removeKeycloakRole(arrange(), logger);

    expect(result.httpStatus).toBe(status);
    expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
  });

  describe('through the identity unit', () => {
    const call = async (headers) => {
      const res = {};
      res.status = jest.fn(() => res);
      res.json = jest.fn(() => res);
      await identity(deleteEvent(headers), res);
      return res.status.mock.calls[0][0];
    };

    it('runs with the secret and the role header', async () => {
      const status = await call({ 'hasura-secret': 'test-secret', 'function-name': 'removeKeycloakRole', role: 'org_admin' });

      expect(status).toBe(200);
      expect(kc.users.delClientRoleMappings).toHaveBeenCalledTimes(1);
    });

    it('answers 401 with a wrong secret', async () => {
      const status = await call({ 'hasura-secret': 'wrong', 'function-name': 'removeKeycloakRole', role: 'org_admin' });

      expect(status).toBe(401);
      expect(kc.users.delClientRoleMappings).not.toHaveBeenCalled();
    });
  });
});
