/**
 * OAuth 2.0 login to the Matrix homeserver for the embedded chat.
 *
 * The homeserver delegates authentication to the Matrix Authentication Service
 * (MAS), which in turn logs people in through EduHub's Keycloak. The flow
 * (https://spec.matrix.org/latest/client-server-api/#oauth-20-api):
 *
 * 1. discover the auth server from the homeserver (auth_metadata)
 * 2. register EduHub as an OAuth client there, once per browser
 * 3. send the browser to the authorization endpoint with a PKCE challenge
 * 4. on the callback, exchange the code (plus PKCE verifier) for tokens
 * 5. ask the homeserver who the tokens belong to and store the session
 *
 * matrix-js-sdk is imported on demand so it never runs during server rendering.
 */
import type { MatrixClient, ValidatedAuthMetadata } from 'matrix-js-sdk';

import { getMatrixHomeserverUrl, getMatrixOAuthClientId, matrixCallbackUrl, safeReturnTo } from './config';
import {
  clearMatrixSession,
  forgetRegisteredClientId,
  listMatrixSessionOwners,
  loadMatrixSession,
  loadRegisteredClientId,
  MatrixSession,
  saveMatrixSession,
  savePendingMatrixLogin,
  saveRegisteredClientId,
  takePendingMatrixLogin,
} from './session';

const loadSdk = () => import('matrix-js-sdk');

export class MatrixLoginError extends Error {
  constructor(
    public readonly reason:
      | 'NOT_CONFIGURED'
      | 'UNKNOWN_STATE'
      | 'WRONG_USER'
      | 'WRONG_MATRIX_ACCOUNT'
      | 'DENIED'
      | 'EXCHANGE_FAILED',
    message?: string
  ) {
    super(message ?? reason);
    this.name = 'MatrixLoginError';
  }
}

/** Unguessable OAuth `state`, 128 random bits as hex. */
const randomState = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');

const requireHomeserverUrl = (): string => {
  const url = getMatrixHomeserverUrl();
  if (!url) throw new MatrixLoginError('NOT_CONFIGURED');
  return url;
};

/** Step 1: the homeserver tells us which OAuth 2.0 server (MAS) handles its logins. */
const getAuthMetadata = async (homeserverUrl: string): Promise<ValidatedAuthMetadata> => {
  const { createClient } = await loadSdk();
  return createClient({ baseUrl: homeserverUrl }).getAuthMetadata();
};

/**
 * Step 2: register EduHub as a public OAuth client (no secret; PKCE protects the code).
 * A client id configured for this deployment is used as is, without falling back
 * to registration, so a wrong id shows up as a failed login instead of silently
 * bringing back the consent screen.
 */
const getOrRegisterClientId = async (metadata: ValidatedAuthMetadata, origin: string): Promise<string> => {
  const configured = getMatrixOAuthClientId();
  if (configured) return configured;

  const stored = loadRegisteredClientId(metadata.issuer, origin);
  if (stored) return stored;

  const { OAuth2 } = await loadSdk();
  const clientId = await OAuth2.registerClient(metadata, {
    client_name: 'EduHub',
    client_uri: `${origin}/`,
    redirect_uris: [matrixCallbackUrl(origin)],
    application_type: 'web',
    policy_uri: `${origin}/privacy`,
    tos_uri: `${origin}/terms`,
  });
  saveRegisteredClientId(metadata.issuer, origin, clientId);
  return clientId;
};

/**
 * Steps 1-3: prepares a login and returns the URL to send the browser to.
 * A device from an earlier session of this EduHub user is reused, so logging in
 * again (e.g. after the refresh token expired) does not pile up devices.
 */
export const startMatrixLogin = async ({
  eduHubUserId,
  returnTo,
  origin,
}: {
  eduHubUserId: string;
  returnTo: string;
  origin: string;
}): Promise<string> => {
  const homeserverUrl = requireHomeserverUrl();
  const metadata = await getAuthMetadata(homeserverUrl);
  const clientId = await getOrRegisterClientId(metadata, origin);

  const { OAuth2 } = await loadSdk();
  const previous = loadMatrixSession(eduHubUserId);
  const oauth = new OAuth2(metadata, { clientId, deviceId: previous?.deviceId });

  const state = randomState();
  savePendingMatrixLogin(state, {
    eduHubUserId,
    homeserverUrl,
    issuer: metadata.issuer,
    clientId,
    deviceId: oauth.context.deviceId,
    codeVerifier: oauth.context.codeVerifier,
    returnTo: safeReturnTo(returnTo),
    createdAt: Date.now(),
  });

  // response_mode "fragment": code and state come back after the #, so they
  // never reach EduHub's server or its logs.
  return oauth.generateAuthorizationCodeGrantUrl(state, matrixCallbackUrl(origin), 'fragment');
};

/** The localpart of a Matrix user id or handle: "@ina.lehr.abc123:server" → "ina.lehr.abc123". */
const localpartOf = (userIdOrHandle: string): string => userIdOrHandle.trim().replace(/^@/, '').split(':')[0];

/** Reads code/state (or error) from the callback URL fragment. */
export const parseMatrixCallback = (
  hash: string
): { code?: string; state?: string; error?: string } => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
  };
};

/**
 * Steps 4-5: exchanges the authorization code for tokens and stores the session.
 * Returns where the user wanted to go.
 */
