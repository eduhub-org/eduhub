import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

process.env.IMPERSONATION_TOKEN_SECRET = 'test-impersonation-secret';
process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

const mockRequest = jest.fn();
const mockClient = jest.fn();
jest.mock('graphql-request', () => ({
  gql: (strings: TemplateStringsArray) => strings.join(''),
  GraphQLClient: jest.fn().mockImplementation((url: string, options: unknown) => {
    mockClient(url, options);
    return { request: (...args: unknown[]) => mockRequest(...args) };
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { encodeCookie, IMPERSONATION_COOKIE } = require('../../../../helpers/impersonation');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('../../../../pages/api/certificates/download').default;

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const TARGET = '11111111-1111-1111-1111-111111111111';
const ADMIN = '22222222-2222-2222-2222-222222222222';
const PATH = `certificates/user-${TARGET}/achievement.pdf`;

const request = (cookie?: string): NextApiRequest =>
  ({
    method: 'GET',
    query: { path: PATH },
    headers: { host: 'edu.test', ...(cookie ? { cookie } : {}) },
  } as unknown as NextApiRequest);

const response = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn(), redirect: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & { status: jest.Mock; redirect: jest.Mock };
};

const signingHeaders = () =>
  (mockClient.mock.calls.at(-1)?.[1] as { headers: Record<string, string> }).headers;

describe('certificate download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue({
      accessToken: 'admin-token',
      profile: {
        'https://hasura.io/jwt/claims': {
          'x-hasura-allowed-roles': ['user', 'admin'],
          'x-hasura-user-id': ADMIN,
        },
      },
    } as never);
  });

  it('signs with the caller’s own token when not viewing as anyone', async () => {
    mockRequest.mockResolvedValueOnce({ getSignedUrl: { link: 'https://storage.test/signed' } });
    const res = response();
    await handler(request(), res);

    expect(signingHeaders()).toEqual({ Authorization: 'Bearer admin-token', 'x-hasura-role': 'admin' });
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://storage.test/signed');
  });

  it('signs as the viewed user during an open impersonation', async () => {
    mockRequest
      .mockResolvedValueOnce({ ImpersonationSession: [{ id: 7, targetUserId: TARGET, TargetUser: null }] })
      .mockResolvedValueOnce({ getSignedUrl: { link: 'https://storage.test/signed' } });
    const res = response();
    await handler(
      request(`${IMPERSONATION_COOKIE}=${encodeCookie({ targetUserId: TARGET, sessionId: 7, iat: Date.now() })}`),
      res
    );

    expect(signingHeaders()).toEqual({
      'x-hasura-admin-secret': 'test-admin-secret',
      'x-hasura-role': 'user',
      'x-hasura-user-id': TARGET,
    });
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://storage.test/signed');
  });

  it('falls back to the caller when the impersonation has ended', async () => {
    mockRequest
      .mockResolvedValueOnce({ ImpersonationSession: [] })
      .mockResolvedValueOnce({ getSignedUrl: { link: 'https://storage.test/signed' } });
    const res = response();
    await handler(
      request(`${IMPERSONATION_COOKIE}=${encodeCookie({ targetUserId: TARGET, sessionId: 7, iat: Date.now() })}`),
      res
    );

    expect(signingHeaders()).toEqual({ Authorization: 'Bearer admin-token', 'x-hasura-role': 'admin' });
  });

  it('returns 404 when the viewed user may not open the file', async () => {
    mockRequest
      .mockResolvedValueOnce({ ImpersonationSession: [{ id: 7, targetUserId: TARGET, TargetUser: null }] })
      .mockResolvedValueOnce({ getSignedUrl: { link: null } });
    const res = response();
    await handler(
      request(`${IMPERSONATION_COOKIE}=${encodeCookie({ targetUserId: TARGET, sessionId: 7, iat: Date.now() })}`),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
