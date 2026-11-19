import { jest } from '@jest/globals';

describe('getSignedUrl', () => {
  let getSignedUrl;
  let media;
  const loadFromBucket = jest.fn();

  const actionRequest = (path, role, userId = 'user-1') => ({
    headers: { 'function-name': 'getSignedUrl', 'hasura-secret': 'test-secret', bucket: 'test-bucket' },
    body: {
      input: { path },
      session_variables: { 'x-hasura-role': role, 'x-hasura-user-id': userId },
    },
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  beforeAll(async () => {
    jest.unstable_mockModule('../../lib/cloud-storage.js', () => ({
      buildCloudStorage: () => ({ loadFromBucket }),
    }));
    ({ default: getSignedUrl } = await import('../index.js'));
    ({ media } = await import('../../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    loadFromBucket.mockReset();
  });

  it('returns the link for an admin', async () => {
    loadFromBucket.mockResolvedValue('https://signed.example/file');
    const result = await getSignedUrl(actionRequest('courses/1/private/x.pdf', 'admin'));
    expect(result).toMatchObject({ success: true, link: 'https://signed.example/file' });
    expect(result.httpStatus).toBeUndefined();
  });

  it('answers 403 with a Hasura error when access is denied', async () => {
    const res = mockRes();
    await media(actionRequest('other-user/1/attendance_certificate.pdf', 'user'), res);
    expect(loadFromBucket).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    const body = res.json.mock.calls[0][0];
    expect(body).toMatchObject({
      success: false,
      messageKey: 'FILE_ACCESS_DENIED',
      message: 'You do not have permission to access this file.',
      extensions: { code: 'FILE_ACCESS_DENIED' },
    });
    expect(body.httpStatus).toBeUndefined();
  });

  it('answers 400 with a Hasura error when the file cannot be loaded', async () => {
    loadFromBucket.mockRejectedValue(new Error('No such object'));
    const res = mockRes();
    await media(actionRequest('courses/1/private/x.pdf', 'admin'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      messageKey: 'FILE_LOAD_ERROR',
      extensions: { code: 'FILE_LOAD_ERROR' },
    });
  });
});
