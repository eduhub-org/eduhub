/**
 * Configuration of the embedded Matrix chat, read from build-time variables.
 */

/** Client-Server API base URL of the homeserver, or null when the chat is not configured. */
export const getMatrixHomeserverUrl = (): string | null => {
  const url = process.env.NEXT_PUBLIC_MATRIX_HOMESERVER_URL?.trim();
  return url ? url.replace(/\/+$/, '') : null;
};

/** Where the homeserver's OAuth 2.0 server sends the browser back to after login. */
export const matrixCallbackUrl = (origin: string): string => `${origin}/matrix/callback`;

/**
 * Only same-site paths are allowed as a destination after login, so a crafted
 * link like /matrix/login?returnTo=https://evil.example cannot send someone
 * off-site (open redirect).
 */
export const safeReturnTo = (value: unknown): string => {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
};
