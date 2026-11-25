import { safeReturnTo } from './config';
import {
  abandonMatrixLogin,
  completeMatrixLogin,
  logoutAllMatrixSessions,
  logoutMatrix,
  MatrixLoginError,
  parseMatrixCallback,
  startMatrixLogin,
} from './oauth';
import { loadMatrixSession, saveMatrixSession, takePendingMatrixLogin } from './session';

const metadata = { issuer: 'https://auth.test/', authorization_endpoint: 'https://auth.test/authorize' };
const registerClient = jest.fn(async () => 'client-1');
const generateAuthorizationCodeGrantUrl = jest.fn(async (state: string) => `https://auth.test/authorize?state=${state}`);
const completeAuthorizationCodeGrant = jest.fn(async () => ({
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  expires_in: 300,
  token_type: 'Bearer',
}));
const revokeToken = jest.fn(async () => undefined);
const oauthContexts: Array<{ clientId: string; deviceId?: string; codeVerifier?: string }> = [];
const whoami = jest.fn(async () => ({ user_id: '@ina.lehr.abc123:test', device_id: 'DEVICE1' }));
const logout = jest.fn(async () => ({}));
const createClient = jest.fn(() => ({ getAuthMetadata: async () => metadata, whoami, logout }));

jest.mock('matrix-js-sdk', () => {
  class OAuth2 {
    static registerClient = (...args: unknown[]) => registerClient(...(args as []));
    context: { clientId: string; deviceId: string; codeVerifier: string };
    constructor(_metadata: unknown, context: { clientId: string; deviceId?: string; codeVerifier?: string }) {
      oauthContexts.push(context);
      this.context = {
        clientId: context.clientId,
        deviceId: context.deviceId ?? 'NEWDEVICE',
        codeVerifier: context.codeVerifier ?? 'verifier-1',
      };
    }
    generateAuthorizationCodeGrantUrl = (...args: unknown[]) => generateAuthorizationCodeGrantUrl(...(args as [string]));
    completeAuthorizationCodeGrant = (...args: unknown[]) => completeAuthorizationCodeGrant(...(args as []));
    revokeToken = (...args: unknown[]) => revokeToken(...(args as []));
  }
  return { OAuth2, createClient: (...args: unknown[]) => createClient(...(args as [])) };
});

const origin = 'https://edu.test';
const realEnv = process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL = 'https://matrix.test/';
  window.localStorage.clear();
  window.sessionStorage.clear();
  oauthContexts.length = 0;
  jest.clearAllMocks();
});

afterAll(() => {
  process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL = realEnv;
});

const stateOf = (url: string) => new URL(url).searchParams.get('state') as string;

describe('safeReturnTo', () => {
  it('keeps paths on this site', () => {
    expect(safeReturnTo('/course/12')).toBe('/course/12');
  });

  it('rejects anything that could leave the site', () => {
    expect(safeReturnTo('https://evil.example')).toBe('/');
    expect(safeReturnTo('//evil.example')).toBe('/');
    expect(safeReturnTo('/\\evil.example')).toBe('/');
    expect(safeReturnTo(undefined)).toBe('/');
  });
});

describe('parseMatrixCallback', () => {
  it('reads code and state from the fragment', () => {
    expect(parseMatrixCallback('#code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz', error: undefined });
  });

  it('reads an error from the fragment', () => {
    expect(parseMatrixCallback('#error=access_denied&state=xyz').error).toBe('access_denied');
  });
});

