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
      const elementRoom = hashNoQuery.match(/^#\/room\/([^/#]+)/);
      if (elementRoom) {
        try {
          return decodeURIComponent(elementRoom[1]);
        } catch (_e) {
          return elementRoom[1];
        }
      }
      // matrix.to: https://matrix.to/#/!room:server?via=…
      const matrixToRoom = hashNoQuery.match(/^#\/?(![^:#?]+:[^?#/]+)/);
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

/** Basic sanity check for Matrix room id shape */
export const isValidMatrixRoomId = (roomId) => {
  if (!roomId || typeof roomId !== "string") return false;
  return /^![^:]+:[^:]+$/.test(roomId.trim());
};
