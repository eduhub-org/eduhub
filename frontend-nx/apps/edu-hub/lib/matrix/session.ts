/**
 * Browser storage for the embedded Matrix chat.
 *
 * - The Matrix session (tokens, user and device) lives in localStorage, keyed
 *   by the EduHub user, so a later visit reuses it instead of logging in again
 *   and creating another device. It is removed on EduHub logout.
 * - The OAuth client registration is per homeserver auth server and app origin.
 * - A login in progress (PKCE verifier, device, return path) lives in
 *   sessionStorage under its OAuth `state` and is consumed by the callback.
 *
 * Storage can be unavailable (private mode, blocked site data), so every
 * access is guarded and a failure behaves like "nothing stored".
 */

export interface MatrixSession {
  homeserverUrl: string;
  userId: string;
  deviceId: string;
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds when the access token expires, if the server said. */
  expiresAt?: number;
  oauthClientId: string;
  issuer: string;
}

export interface PendingMatrixLogin {
  eduHubUserId: string;
  homeserverUrl: string;
  issuer: string;
  clientId: string;
  deviceId: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
}

const SESSION_PREFIX = 'eduhub.matrix.session.';
const CLIENT_PREFIX = 'eduhub.matrix.oauthClient.';
const PENDING_PREFIX = 'eduhub.matrix.pendingLogin.';

/** A pending login older than this is ignored (the user abandoned it). */
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

const read = <T>(storage: () => Storage, key: string): T | null => {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (storage: () => Storage, key: string, value: unknown): void => {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // Without storage the session simply does not survive a reload.
  }
};

const remove = (storage: () => Storage, key: string): void => {
  try {
    storage().removeItem(key);
  } catch {
    // Nothing stored that we could remove.
  }
};

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export const loadMatrixSession = (eduHubUserId: string): MatrixSession | null =>
  read<MatrixSession>(local, SESSION_PREFIX + eduHubUserId);

export const saveMatrixSession = (eduHubUserId: string, matrixSession: MatrixSession): void =>
  write(local, SESSION_PREFIX + eduHubUserId, matrixSession);

export const clearMatrixSession = (eduHubUserId: string): void => remove(local, SESSION_PREFIX + eduHubUserId);

/** EduHub user ids that have a Matrix session stored in this browser. */
export const listMatrixSessionOwners = (): string[] => {
  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(SESSION_PREFIX))
      .map((key) => key.slice(SESSION_PREFIX.length));
  } catch {
    return [];
  }
};

const clientKey = (issuer: string, origin: string) => `${CLIENT_PREFIX}${issuer}|${origin}`;

export const loadRegisteredClientId = (issuer: string, origin: string): string | null =>
  read<string>(local, clientKey(issuer, origin));

export const saveRegisteredClientId = (issuer: string, origin: string, clientId: string): void =>
  write(local, clientKey(issuer, origin), clientId);

export const forgetRegisteredClientId = (issuer: string, origin: string): void =>
  remove(local, clientKey(issuer, origin));

export const savePendingMatrixLogin = (state: string, pending: PendingMatrixLogin): void =>
  write(session, PENDING_PREFIX + state, pending);

/** Returns the pending login for this `state` once; a second call finds nothing. */
export const takePendingMatrixLogin = (state: string, now = Date.now()): PendingMatrixLogin | null => {
  const pending = read<PendingMatrixLogin>(session, PENDING_PREFIX + state);
  remove(session, PENDING_PREFIX + state);
  if (!pending || now - pending.createdAt > PENDING_MAX_AGE_MS) return null;
  return pending;
};
