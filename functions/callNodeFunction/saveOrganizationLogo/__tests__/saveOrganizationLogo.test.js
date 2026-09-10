import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const logoRequest = (sessionVariables, organizationid = 7) => ({
  body: {
    session_variables: sessionVariables,
    input: { base64file: 'aGVsbG8=', filename: 'logo.png', organizationid },
  },
});

describe('saveOrganizationLogo', () => {
  let saveOrganizationLogo;
  let saveImageMock;
  let requestMock;

  beforeAll(async () => {
    saveImageMock = jest.fn(async () => ({ success: true, filePath: 'organizations/org-7/public/logo/logo.png' }));

    jest.unstable_mockModule('../../saveImage/index.js', () => ({ default: saveImageMock }));
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
    saveOrganizationLogo = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    saveImageMock.mockResolvedValue({ success: true });
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    requestMock = jest.fn(async () => ({ OrganizationAdmin: [] }));
  });

  it('uploads for a super-admin without looking for a grant', async () => {
    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(requestMock).not.toHaveBeenCalled();
    expect(saveImageMock).toHaveBeenCalledTimes(1);
  });

  it('uploads for an org admin who may manage that organization settings', async () => {
    requestMock = jest.fn(async () => ({ OrganizationAdmin: [{ id: 3 }] }));

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    const [, variables] = requestMock.mock.calls[0];
    expect(variables).toEqual({ organizationId: 7, userId: 'user-1' });
    expect(saveImageMock).toHaveBeenCalledTimes(1);
  });

  it('refuses a caller without canManageSettings for that organization', async () => {
    requestMock = jest.fn(async () => ({ OrganizationAdmin: [] }));

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(saveImageMock).not.toHaveBeenCalled();
  });

  it('refuses an unauthenticated caller', async () => {
    const result = await saveOrganizationLogo(logoRequest({}), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(requestMock).not.toHaveBeenCalled();
    expect(saveImageMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or unusable organization id before touching storage', async () => {
    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }, 'not-a-number'),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'INVALID_INPUT' });
    expect(saveImageMock).not.toHaveBeenCalled();
  });
});
