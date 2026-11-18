import { jest } from '@jest/globals';

// The three entry points deployed from this code route only their own
// handlers (callNodeFunction also the moved ones, for one release).
describe('entry points', () => {
  let entryPoints;
  const createUserMock = jest.fn();
  const signedUrlMock = jest.fn();

  const response = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  const call = async (entryPoint, headers) => {
    const res = response();
    await entryPoints[entryPoint]({ headers, body: { input: {}, request_query: 'mutation { a }' } }, res);
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };

  const headers = (functionName) => ({ 'function-name': functionName, 'hasura-secret': 'test-secret' });

  beforeAll(async () => {
    jest.unstable_mockModule('../createUser/index.js', () => ({ default: createUserMock }));
    jest.unstable_mockModule('../getSignedUrl/index.js', () => ({ default: signedUrlMock }));
    entryPoints = await import('../index.js');
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
    createUserMock.mockReset().mockResolvedValue({ success: true, messageKey: 'USER_CREATED' });
    signedUrlMock.mockReset().mockResolvedValue({ success: true, messageKey: 'URL_SIGNED' });
  });

  it.each([
    ['identity', 'createUser'],
    ['media', 'getSignedUrl'],
    ['callNodeFunction', 'createUser'],
    ['callNodeFunction', 'getSignedUrl'],
  ])('%s routes %s', async (entryPoint, functionName) => {
    const { status, body } = await call(entryPoint, headers(functionName));

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it.each([
    ['identity', 'getSignedUrl'],
    ['identity', 'sendEnrollmentEmail'],
    ['media', 'createUser'],
    ['media', 'sendEnrollmentEmail'],
  ])('%s answers 404 for %s', async (entryPoint, functionName) => {
    const { status, body } = await call(entryPoint, headers(functionName));

    expect(status).toBe(404);
    expect(body.messageKey).toBe('FUNCTION_NOT_FOUND');
    expect(createUserMock).not.toHaveBeenCalled();
    expect(signedUrlMock).not.toHaveBeenCalled();
  });

  it.each(['identity', 'media'])('%s answers 401 without the secret', async (entryPoint) => {
    const { status } = await call(entryPoint, { 'function-name': 'createUser' });

    expect(status).toBe(401);
  });

  it.each(['identity', 'media'])('%s accepts the legacy header names', async (entryPoint) => {
    const functionName = entryPoint === 'identity' ? 'createUser' : 'getSignedUrl';
    const { status } = await call(entryPoint, { name: functionName, secret: 'test-secret' });

    expect(status).toBe(200);
  });
});
