/**
 * Keycloak 24+ validates PUT /admin/realms/{realm}/users/{id} against the
 * declarative user profile. Sending only partial fields (e.g. `{ attributes }`)
 * returns 400 "User name is missing" when editUsernameAllowed is true.
 *
 * Always merge changes onto the UserRepresentation from GET before PUT.
 */
function mergeUserPutPayload(existingUser, patch) {
  if (!existingUser?.username) {
    throw new Error(
      "mergeUserPutPayload: existing user must include username (GET user before PUT)"
    );
  }
  const merged = { ...existingUser, ...patch };
  if (patch.attributes !== undefined) {
    merged.attributes = patch.attributes;
  }
  return merged;
}

module.exports = { mergeUserPutPayload };
