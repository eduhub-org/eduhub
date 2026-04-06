import { trimAndNull } from "./matrixRoomUtils.js";

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const deriveServerName = ({ explicitServerName, mainSpaceId, adminUserId }) => {
  if (explicitServerName) return explicitServerName;
  if (mainSpaceId && mainSpaceId.includes(":")) {
    return mainSpaceId.split(":").slice(1).join(":");
  }
  if (adminUserId && adminUserId.includes(":")) {
    return adminUserId.split(":").slice(1).join(":");
  }
  return null;
};

export const toMatrixUserId = (matrixUserHandle, serverName) => {
  const trimmed = trimAndNull(matrixUserHandle);
  if (!trimmed) return null;
  const withoutSigil = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (withoutSigil.includes(":")) {
    const [localpartRaw, ...domainParts] = withoutSigil.split(":");
    const localpart = trimAndNull(localpartRaw);
    const domain = trimAndNull(domainParts.join(":"));
    if (!localpart || !domain) return null;
    return `@${localpart}:${domain}`;
  }
  const localpart = trimAndNull(withoutSigil);
  if (!localpart) return null;
  return `@${localpart}:${serverName}`;
};

const matrixHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const parseMatrixResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (response.ok) return payload;

  const error = new Error(payload?.error || `Matrix request failed with HTTP ${response.status}`);
  error.status = response.status;
  error.errcode = payload?.errcode;
  throw error;
};

export const getMatrixInviteConfig = () => {
  const homeserverUrl = trimAndNull(process.env.MATRIX_HOMESERVER_URL);
  const token = trimAndNull(process.env.MATRIX_ADMIN_ACCESS_TOKEN);
  const mainSpaceId = trimAndNull(process.env.MATRIX_MAIN_SPACE_ID);
  const adminUserId = trimAndNull(process.env.MATRIX_ADMIN_USER_ID);
  const explicitServerName = trimAndNull(process.env.MATRIX_SERVER_NAME);
  const serverName = deriveServerName({ explicitServerName, mainSpaceId, adminUserId });

  if (!homeserverUrl || !token || !serverName) return null;

  return {
    homeserverUrl: normalizeBaseUrl(homeserverUrl),
    token,
    serverName,
  };
};

/**
 * POST /_matrix/client/v3/rooms/{roomId}/invite — returns true if invite sent or redundant.
 */
export const inviteUserToMatrixRoom = async ({ homeserverUrl, token, roomId, matrixUserId, signal }) => {
  const url = `${homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`;
  const response = await fetch(url, {
    method: "POST",
    headers: matrixHeaders(token),
    body: JSON.stringify({ user_id: matrixUserId }),
    signal,
  });

  if (response.ok) return { invited: true };

  let payload = null;
  try {
    payload = await response.json();
  } catch (_e) {
    payload = null;
  }
  const errcode = payload?.errcode;
  const errMsg = (payload?.error || "").toString();

  const ignorable =
    errcode === "M_UNKNOWN" ||
    errcode === "M_FORBIDDEN" ||
    /already/i.test(errMsg) ||
    /member/i.test(errMsg);

  if (ignorable) {
    return { invited: false, skipped: true };
  }

  const error = new Error(payload?.error || `Matrix invite failed with HTTP ${response.status}`);
  error.status = response.status;
  error.errcode = errcode;
  throw error;
};