describe('startMatrixLogin', () => {
  it('fails clearly when no homeserver is configured', async () => {
    delete process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL;
    await expect(startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin })).rejects.toMatchObject({
      reason: 'NOT_CONFIGURED',
    });
  });

  it('registers the client once and remembers what the callback needs', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });
    await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });

    expect(registerClient).toHaveBeenCalledTimes(1);
    expect(registerClient).toHaveBeenCalledWith(
      metadata,
      expect.objectContaining({ client_uri: 'https://edu.test/', redirect_uris: ['https://edu.test/matrix/callback'] })
    );
    expect(generateAuthorizationCodeGrantUrl).toHaveBeenCalledWith(
      expect.any(String),
      'https://edu.test/matrix/callback',
      'fragment'
    );
    expect(takePendingMatrixLogin(stateOf(url))).toMatchObject({
      eduHubUserId: 'u1',
      homeserverUrl: 'https://matrix.test',
      clientId: 'client-1',
      codeVerifier: 'verifier-1',
      returnTo: '/course/12',
    });
  });

  it('reuses the device of an earlier session instead of creating a new one', async () => {
    saveMatrixSession('u1', {
      homeserverUrl: 'https://matrix.test',
      userId: '@ina.lehr.abc123:test',
      deviceId: 'OLDDEVICE',
      accessToken: 'expired',
      oauthClientId: 'client-1',
      issuer: metadata.issuer,
    });

    await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    expect(oauthContexts[0].deviceId).toBe('OLDDEVICE');
  });

  it('never stores an off-site return path', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: 'https://evil.example', origin });
    expect(takePendingMatrixLogin(stateOf(url))?.returnTo).toBe('/');
  });

  describe('with a client id configured for the deployment', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MATRIX_OAUTH_CLIENT_ID = ' fixed-client ';
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_MATRIX_OAUTH_CLIENT_ID;
    });

    it('uses it and never registers a client', async () => {
      const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

      expect(registerClient).not.toHaveBeenCalled();
      expect(oauthContexts[0].clientId).toBe('fixed-client');
      expect(takePendingMatrixLogin(stateOf(url))?.clientId).toBe('fixed-client');
    });

    it('prefers it over a client registered earlier in this browser', async () => {
      delete process.env.NEXT_PUBLIC_MATRIX_OAUTH_CLIENT_ID;
      await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });
      process.env.NEXT_PUBLIC_MATRIX_OAUTH_CLIENT_ID = 'fixed-client';

      await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

      expect(oauthContexts.map((context) => context.clientId)).toEqual(['client-1', 'fixed-client']);
    });
  });
});

describe('completeMatrixLogin', () => {
  it('exchanges the code with the PKCE verifier and stores the session', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });

    const result = await completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin });

    expect(oauthContexts[1]).toEqual({ clientId: 'client-1', deviceId: 'NEWDEVICE', codeVerifier: 'verifier-1' });
    expect(completeAuthorizationCodeGrant).toHaveBeenCalledWith('code-1', 'https://edu.test/matrix/callback');
    expect(result.returnTo).toBe('/course/12');
    expect(loadMatrixSession('u1')).toMatchObject({
      userId: '@ina.lehr.abc123:test',
      deviceId: 'DEVICE1',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      oauthClientId: 'client-1',
    });
  });

  it('ends the previous session when logging in again, so it cannot outlive a logout', async () => {
    saveMatrixSession('u1', {
      homeserverUrl: 'https://matrix.test',
      userId: '@ina.lehr.abc123:test',
      deviceId: 'DEVICE1',
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      oauthClientId: 'client-1',
      issuer: metadata.issuer,
    });
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    await completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin });

    expect(revokeToken).toHaveBeenCalledWith('old-refresh', 'refresh_token');
    expect(revokeToken).toHaveBeenCalledWith('old-access', 'access_token');
    expect(loadMatrixSession('u1')?.accessToken).toBe('access-1');
  });

  it('still logs in when the previous session cannot be revoked', async () => {
    saveMatrixSession('u1', {
      homeserverUrl: 'https://matrix.test',
      userId: '@ina.lehr.abc123:test',
      deviceId: 'DEVICE1',
      accessToken: 'old-access',
      oauthClientId: 'client-1',
      issuer: metadata.issuer,
    });
    revokeToken.mockRejectedValue(new Error('already gone'));
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    await completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin });

    expect(loadMatrixSession('u1')?.accessToken).toBe('access-1');
    revokeToken.mockResolvedValue(undefined);
  });

  it('discards a Matrix account that is not the signed-in user\'s own', async () => {
    // The auth server's browser session still belongs to the previous person.
    whoami.mockResolvedValueOnce({ user_id: '@admin.admin.8914be:test', device_id: 'DEVICE1' });
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    await expect(
      completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin })
    ).rejects.toMatchObject({ reason: 'WRONG_MATRIX_ACCOUNT', message: '@admin.admin.8914be:test' });
    expect(revokeToken).toHaveBeenCalledWith('refresh-1', 'refresh_token');
    expect(revokeToken).toHaveBeenCalledWith('access-1', 'access_token');
    expect(loadMatrixSession('u1')).toBeNull();
  });

  it('refuses the login when the expected Matrix account is unknown', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    await expect(
      completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: null, origin })
    ).rejects.toMatchObject({ reason: 'WRONG_MATRIX_ACCOUNT' });
    expect(loadMatrixSession('u1')).toBeNull();
  });

  it('accepts a state only once', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });
    await completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin });

    await expect(
      completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin })
    ).rejects.toMatchObject({ reason: 'UNKNOWN_STATE' });
  });

  it('does not hand a login started by one EduHub user to another', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/', origin });

    await expect(
      completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u2', expectedMatrixHandle: 'someone.else.def456', origin })
    ).rejects.toBeInstanceOf(MatrixLoginError);
    expect(loadMatrixSession('u2')).toBeNull();
  });

  describe('when it fails, it says where the user wanted to go', () => {
    const login = async (returnTo: string) => {
      const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo, origin });
      return completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u1', expectedMatrixHandle: 'ina.lehr.abc123', origin });
    };

    it('for a login the auth server refused', async () => {
      completeAuthorizationCodeGrant.mockRejectedValueOnce(new Error('invalid_grant'));
      await expect(login('/course/12')).rejects.toMatchObject({ reason: 'EXCHANGE_FAILED', returnTo: '/course/12' });
    });

    it('for the wrong Matrix account', async () => {
      whoami.mockResolvedValueOnce({ user_id: '@admin.admin.8914be:test', device_id: 'DEVICE1' });
      await expect(login('/course/12')).rejects.toMatchObject({
        reason: 'WRONG_MATRIX_ACCOUNT',
        message: '@admin.admin.8914be:test',
        returnTo: '/course/12',
      });
    });

    it('for an unexpected error, e.g. the homeserver is unreachable', async () => {
      whoami.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const failure = login('/course/12');
      await expect(failure).rejects.toBeInstanceOf(MatrixLoginError);
      await expect(failure).rejects.toMatchObject({ reason: 'EXCHANGE_FAILED', returnTo: '/course/12' });
    });

    it('but not for a login another EduHub user started', async () => {
      const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });
      const failure = completeMatrixLogin({ code: 'code-1', state: stateOf(url), eduHubUserId: 'u2', expectedMatrixHandle: null, origin });
      await expect(failure).rejects.toMatchObject({ reason: 'WRONG_USER', returnTo: undefined });
    });
  });
});