export const completeMatrixLogin = async ({
  code,
  state,
  eduHubUserId,
  expectedMatrixHandle,
  origin,
}: {
  code: string;
  state: string;
  eduHubUserId: string;
  /** The signed-in EduHub user's matrix_user_handle; the Matrix account must match it. */
  expectedMatrixHandle: string | null;
  origin: string;
}): Promise<{ session: MatrixSession; returnTo: string }> => {
  const pending = takePendingMatrixLogin(state);
  if (!pending) throw new MatrixLoginError('UNKNOWN_STATE');
  // The login was started for another EduHub account (e.g. someone else
  // signed in to EduHub in between); do not hand them this Matrix session.
  if (pending.eduHubUserId !== eduHubUserId) throw new MatrixLoginError('WRONG_USER');

  const { OAuth2, createClient } = await loadSdk();
  const metadata = await getAuthMetadata(pending.homeserverUrl);
  const oauth = new OAuth2(metadata, {
    clientId: pending.clientId,
    deviceId: pending.deviceId,
    codeVerifier: pending.codeVerifier,
  });

  let tokens;
  try {
    tokens = await oauth.completeAuthorizationCodeGrant(code, matrixCallbackUrl(origin));
  } catch (error) {
    // A stale registration (e.g. the auth server's database was reset) only
    // shows up here; register again on the next attempt.
    forgetRegisteredClientId(pending.issuer, origin);
    throw new MatrixLoginError('EXCHANGE_FAILED', (error as Error).message);
  }

  const whoami = await createClient({
    baseUrl: pending.homeserverUrl,
    accessToken: tokens.access_token,
  }).whoami();

  // The auth server keeps its own browser session, so on a shared computer it
  // can still be logged in as the previous person. Never keep a Matrix session
  // that is not the signed-in EduHub user's own account.
  if (!expectedMatrixHandle || localpartOf(whoami.user_id) !== localpartOf(expectedMatrixHandle)) {
    await Promise.all(
      [
        tokens.refresh_token && oauth.revokeToken(tokens.refresh_token, 'refresh_token'),
        oauth.revokeToken(tokens.access_token, 'access_token'),
      ].map((revocation) => Promise.resolve(revocation).catch(() => undefined))
    );
    throw new MatrixLoginError('WRONG_MATRIX_ACCOUNT', whoami.user_id);
  }

  // A login while an earlier session is still stored (e.g. a second tab) would
  // leave that session alive at the auth server, and with it the device, even
  // after logout. End it now that its replacement works.
  const previous = loadMatrixSession(eduHubUserId);
  if (previous && previous.accessToken !== tokens.access_token) {
    const previousAuth = new OAuth2(metadata, { clientId: previous.oauthClientId });
    await Promise.all(
      [
        previous.refreshToken && previousAuth.revokeToken(previous.refreshToken, 'refresh_token'),
        previousAuth.revokeToken(previous.accessToken, 'access_token'),
      ].map((revocation) => Promise.resolve(revocation).catch(() => undefined))
    );
  }

  const session: MatrixSession = {
    homeserverUrl: pending.homeserverUrl,
    userId: whoami.user_id,
    deviceId: whoami.device_id ?? pending.deviceId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    oauthClientId: pending.clientId,
    issuer: pending.issuer,
  };
  saveMatrixSession(eduHubUserId, session);
  return { session, returnTo: pending.returnTo };
};

/**
 * A MatrixClient for a stored session. matrix-js-sdk refreshes the access token
 * by itself when it expires; the new tokens are written back to storage.
 */
export const createMatrixClientFromSession = async (
  eduHubUserId: string,
  matrixSession: MatrixSession
): Promise<MatrixClient> => {
  const { createClient } = await loadSdk();
  let current = matrixSession;
  return createClient({
    baseUrl: matrixSession.homeserverUrl,
    userId: matrixSession.userId,
    deviceId: matrixSession.deviceId,
    accessToken: matrixSession.accessToken,
    refreshToken: matrixSession.refreshToken,
    oauthClientId: matrixSession.oauthClientId,
    onTokenRefresh: ({ accessToken, refreshToken, expiry }) => {
      current = {
        ...current,
        accessToken,
        refreshToken: refreshToken ?? current.refreshToken,
        expiresAt: expiry?.getTime(),
      };
      saveMatrixSession(eduHubUserId, current);
    },
  });
};

/**
 * Ends the Matrix session of this EduHub user: revokes the tokens at the auth
 * server (which also removes the device) and forgets the stored session.
 * Never throws. The stored session is removed first, so it is gone even if
 * revoking fails or the page is left before the auth server answers.
 */
export const logoutMatrix = async (eduHubUserId: string): Promise<void> => {
  const matrixSession = loadMatrixSession(eduHubUserId);
  if (!matrixSession) return;
  clearMatrixSession(eduHubUserId);
  try {
    const { createClient } = await loadSdk();
    const client = createClient({
      baseUrl: matrixSession.homeserverUrl,
      userId: matrixSession.userId,
      deviceId: matrixSession.deviceId,
      accessToken: matrixSession.accessToken,
      refreshToken: matrixSession.refreshToken,
      oauthClientId: matrixSession.oauthClientId,
      // Refreshed tokens are revoked right away; nothing to store.
      onTokenRefresh: () => undefined,
    });
    await client.logout(true);
  } catch (error) {
    console.warn('Could not revoke the Matrix session', error);
  }
};

/**
 * Ends every Matrix session stored in this browser. For when nobody is signed
 * in to EduHub any more, however that happened (logout, expired session, auth
 * error): no chat tokens should outlive the EduHub login they came from.
 */
export const logoutAllMatrixSessions = async (): Promise<void> => {
  await Promise.all(listMatrixSessionOwners().map((eduHubUserId) => logoutMatrix(eduHubUserId)));
};
