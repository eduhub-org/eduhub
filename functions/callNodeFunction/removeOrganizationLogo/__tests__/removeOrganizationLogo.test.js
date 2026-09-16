import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const removeRequest = (sessionVariables, organizationid = 7) => ({
  body: {
    session_variables: sessionVariables,
    input: { organizationid },
  },
});

const grantResponse = (ownGrant, settingsAdminCount) => ({
  ownGrant,
  settingsAdmins: { aggregate: { count: settingsAdminCount } },
});

describe('removeOrganizationLogo', () => {
  let removeOrganizationLogo;
  let requestMock;

  beforeAll(async () => {
    jest.unstable_mockModule('graphql-request', () => {
      const actual = jest.requireActual('graphql-request');
      return {
        ...actual,
        GraphQLClient: jest.fn().mockImplementation(() => ({
          request: (...args) => requestMock(...args),
        })),
      };
    });

    const module = await import('../index.js');
    removeOrganizationLogo = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    requestMock = jest.fn(async () => ({ update_Organization_by_pk: { id: 7, logo: null } }));
  });

  it('clears the logo for a super-admin without looking for a grant', async () => {
    const result = await removeOrganizationLogo(
      removeRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [, variables] = requestMock.mock.calls[0];
    expect(variables).toEqual({ organizationId: 7 });
  });

  it('clears the logo for an org admin who may manage that organization settings', async () => {
    requestMock = jest
      .fn()
      .mockResolvedValueOnce(grantResponse([{ id: 3, canManageSettings: true, canManageJobs: false }], 1))
      .mockResolvedValueOnce({ update_Organization_by_pk: { id: 7, logo: null } });

    const result = await removeOrganizationLogo(
      removeRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('clears the logo for a job-only admin when the organization has no settings admin', async () => {
    requestMock = jest
      .fn()
      .mockResolvedValueOnce(grantResponse([{ id: 4, canManageSettings: false, canManageJobs: true }], 0))
      .mockResolvedValueOnce({ update_Organization_by_pk: { id: 7, logo: null } });

    const result = await removeOrganizationLogo(
      removeRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('refuses a job-only admin once the organization already has a settings admin', async () => {
    requestMock = jest.fn().mockResolvedValueOnce(grantResponse([{ id: 4, canManageSettings: false, canManageJobs: true }], 1));

    const result = await removeOrganizationLogo(
      removeRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
  });

  it('refuses an unauthenticated caller', async () => {
    const result = await removeOrganizationLogo(removeRequest({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or unusable organization id', async () => {
    const result = await removeOrganizationLogo(
      removeRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }, 'not-a-number'),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'INVALID_INPUT' });
    expect(requestMock).not.toHaveBeenCalled();
  });
});
