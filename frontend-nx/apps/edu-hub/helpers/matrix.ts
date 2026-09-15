/**
 * Matrix / Element identifiers on the client.
 *
 * `User.matrixUserHandle` holds a localpart ("firstname.lastname.uuid6"), not a
 * full MXID, so turning one into something Element can open needs the server
 * name too. This mirrors `toMatrixUserId` in
 * functions/callNodeFunction/lib/matrixInvite.js - the two must agree, since
 * one invites people into rooms and the other links to them.
 */

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
 * A link that opens a direct message with this person in the configured Element
 * client, or null when either half of the address is missing.
 */
export const elementDirectMessageUrl = (
  matrixUserHandle: string | null | undefined,
  serverName: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME,
  elementClientUrl: string | null | undefined = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL
): string | null => {
  const matrixUserId = toMatrixUserId(matrixUserHandle, serverName);
  const base = trimAndNull(elementClientUrl)?.replace(/\/+$/, '');
  if (!matrixUserId || !base) return null;
  return `${base}/#/user/${matrixUserId}`;
};
