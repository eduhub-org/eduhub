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
const {
  decodeCookie,
  encodeCookie,
  endImpersonation,
  COOKIE_MAX_AGE_SECONDS,
  IMPERSONATION_COOKIE,
} = require('./impersonation');

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const ADMIN = '22222222-2222-2222-2222-222222222222';
const TARGET = '11111111-1111-1111-1111-111111111111';

const cookieAged = (ageMs: number) => encodeCookie({ targetUserId: TARGET, sessionId: 7, iat: Date.now() - ageMs });

const request = (cookie: string): NextApiRequest =>
  ({ headers: { host: 'edu.test', cookie: `${IMPERSONATION_COOKIE}=${cookie}` } }) as unknown as NextApiRequest;

const response = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & { setHeader: jest.Mock };
};

const EXPIRED_BY_A_SECOND = COOKIE_MAX_AGE_SECONDS * 1000 + 1000;

describe('decodeCookie', () => {
  it('refuses an expired cookie', () => {
    expect(decodeCookie(cookieAged(EXPIRED_BY_A_SECOND))).toBeNull();
  });

  it('returns an expired cookie when the caller asks to ignore the expiry', () => {
    expect(decodeCookie(cookieAged(EXPIRED_BY_A_SECOND), { ignoreExpiry: true })).toMatchObject({
      targetUserId: TARGET,
      sessionId: 7,
    });
  });

  it('still refuses a forged cookie when the expiry is ignored', () => {
    const [body] = cookieAged(EXPIRED_BY_A_SECOND).split('.');
    expect(decodeCookie(`${body}.not-the-signature`, { ignoreExpiry: true })).toBeNull();
  });
});

describe('endImpersonation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue({
      profile: {
        'https://hasura.io/jwt/claims': {
          'x-hasura-allowed-roles': ['user', 'admin'],
          'x-hasura-user-id': ADMIN,
        },
      },
    } as never);
    mockRequest.mockResolvedValue({ update_ImpersonationSession: { affected_rows: 1 } });
  });

  it('closes the audit row', async () => {
    const res = response();
    await endImpersonation(request(cookieAged(0)), res);

    const [, variables] = mockRequest.mock.calls[0];
    expect(variables).toEqual({ id: 7, adminUserId: ADMIN });
  });

  // The cookie stopped authorising anything an hour in -- the proxy has been
  // refusing it since -- but it is still the only thing that names the row this
  // admin left open. Leaving it open would say the admin never stopped reading.
  it('closes the audit row even when the cookie has expired', async () => {
    const res = response();
    await endImpersonation(request(cookieAged(EXPIRED_BY_A_SECOND)), res);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const [, variables] = mockRequest.mock.calls[0];
    expect(variables).toEqual({ id: 7, adminUserId: ADMIN });
  });

  it('clears both cookies and closes nothing when the cookie is forged', async () => {
    const [body] = cookieAged(0).split('.');
    const res = response();
    await endImpersonation(request(`${body}.not-the-signature`), res);

    expect(mockRequest).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.any(Array));
  });

  it('closes nothing for a caller who is not a super-admin', async () => {
    mockedGetToken.mockResolvedValue({
      profile: {
        'https://hasura.io/jwt/claims': {
          'x-hasura-allowed-roles': ['user'],
          'x-hasura-user-id': ADMIN,
        },
      },
    } as never);
    const res = response();
    await endImpersonation(request(cookieAged(0)), res);

    expect(mockRequest).not.toHaveBeenCalled();
  });
});
