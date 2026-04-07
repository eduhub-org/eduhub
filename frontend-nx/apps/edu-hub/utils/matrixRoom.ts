/**
 * Normalize pasted Element/Matrix room input to a canonical room id (!opaque:server).
 */
export function normalizeMatrixRoomId(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const hash = u.hash || '';
      const hashNoQuery = hash.split('?')[0];
      const elementRoom = hashNoQuery.match(/^#\/room\/([^/#]+)/);
      if (elementRoom) {
        try {
          return decodeURIComponent(elementRoom[1]);
        } catch {
          return elementRoom[1];
        }
      }
      // matrix.to: https://matrix.to/#/!room:server?via=…
      const matrixToRoom = hashNoQuery.match(/^#\/?(![^:#?]+:[^?#/]+)/);
      if (matrixToRoom) {
        try {
          return decodeURIComponent(matrixToRoom[1]);
        } catch {
          return matrixToRoom[1];
        }
      }
      const pathMatch = u.pathname.match(/\/room\/([^/?#]+)/);
      if (pathMatch) {
        try {
          return decodeURIComponent(pathMatch[1]);
        } catch {
          return pathMatch[1];
        }
      }
    } catch {
      /* ignore */
    }
  }

  const noFragment = trimmed.split('#')[0];
  const withoutQuery = noFragment.split('?')[0].trim();

  if (withoutQuery.startsWith('!')) {
    return withoutQuery;
  }

  const slashRoom = withoutQuery.match(/(?:^|\/)room\/([^/?#]+)/i);
  if (slashRoom) {
    try {
      return decodeURIComponent(slashRoom[1]);
    } catch {
      return slashRoom[1];
    }
  }

  return withoutQuery;
}

export function isValidMatrixRoomId(roomId: string | null | undefined): boolean {
  if (!roomId?.trim()) return false;
  return /^![^:]+:[^:]+$/.test(roomId.trim());
}
