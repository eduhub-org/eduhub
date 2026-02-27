/**
 * Computes a Matrix-compatible user handle from user profile data.
 *
 * Format: {firstName}.{lastName}.{first6HexCharsOfUUID}
 * Unicode is normalized (e.g. ü → u), then lowercased,
 * and non-Matrix-safe characters are stripped.
 *
 * Matrix localparts allow: [a-z0-9._=\-/]
 *
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} userId - Keycloak UUID (with or without hyphens)
 * @returns {string} sanitized handle
 */
export function computeMatrixHandle(firstName, lastName, userId) {
  const first = sanitize(firstName || 'user');
  const last = sanitize(lastName || 'user');
  const uuidPrefix = (userId || '').replace(/-/g, '').substring(0, 6);
  return `${first}.${last}.${uuidPrefix}`;
}

function sanitize(input) {
  const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase().replace(/[^a-z0-9._\-]/g, '');
}
