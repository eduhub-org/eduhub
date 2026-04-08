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

const MAX_MATRIX_FETCH_RETRIES = 5;
const BASE_BACKOFF_MS = 800;
/** Cap each backoff so one Retry-After does not exhaust the whole function timeout. */
const MAX_BACKOFF_MS = 15_000;

const sleepMs = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      return;
    }
    let tid;
    const onAbort = () => {
      clearTimeout(tid);
      signal?.removeEventListener("abort", onAbort);
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    };
    signal?.addEventListener("abort", onAbort);
    tid = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
  });

/** @param {string | null} header */
const parseRetryAfterMs = (header) => {
  if (!header) return 0;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) {
    return Math.min(60_000, Number.parseInt(trimmed, 10) * 1000);
  }
  const when = Date.parse(trimmed);
  if (!Number.isNaN(when)) {
    return Math.min(60_000, Math.max(0, when - Date.now()));
  }
  return 0;
};

/**
 * Matrix homeservers (Synapse, etc.) often return 429 under burst traffic. Retry with backoff + Retry-After.
 */
const fetchMatrixWithRateLimitRetry = async (url, init, signal) => {
  let lastResponse;
  for (let attempt = 0; attempt <= MAX_MATRIX_FETCH_RETRIES; attempt++) {
    lastResponse = await fetch(url, { ...init, signal });
    if (lastResponse.ok) return lastResponse;

    const retriable =
      (lastResponse.status === 429 || lastResponse.status === 503) && attempt < MAX_MATRIX_FETCH_RETRIES;
    if (!retriable) return lastResponse;

    const fromHeader = parseRetryAfterMs(lastResponse.headers.get("Retry-After"));
    const exponential = BASE_BACKOFF_MS * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 250);
    const waitMs = Math.min(
      MAX_BACKOFF_MS,
      Math.max(fromHeader, exponential + jitter)
    );
    await sleepMs(waitMs, signal);
  }
  return lastResponse;
};

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
    botUserId: adminUserId,
  };
};

/**
 * POST /_matrix/client/v3/join/{roomId} as the token user (MATRIX_ADMIN_ACCESS_TOKEN, usually the EduHub bot).
 * Required before inviteUserToMatrixRoom: Synapse rejects invites with "not in room" if the bot is not a member.
 * Succeeds for public / otherwise-joinable rooms; private rooms need a one-time manual invite in Element first.
 */
export const ensureBotJoinedMatrixRoom = async ({ homeserverUrl, token, roomId, signal }) => {
  const url = `${homeserverUrl}/_matrix/client/v3/join/${encodeURIComponent(roomId)}`;
  const response = await fetchMatrixWithRateLimitRetry(
    url,
    {
      method: "POST",
      headers: matrixHeaders(token),
      body: JSON.stringify({}),
    },
    signal
  );

  if (response.ok) return { joined: true };

  let payload = null;
  try {
    payload = await response.json();
  } catch (_e) {
    payload = null;
  }

  const errcode = payload?.errcode;
  const errMsg = (payload?.error || "").toString();

  const alreadyInRoom =
    /already in the room/i.test(errMsg) ||
    /already joined/i.test(errMsg) ||
    errcode === "M_ALREADY_JOINED";

  if (alreadyInRoom) {
    return { joined: false, skipped: true };
  }

  const error = new Error(
    payload?.error || `Matrix join failed with HTTP ${response.status}`
  );
  error.status = response.status;
  error.errcode = errcode;
  throw error;
};

/**
 * POST /_matrix/client/v3/rooms/{roomId}/invite — returns true if invite sent or redundant.
 */
export const inviteUserToMatrixRoom = async ({ homeserverUrl, token, roomId, matrixUserId, signal }) => {
  const url = `${homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`;
  const response = await fetchMatrixWithRateLimitRetry(
    url,
    {
      method: "POST",
      headers: matrixHeaders(token),
      body: JSON.stringify({ user_id: matrixUserId }),
    },
    signal
  );

  if (response.ok) return { invited: true };

  let payload = null;
  try {
    payload = await response.json();
  } catch (_e) {
    payload = null;
  }
  const errcode = payload?.errcode;
  const errMsg = (payload?.error || "").toString();

  const alreadyInRoom =
    /already invited/i.test(errMsg) ||
    /already in the room/i.test(errMsg) ||
    /already joined/i.test(errMsg) ||
    errcode === "M_ALREADY_JOINED";

  if (alreadyInRoom) {
    return { invited: false, skipped: true };
  }

  const error = new Error(payload?.error || `Matrix invite failed with HTTP ${response.status}`);
  error.status = response.status;
  error.errcode = errcode;
  throw error;
};
