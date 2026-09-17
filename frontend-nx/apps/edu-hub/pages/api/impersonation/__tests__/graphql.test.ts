import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

process.env.IMPERSONATION_TOKEN_SECRET = 'test-impersonation-secret';
process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
process.env.GRAPHQL_URI = 'http://hasura.test/v1/graphql';

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

const mockRequest = jest.fn();
jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({ request: (...args: unknown[]) => mockRequest(...args) })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { encodeCookie, IMPERSONATION_COOKIE } = require('../../../../helpers/impersonation');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('../graphql').default;

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const TARGET = '11111111-1111-1111-1111-111111111111';
const ADMIN = '22222222-2222-2222-2222-222222222222';

const tokenFor = (roles: string[]) => ({
  profile: {
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': roles,
      'x-hasura-user-id': ADMIN,
    },
  },
});

const validCookie = () =>
  `${IMPERSONATION_COOKIE}=${encodeCookie({ targetUserId: TARGET, sessionId: 7, iat: Date.now() })}`;

const request = (overrides: Partial<NextApiRequest> = {}): NextApiRequest =>
  ({
    method: 'POST',
    headers: { host: 'edu.test', cookie: validCookie() },
    body: { query: '{ Course { id } }' },
    ...overrides,
  } as unknown as NextApiRequest);

const response = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & { setHeader: jest.Mock; status: jest.Mock; json: jest.Mock };
};

describe('impersonation GraphQL proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue(tokenFor(['user', 'instructor', 'admin']) as never);
    mockRequest.mockResolvedValue({
      ImpersonationSession: [{ id: 7, targetUserId: TARGET, TargetUser: null }],
    });
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: { Course: [] } }),
    }) as unknown as typeof fetch;
  });

  it('refuses anything but POST', async () => {
    const res = response();
    await handler(request({ method: 'GET' }), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('refuses a cross-origin request', async () => {
    const res = response();
    await handler(
      request({ headers: { host: 'edu.test', origin: 'https://evil.test', cookie: validCookie() } } as never),
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('refuses a caller without a session', async () => {
    mockedGetToken.mockResolvedValue(null);
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses a caller who is not a super-admin', async () => {
    mockedGetToken.mockResolvedValue(tokenFor(['user', 'instructor']) as never);
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses a tampered cookie', async () => {
    const res = response();
    await handler(
      request({ headers: { host: 'edu.test', cookie: `${IMPERSONATION_COOKIE}=forged.signature` } } as never),
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses a mutation while read-only', async () => {
    const res = response();
    await handler(request({ body: { query: 'mutation { insert_Course_one(object: {}) { id } }' } } as never), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [expect.objectContaining({ extensions: { code: 'IMPERSONATION_READ_ONLY' } })],
      })
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses a subscription while read-only', async () => {
    const res = response();
    await handler(request({ body: { query: 'subscription { Course { id } }' } } as never), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses once the recorded session has been closed', async () => {
    mockRequest.mockResolvedValue({ ImpersonationSession: [] });
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards a query as the target user, with no client headers', async () => {
    const res = response();
    await handler(request(), res);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [uri, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(uri).toBe('http://hasura.test/v1/graphql');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': 'test-admin-secret',
      'x-hasura-role': 'user',
      'x-hasura-user-id': TARGET,
    });
    expect(JSON.parse(init.body)).toEqual({
      query: '{ Course { id } }',
      variables: {},
      operationName: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