describe('abandonMatrixLogin', () => {
  it('forgets the login and returns where the user wanted to go', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });

    expect(abandonMatrixLogin(stateOf(url), 'u1')).toBe('/course/12');
    expect(takePendingMatrixLogin(stateOf(url))).toBeNull();
  });

  it('knows nothing without a matching login of the same user', async () => {
    const url = await startMatrixLogin({ eduHubUserId: 'u1', returnTo: '/course/12', origin });

    expect(abandonMatrixLogin(undefined, 'u1')).toBeNull();
    expect(abandonMatrixLogin('unknown-state', 'u1')).toBeNull();
    expect(abandonMatrixLogin(stateOf(url), 'u2')).toBeNull();
  });
});

describe('logoutMatrix', () => {
  it('forgets the session even when revoking fails', async () => {
    saveMatrixSession('u1', {
      homeserverUrl: 'https://matrix.test',
      userId: '@ina.lehr.abc123:test',
      deviceId: 'DEVICE1',
      accessToken: 'access-1',
      oauthClientId: 'client-1',
      issuer: metadata.issuer,
    });
    logout.mockRejectedValueOnce(new Error('offline'));
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await logoutMatrix('u1');

    expect(logout).toHaveBeenCalled();
    expect(loadMatrixSession('u1')).toBeNull();
  });

  it('ends every stored session once nobody is signed in', async () => {
    for (const id of ['u1', 'u2']) {
      saveMatrixSession(id, {
        homeserverUrl: 'https://matrix.test',
        userId: `@${id}:test`,
        deviceId: 'DEVICE1',
        accessToken: `access-${id}`,
        oauthClientId: 'client-1',
        issuer: metadata.issuer,
      });
    }

    await logoutAllMatrixSessions();

    expect(logout).toHaveBeenCalledTimes(2);
    expect(loadMatrixSession('u1')).toBeNull();
    expect(loadMatrixSession('u2')).toBeNull();
  });
});
