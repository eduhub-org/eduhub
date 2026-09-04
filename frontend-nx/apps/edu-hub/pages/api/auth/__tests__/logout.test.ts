import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import handler from '../logout';

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const token = (idToken?: string) => ({
  name: 'StuJo employer',
  email: 'employer@example.com',
  sub: 'user-1',
  accessTokenExpired: 0,
  refreshTokenExpired: 0,
  idToken,
});

const response = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe('logout API', () => {
  const originalEnv = process.env;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_URL: 'https://stujo.example',
      NEXT_PUBLIC_AUTH_URL: 'https://login.example',
    };
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    warn.mockRestore();
    error.mockRestore();
    jest.clearAllMocks();
  });

  it('returns the Keycloak end-session URL for a complete token', async () => {
    mockedGetToken.mockResolvedValue(token('token-value'));
    const res = response();

    await handler({} as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      url:
        'https://login.example/realms/edu-hub/protocol/openid-connect/logout?' +
        'id_token_hint=token-value&post_logout_redirect_uri=https%3A%2F%2Fstujo.example',
    });
  });

  it('falls back to the app when the token has no id_token', async () => {
    mockedGetToken.mockResolvedValue(token());
    const res = response();

    await handler({} as NextApiRequest, res);

    expect(res.json).toHaveBeenCalledWith({ url: 'https://stujo.example' });
  });

  it('falls back to the app when reading the token fails', async () => {
    mockedGetToken.mockRejectedValue(new Error('invalid cookie'));
    const res = response();

    await handler({} as NextApiRequest, res);

    expect(res.json).toHaveBeenCalledWith({ url: 'https://stujo.example' });
  });
});
