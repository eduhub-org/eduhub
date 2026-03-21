/**
 * Keycloak 24+ validates PUT /admin/realms/{realm}/users/{id} against the
 * declarative user profile. Sending only partial fields (e.g. `{ attributes }`)
 * returns 400 "User name is missing" when editUsernameAllowed is true.
 *
 * Always merge changes onto the UserRepresentation from GET before PUT.
 *
 * When `patch.attributes` is set, it is deep-merged into `existingUser.attributes`
 * so a partial map (e.g. only `matrix_user_handle`) does not wipe other custom
 * attributes such as `picture`. To remove an attribute, pass an empty array for
 * that key (Keycloak convention).
 *
 * Strips read-only fields sometimes present on GET responses (`userProfileMetadata`,
 * `access`, etc.) so PUT does not fail validation or behave unexpectedly.
 */
const READ_ONLY_OR_DERIVED_FIELDS = [
  "userProfileMetadata",
  "access",
  "self",
  "credentials",
];

function mergeUserPutPayload(existingUser, patch) {
  if (!existingUser?.username) {
    throw new Error(
      "mergeUserPutPayload: existing user must include username (GET user before PUT)"
    );
  }
  const merged = { ...existingUser, ...patch };
  if (patch.attributes !== undefined) {
    merged.attributes = {
      ...(existingUser.attributes || {}),
      ...patch.attributes,
    };
  }
  for (const key of READ_ONLY_OR_DERIVED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(merged, key)) {
      delete merged[key];
    }
  }
  return merged;
}

module.exports = { mergeUserPutPayload };
