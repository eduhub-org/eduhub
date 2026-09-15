import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const logoRequest = (sessionVariables, organizationid = 7) => ({
  headers: { bucket: 'test-bucket' },
  body: {
    session_variables: sessionVariables,
    input: { base64file: 'aGVsbG8=', filename: 'logo.png', organizationid },
  },
});

const grantResponse = (ownGrant, settingsAdminCount) => ({
  ownGrant,
  settingsAdmins: { aggregate: { count: settingsAdminCount } },
});

describe('saveOrganizationLogo', () => {
  let saveOrganizationLogo;
  let saveImageMock;
  let requestMock;
  let deleteFileMock;

  beforeAll(async () => {
    saveImageMock = jest.fn(async () => ({
      success: true,
      filePath: 'organizations/org-7/public/logo/logo.png',
    }));

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
    jest.unstable_mockModule('@google-cloud/storage', () => ({ Storage: jest.fn() }));
    jest.unstable_mockModule('../../lib/cloud-storage.js', () => ({
      buildCloudStorage: () => ({ deleteFile: (...args) => deleteFileMock(...args) }),
    }));

    const module = await import('../index.js');
    saveOrganizationLogo = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    saveImageMock.mockResolvedValue({ success: true, filePath: 'organizations/org-7/public/logo/logo.png' });
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    requestMock = jest.fn(async () => ({ update_Organization_by_pk: { id: 7, logo: null } }));
    deleteFileMock = jest.fn().mockResolvedValue(undefined);
  });

  it('uploads and persists for a super-admin without looking for a grant', async () => {
    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(saveImageMock).toHaveBeenCalledTimes(1);
    // No grant lookup, only the persisting mutation.
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [, persistVariables] = requestMock.mock.calls[0];
    expect(persistVariables).toEqual({ organizationId: 7, logo: 'organizations/org-7/public/logo/logo.png' });
  });

  it('uploads and persists for an org admin who may manage that organization settings', async () => {
    requestMock = jest
      .fn()
      .mockResolvedValueOnce(grantResponse([{ id: 3, canManageSettings: true, canManageJobs: false }], 1))
      .mockResolvedValueOnce({ update_Organization_by_pk: { id: 7, logo: 'organizations/org-7/public/logo/logo.png' } });

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    const [, grantVariables] = requestMock.mock.calls[0];
    expect(grantVariables).toEqual({ organizationId: 7, userId: 'user-1' });
    expect(saveImageMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('uploads and persists for a job-only admin when the organization has no settings admin', async () => {
    requestMock = jest
      .fn()
      .mockResolvedValueOnce(grantResponse([{ id: 4, canManageSettings: false, canManageJobs: true }], 0))
      .mockResolvedValueOnce({ update_Organization_by_pk: { id: 7, logo: 'organizations/org-7/public/logo/logo.png' } });

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: true });
    expect(saveImageMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('refuses a job-only admin once the organization already has a settings admin', async () => {
    requestMock = jest.fn().mockResolvedValueOnce(grantResponse([{ id: 4, canManageSettings: false, canManageJobs: true }], 1));

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'user' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'UNAUTHORIZED' });
    expect(saveImageMock).not.toHaveBeenCalled();
  });

  it('refuses a caller without any grant for that organization', async () => {
    requestMock = jest.fn().mockResolvedValueOnce(grantResponse([], 0));

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

  it('does not persist the column when the upload itself fails', async () => {
    saveImageMock.mockResolvedValue({ success: false, messageKey: 'IMAGE_SAVE_ERROR' });

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'IMAGE_SAVE_ERROR' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('cleans up the upload and fails when the persisting mutation throws', async () => {
    saveImageMock.mockResolvedValue({
      success: true,
      filePath: 'organizations/org-7/public/logo/logo.png',
      resizedPaths: [{ size: 64, filePath: 'organizations/org-7/public/logo/logo-64.webp' }],
    });
    requestMock = jest.fn().mockRejectedValue(new Error('connection reset'));

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'IMAGE_SAVE_ERROR' });
    expect(deleteFileMock).toHaveBeenCalledWith('organizations/org-7/public/logo/logo.png', 'test-bucket');
    expect(deleteFileMock).toHaveBeenCalledWith('organizations/org-7/public/logo/logo-64.webp', 'test-bucket');
  });

  it('cleans up the upload and fails when the organization no longer exists', async () => {
    saveImageMock.mockResolvedValue({ success: true, filePath: 'organizations/org-7/public/logo/logo.png' });
    requestMock = jest.fn().mockResolvedValue({ update_Organization_by_pk: null });

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'ORGANIZATION_NOT_FOUND' });
    expect(deleteFileMock).toHaveBeenCalledWith('organizations/org-7/public/logo/logo.png', 'test-bucket');
  });

  it('does not fail the request when cleanup itself throws', async () => {
    requestMock = jest.fn().mockRejectedValue(new Error('connection reset'));
    deleteFileMock = jest.fn().mockRejectedValue(new Error('storage unavailable'));

    const result = await saveOrganizationLogo(
      logoRequest({ 'x-hasura-user-id': 'user-1', 'x-hasura-role': 'admin' }),
      mockLogger
    );

    expect(result).toMatchObject({ success: false, messageKey: 'IMAGE_SAVE_ERROR' });
  });
});
