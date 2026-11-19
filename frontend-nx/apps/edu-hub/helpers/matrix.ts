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
 * X, Element Classic or the browser - see matrixRoomUrl for why not our own
 * Element web client. Null when the handle cannot be addressed. The server name
 * falls back to DEFAULT_MATRIX_SERVER_NAME, so this works unconfigured.
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
 * A matrix.to link to a room, or null when there is no room id.
 *
 * matrix.to rather than our own Element web client, because matrix.to lets the
 * person choose where the room opens: Element X, Element Classic or the
 * browser. A link to element-chat.opencampus.sh always opens the browser on a
 * phone, so app users had to log in there once before the room appeared in
 * their app - participants are not invited, they join through this link.
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
