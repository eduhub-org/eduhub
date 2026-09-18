import crypto from 'crypto';
import { serialize, parse } from 'cookie';
import { GraphQLClient } from 'graphql-request';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { AuthRoles } from '../types/enums';
/**
 * A readable companion to the signed cookie, holding no secret and carrying no
 * authority: it only tells the browser, synchronously on first render, that it
 * should route GraphQL through the proxy instead of straight to Hasura. Without
 * it the first queries after a page load would go out as the admin, before the
 * asynchronous session check came back.
 *
 * The server never trusts it. A forged marker only sends that browser's own
 * queries to a proxy that refuses them.
 */
import { IMPERSONATION_MARKER_COOKIE } from './impersonationMarker';

/**
 * Shared plumbing for super-admin impersonation.
 *
 * Hasura only trusts tokens signed by the Keycloak realm (HASURA_GRAPHQL_JWT_SECRET
 * is a jwk_url), so nothing here can mint a token that says "I am this other
 * user". Impersonation therefore runs server-side: the routes under
 * pages/api/impersonation authenticate the admin through their NextAuth session,
 * then talk to Hasura with the admin secret plus explicit `x-hasura-role: user`
 * and `x-hasura-user-id: <target>` headers -- the same "check as the user, then
 * act as admin" shape as pages/api/manage-organizations/ghost-newsletter-credential.ts.
 *
 * The target is never supplied by the browser. It lives in an httpOnly cookie
 * this server signs, so a non-admin cannot point the proxy at somebody else and
 * an admin cannot widen their reach by editing a request.
 */

export const IMPERSONATION_COOKIE = 'eduhub_impersonation';
export const COOKIE_MAX_AGE_SECONDS = 60 * 60;

export const GRAPHQL_URI =
  process.env.GRAPHQL_URI || process.env.NEXT_PUBLIC_API_URL || 'http://hasura:8080/v1/graphql';

/**
 * Reading env lazily rather than at module load: these routes are the only
 * consumers, and a missing secret should fail the request that needs it instead
 * of the whole app (NEXTAUTH_SECRET, for one, is unset in local development).
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required but not set.`);
  return value;
};

const signingSecret = (): string => process.env.IMPERSONATION_TOKEN_SECRET || requireEnv('NEXTAUTH_SECRET');

export type ImpersonationPayload = {
  targetUserId: string;
  sessionId: number;
  iat: number;
};

type HasuraClaims = {
  'x-hasura-allowed-roles'?: string[];
  'x-hasura-user-id'?: string;
};

type SessionToken = {
  profile?: { 'https://hasura.io/jwt/claims'?: HasuraClaims };
};

export const adminClient = () =>
  new GraphQLClient(GRAPHQL_URI, {
    headers: { 'x-hasura-admin-secret': requireEnv('HASURA_ADMIN_SECRET') },
  });

const sign = (payload: string) => crypto.createHmac('sha256', signingSecret()).update(payload).digest('base64url');

export const encodeCookie = (payload: ImpersonationPayload): string => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
};

/**
 * How far a cookie's `iat` may sit in the future before it is rejected. The same
 * process signs and verifies, so this is not for clock drift between machines --
 * it only keeps a cookie minted a moment ago from being refused.
 */
const CLOCK_SKEW_TOLERANCE_MS = 60 * 1000;

/**
 * Returns the payload only for a cookie this server signed and that has not
 * expired.
 *
 * The expiry check is here rather than left to the browser: `maxAge` only
 * governs what the browser chooses to send, so a copied cookie would otherwise
 * stay valid for as long as its audit row is open -- indefinitely, if the admin
 * closed the tab instead of pressing stop. `iat` is what bounds that.
 */
export const decodeCookie = (raw: string | undefined): ImpersonationPayload | null => {
  if (!raw) return null;
  const [body, signature] = raw.split('.');
  if (!body || !signature) return null;

  // Both sides are base64url SHA-256 and therefore the same length, but
  // timingSafeEqual throws on a mismatch, so check before comparing.
  const given = new Uint8Array(Buffer.from(signature));
  const want = new Uint8Array(Buffer.from(sign(body)));
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof parsed?.targetUserId !== 'string' || typeof parsed?.sessionId !== 'number') {
      return null;
    }

    // Missing, non-finite, future and expired timestamps are all refused: a
    // cookie that cannot say when it was issued cannot be shown to be current.
    if (typeof parsed?.iat !== 'number' || !Number.isFinite(parsed.iat)) return null;
    const age = Date.now() - parsed.iat;
    if (age < -CLOCK_SKEW_TOLERANCE_MS) return null;
    if (age > COOKIE_MAX_AGE_SECONDS * 1000) return null;

    return parsed as ImpersonationPayload;
  } catch {
    return null;
  }
};

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

