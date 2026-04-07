import net from "node:net";

/**
 * Normalize pasted Element/Matrix room input to a canonical room id (!opaque:server).
 * Accepts: full Element URLs, paths containing /room/, or raw !room:server ids.
 */
export const trimAndNull = (value) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const normalizeMatrixRoomId = (input) => {
  const trimmed = trimAndNull(input);
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const hash = u.hash || "";
      const hashNoQuery = hash.split("?")[0];
      const decodedHash = (() => {
        try {
          return decodeURIComponent(hashNoQuery);
        } catch (_) {
          return hashNoQuery;
        }
      })();
      const elementRoom = decodedHash.match(/^#\/room\/([^/#]+)/);
      if (elementRoom) {
        try {
          return decodeURIComponent(elementRoom[1]);
        } catch (_e) {
          return elementRoom[1];
        }
      }
      // matrix.to: https://matrix.to/#/!room:server?via=… (fragment may be percent-encoded)
      const matrixToRoom = decodedHash.match(/^#\/?(![^:#?]+:[^?#/]+)/);
      if (matrixToRoom) {
        try {
          return decodeURIComponent(matrixToRoom[1]);
        } catch (_e) {
          return matrixToRoom[1];
        }
      }
      const pathMatch = u.pathname.match(/\/room\/([^/?#]+)/);
      if (pathMatch) {
        try {
          return decodeURIComponent(pathMatch[1]);
        } catch (_e) {
          return pathMatch[1];
        }
      }
    } catch (_e) {
      /* fall through */
    }
  }

  const noFragment = trimmed.split("#")[0];
  const withoutQuery = noFragment.split("?")[0].trim();

  if (withoutQuery.startsWith("!")) {
    return withoutQuery;
  }

  const slashRoom = withoutQuery.match(/(?:^|\/)room\/([^/?#]+)/i);
  if (slashRoom) {
    try {
      return decodeURIComponent(slashRoom[1]);
    } catch (_e) {
      return slashRoom[1];
    }
  }

  return withoutQuery;
};

/** Matrix DNS-style hostname labels (RFC 1123 relaxed). */
const isMatrixHostname = (host) => {
  if (!host || host.length > 253) return false;
  const labels = host.split(".");
  return labels.every((label) => {
    if (label.length < 1 || label.length > 63) return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label);
  });
};

/** Server part after !localpart: — hostname, host:port, IPv4, IPv4:port, [IPv6], [IPv6]:port */
const isValidMatrixServerPart = (server) => {
  if (!server) return false;
  if (server.startsWith("[")) {
    const close = server.indexOf("]");
    if (close === -1) return false;
    const addr = server.slice(1, close);
    if (!net.isIPv6(addr)) return false;
    const rest = server.slice(close + 1);
    if (rest === "") return true;
    const portMatch = rest.match(/^:(\d{1,5})$/);
    if (!portMatch) return false;
    const p = Number(portMatch[1]);
    return p >= 1 && p <= 65535;
  }
  const lastColon = server.lastIndexOf(":");
  if (lastColon !== -1) {
    const maybePort = server.slice(lastColon + 1);
    if (/^\d{1,5}$/.test(maybePort)) {
      const p = Number(maybePort);
      if (p >= 1 && p <= 65535) {
        const hostOnly = server.slice(0, lastColon);
        return net.isIPv4(hostOnly) || isMatrixHostname(hostOnly);
      }
    }
  }
  return net.isIPv4(server) || isMatrixHostname(server);
};

/**
 * Basic sanity check for Matrix room id shape.
 * Accepts v12 local-only ids (!opaque) or full ids (!opaque:server) with server as
 * hostname, hostname:port, IPv4, or bracketed IPv6 (+ optional port).
 */
export const isValidMatrixRoomId = (roomId) => {
  if (!roomId || typeof roomId !== "string") return false;
  const trimmed = roomId.trim();
  if (!trimmed.startsWith("!")) return false;
  const rest = trimmed.slice(1);
  if (!rest) return false;
  // v12 / local-only: no server segment
  if (!rest.includes(":")) {
    return !/[\s#/?]/.test(rest);
  }
  const colonIdx = rest.indexOf(":");
  const localpart = rest.slice(0, colonIdx);
  const server = rest.slice(colonIdx + 1);
  if (!localpart || !server || /[\s#/?]/.test(localpart)) return false;
  return isValidMatrixServerPart(server);
};
