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
const { decodeCookie, IMPERSONATION_COOKIE } = require('../../../../helpers/impersonation');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { IMPERSONATION_MARKER_COOKIE } = require('../../../../helpers/impersonationMarker');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('../start').default;

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const ADMIN = '22222222-2222-2222-2222-222222222222';
const TARGET = '11111111-1111-1111-1111-111111111111';

const tokenFor = (roles: string[]) => ({
  profile: {
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': roles,
      'x-hasura-user-id': ADMIN,
    },
  },
});

const request = (body: unknown, headers: Record<string, string> = {}): NextApiRequest =>
  ({ method: 'POST', headers: { host: 'edu.test', ...headers }, body } as unknown as NextApiRequest);

const response = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & { setHeader: jest.Mock; status: jest.Mock; json: jest.Mock };
};

describe('impersonation start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue(tokenFor(['user', 'instructor', 'admin']) as never);
    mockRequest
      .mockResolvedValueOnce({ User_by_pk: { id: TARGET, firstName: 'Ada', lastName: 'L', email: 'a@e.test' } })
      .mockResolvedValueOnce({ insert_ImpersonationSession_one: { id: 42 } });
  });

  it('refuses a caller who is not a super-admin', async () => {
    mockedGetToken.mockResolvedValue(tokenFor(['user', 'instructor']) as never);
    const res = response();
    await handler(request({ userId: TARGET }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.setHeader).not.toHaveBeenCalledWith('Set-Cookie', expect.anything());
  });

  it('refuses impersonating yourself', async () => {
    const res = response();
    await handler(request({ userId: ADMIN }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('reports an unknown user as not found', async () => {
    mockRequest.mockReset().mockResolvedValueOnce({ User_by_pk: null });
    const res = response();
    await handler(request({ userId: TARGET }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('records the session and sets an httpOnly cookie naming the target', async () => {
    const res = response();
    await handler(request({ userId: TARGET }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const [, cookies] = res.setHeader.mock.calls.find(([name]) => name === 'Set-Cookie') as [
      string,
      string[]
    ];
    const signed = cookies.find((c) => c.startsWith(`${IMPERSONATION_COOKIE}=`)) as string;
    expect(signed).toContain('HttpOnly');
    expect(signed).toContain('SameSite=Lax');

    const value = signed.split(';')[0].split('=').slice(1).join('=');
    expect(decodeCookie(decodeURIComponent(value))).toMatchObject({
      targetUserId: TARGET,
      sessionId: 42,
    });

    // The readable marker exists so the browser can route through the proxy
    // before it has asked the server anything. It must carry no authority.
    const marker = cookies.find((c) => c.startsWith(`${IMPERSONATION_MARKER_COOKIE}=`)) as string;
    expect(marker).toContain('=1;');
    expect(marker).not.toContain('HttpOnly');
  });
});