export const setImpersonationCookie = (res: NextApiResponse, payload: ImpersonationPayload) => {
  res.setHeader('Set-Cookie', [
    serialize(IMPERSONATION_COOKIE, encodeCookie(payload), cookieOptions(COOKIE_MAX_AGE_SECONDS)),
    serialize(IMPERSONATION_MARKER_COOKIE, '1', {
      ...cookieOptions(COOKIE_MAX_AGE_SECONDS),
      httpOnly: false,
    }),
  ]);
};

export const clearImpersonationCookie = (res: NextApiResponse) => {
  res.setHeader('Set-Cookie', [
    serialize(IMPERSONATION_COOKIE, '', cookieOptions(0)),
    serialize(IMPERSONATION_MARKER_COOKIE, '', { ...cookieOptions(0), httpOnly: false }),
  ]);
};

export const readImpersonationCookie = (req: NextApiRequest): ImpersonationPayload | null =>
  decodeCookie(parse(req.headers?.cookie || '')[IMPERSONATION_COOKIE]);

/**
 * The signed-in super-admin, or null. Identity comes from the NextAuth token,
 * never from a header, so an impersonated request cannot dress itself up as a
 * different caller.
 */
export const resolveAdminCaller = async (req: NextApiRequest): Promise<{ userId: string } | null> => {
  const token = (await getToken({ req })) as SessionToken | null;
  const claims = token?.profile?.['https://hasura.io/jwt/claims'];
  const userId = claims?.['x-hasura-user-id'];
  const isAdmin = (claims?.['x-hasura-allowed-roles'] ?? []).includes(AuthRoles.admin);

  if (!userId || !isAdmin) return null;
  return { userId };
};

/**
 * Same-origin guard. These routes change state and authenticate purely through
 * cookies, so a cross-site POST would otherwise ride the admin's session.
 */
export const isSameOrigin = (req: NextApiRequest): boolean => {
  const origin = req.headers?.origin;
  if (!origin) return true; // same-origin fetches may omit it; SameSite=Lax still applies
  try {
    return new URL(origin).host === req.headers?.host;
  } catch {
    return false;
  }
};

export const noStore = (res: NextApiResponse) => res.setHeader('Cache-Control', 'no-store');

export const OPEN_SESSION_QUERY = `
  query OpenImpersonationSession($id: Int!, $adminUserId: uuid!) {
    ImpersonationSession(
      where: { id: { _eq: $id }, adminUserId: { _eq: $adminUserId }, ended_at: { _is_null: true } }
      limit: 1
    ) {
      id
      targetUserId
      TargetUser {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export type OpenSessionResult = {
  ImpersonationSession: {
    id: number;
    targetUserId: string;
    TargetUser: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  }[];
};

const CLOSE_SESSION = `
  mutation CloseImpersonationSession($id: Int!, $adminUserId: uuid!) {
    update_ImpersonationSession(
      where: { id: { _eq: $id }, adminUserId: { _eq: $adminUserId }, ended_at: { _is_null: true } }
      _set: { ended_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

/**
 * Ends whatever impersonation this browser is in: clears the cookie and closes
 * the audit row. Shared by the stop route and by logout, because an
 * impersonation that outlives the session it was started from is exactly the
 * thing the audit trail exists to rule out.
 *
 * Always safe to call, and never fails the caller: the cookie is gone either
 * way, so the impersonation is over for this browser even if closing the row
 * did not get through.
 */
export const endImpersonation = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const payload = readImpersonationCookie(req);
  clearImpersonationCookie(res);
  if (!payload) return;

  const admin = await resolveAdminCaller(req);
  if (!admin) return;

  try {
    await adminClient().request(CLOSE_SESSION, {
      id: payload.sessionId,
      adminUserId: admin.userId,
    });
    console.info('Impersonation ended', { adminUserId: admin.userId, sessionId: payload.sessionId });
  } catch (error) {
    console.error('Failed to close impersonation session', error);
  }
};
