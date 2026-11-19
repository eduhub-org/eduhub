/**
 * Matrix / Element identifiers on the client.
 *
 * `User.matrixUserHandle` holds a localpart ("firstname.lastname.uuid6"), not a
 * full MXID, so turning one into something Element can open needs the server
 * name too. This mirrors `toMatrixUserId` in
 * functions/callNodeFunction/lib/matrixInvite.js - the two must agree, since
 * one invites people into rooms and the other links to them.
 */

/**
 * The Matrix server name EduHub issues handles under - the domain half of an
 * MXID, which is `opencampus.sh` even though the homeserver itself lives at
 * matrix.opencampus.sh (the usual delegation setup). Matches MATRIX_SERVER_NAME
 * on the serverless side.
 *
 * It is a fallback rather than the only source: NEXT_PUBLIC_MATRIX_SERVER_NAME
 * still wins where it is set, which is what a fork or a second deployment
 * needs. A handle that already carries its own domain never reaches this -
 * see toMatrixUserId - so someone bringing an account from another homeserver
 * is unaffected.
 */
export const DEFAULT_MATRIX_SERVER_NAME = 'opencampus.sh';

const trimAndNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * "@localpart:server" from a handle that may already be fully qualified, may
 * carry a leading sigil, or may be just the localpart. Returns null when there
 * is nothing usable - including when only a localpart is known and no server
 * name is configured, because "@alice:" opens nothing.
 */
export const toMatrixUserId = (
  matrixUserHandle: string | null | undefined,
  serverName: string | null | undefined
): string | null => {
  const trimmed = trimAndNull(matrixUserHandle);
  if (!trimmed) return null;

  const withoutSigil = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  if (withoutSigil.includes(':')) {
    const [localpartRaw, ...domainParts] = withoutSigil.split(':');
    const localpart = trimAndNull(localpartRaw);
    const domain = trimAndNull(domainParts.join(':'));
    if (!localpart || !domain) return null;
    return `@${localpart}:${domain}`;
  }

  const localpart = trimAndNull(withoutSigil);
  const server = trimAndNull(serverName);
  if (!localpart || !server) return null;
  return `@${localpart}:${server}`;
};

/**
 * A matrix.to link to this person, from where they can be messaged in Element
 * X or Element Classic. Null when the handle cannot be addressed. The server
 * name falls back to DEFAULT_MATRIX_SERVER_NAME, so this works unconfigured.
 */
export const matrixDirectMessageUrl = (
  matrixUserHandle: string | null | undefined,
  serverName: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME
): string | null => {
  // Resolved here rather than in the default argument so that an empty string
  // falls back too: an unset Docker build arg inlines as "", not undefined.
  const matrixUserId = toMatrixUserId(matrixUserHandle, trimAndNull(serverName) ?? DEFAULT_MATRIX_SERVER_NAME);
  return matrixUserId ? `https://matrix.to/#/${matrixUserId}` : null;
};

/**
 * A link that opens a direct message with this person in our own Element web
 * client, or null when the handle or the Element client is missing.
 */
export const elementDirectMessageUrl = (
  matrixUserHandle: string | null | undefined,
  serverName: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME,
  elementClientUrl: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL
): string | null => {
  const matrixUserId = toMatrixUserId(matrixUserHandle, trimAndNull(serverName) ?? DEFAULT_MATRIX_SERVER_NAME);
  const base = trimAndNull(elementClientUrl)?.replace(/\/+$/, '');
  if (!matrixUserId || !base) return null;
  return `${base}/#/user/${matrixUserId}`;
};

/**
 * A matrix.to link to a room, or null when there is no room id.
 *
 * This is the link for the Element apps (X and Classic): matrix.to offers to
 * open the room in an installed app, whereas a link to our own Element web
 * client always opens the browser on a phone. It is no link for the browser,
 * though: matrix.to sends web users to app.element.io and ignores a
 * `web-instance` hint for any host outside its own allowlist, so it can never
 * open element-chat.opencampus.sh. Hence the pair in matrixRoomLinks.
 *
 * `via` names a server that can let the person join. It comes from the room
 * id's own server part and falls back to the EduHub server name for room ids
 * that carry none (room version 12 and later).
 */
export const matrixRoomUrl = (
  roomId: string | null | undefined,
  serverName: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME
): string | null => {
  const id = trimAndNull(roomId);
  if (!id) return null;
  const roomServer = id.includes(':') ? trimAndNull(id.split(':').slice(1).join(':')) : null;
  const via = roomServer ?? trimAndNull(serverName) ?? DEFAULT_MATRIX_SERVER_NAME;
  return `https://matrix.to/#/${id}?via=${encodeURIComponent(via)}`;
};

/** A link that opens a room in our own Element web client, or null when either is missing. */
export const elementRoomUrl = (
  roomId: string | null | undefined,
  elementClientUrl: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL
): string | null => {
  const id = trimAndNull(roomId);
  const base = trimAndNull(elementClientUrl)?.replace(/\/+$/, '');
  return id && base ? `${base}/#/room/${id}` : null;
};

/**
 * Where a Matrix link should go: `web` opens our Element web client (where
 * people are already logged in on a laptop), `app` goes through matrix.to so
 * Element X or Element Classic can take it on a phone. Without a configured
 * web client, matrix.to is the only link and `app` is null.
 */
export interface MatrixLinks {
  web: string | null;
  app: string | null;
}

const pairLinks = (web: string | null, app: string | null): MatrixLinks =>
  web ? { web, app } : { web: app, app: null };

export const matrixRoomLinks = (roomId: string | null | undefined): MatrixLinks =>
  pairLinks(elementRoomUrl(roomId), matrixRoomUrl(roomId));

export const matrixDirectMessageLinks = (matrixUserHandle: string | null | undefined): MatrixLinks =>
  pairLinks(elementDirectMessageUrl(matrixUserHandle), matrixDirectMessageUrl(matrixUserHandle));
