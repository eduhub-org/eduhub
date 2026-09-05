import KcAdminClient from '@keycloak/keycloak-admin-client';

/**
 * Hand out a Keycloak `hasura` client role (admin, instructor, org_admin, ...)
 * from inside a node function, without going through the addKeycloakRole
 * webhook.
 *
 * Why not the webhook: CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE is configured on
 * Hasura (which owns the event triggers), not on the callNodeFunction runtime,
 * so a handler that tried to POST there found no URL and silently skipped the
 * grant. KEYCLOAK_URL/KEYCLOAK_USER/KEYCLOAK_PW, on the other hand, are already
 * part of this runtime's environment (updateKeycloakUser uses them), so talking
 * to the Keycloak admin API directly is both possible and one hop shorter.
 *
 * This matters where a caller re-authenticates immediately after the grant to
 * pick the role up in a fresh token: only a synchronous grant is guaranteed to
 * be in place by the time the new token is issued. The equivalent event trigger
 * on the same table stays the retry safety net for everything else.
 *
 * Idempotent: a role the user already holds is no longer "available" to add, so
 * a repeat call is a no-op rather than an error.
 *
 * @returns {Promise<{ granted: boolean, reason?: string }>} `granted` is true
 *   only when the role is now on the user (freshly added or already there).
 */
export const addKeycloakClientRole = async (
  userId,
  role,
  logger,
  { timeoutMs = 8000, clientId = 'hasura', realmName = 'edu-hub' } = {}
) => {
  if (!userId || !role) {
    return { granted: false, reason: 'MISSING_ARGUMENTS' };
  }
  if (!process.env.KEYCLOAK_URL || !process.env.KEYCLOAK_PW) {
    logger?.warn('Keycloak admin credentials not configured, cannot grant role', { role });
    return { granted: false, reason: 'KEYCLOAK_NOT_CONFIGURED' };
  }

  // Bounded, because callers grant the role after the database write has already
  // committed: a Keycloak that accepts the connection and never answers must not
  // hold the request until the platform timeout and report failure to somebody
  // who does have the access.
  let expire;
  const timeout = new Promise((_, reject) => {
    expire = setTimeout(() => reject(new Error(`Keycloak role grant timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([grant(userId, role, clientId, realmName), timeout]);
  } finally {
    clearTimeout(expire);
  }
};

const grant = async (userId, role, clientId, realmName) => {
  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: 'master',
  });

  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER || 'keycloak',
    password: process.env.KEYCLOAK_PW,
    grantType: 'password',
    clientId: 'admin-cli',
  });

  kcAdminClient.setConfig({ realmName });

  const clients = await kcAdminClient.clients.find({ clientId, first: 1 });
  const clientUniqueId = clients?.[0]?.id;
  if (!clientUniqueId) {
    throw new Error(`Keycloak client '${clientId}' not found in realm '${realmName}'`);
  }

  const available = await kcAdminClient.users.listAvailableClientRoleMappings({
    id: userId,
    clientUniqueId,
  });
  const target = (available ?? []).find((candidate) => candidate.name === role);

  // Not available means either "already assigned" or "no such role". Both are
  // distinguished by asking what the user actually holds, so a typo in a role
  // name is not reported as a successful grant.
  if (!target) {
    const assigned = await kcAdminClient.users.listClientRoleMappings({
      id: userId,
      clientUniqueId,
    });
    const held = (assigned ?? []).some((candidate) => candidate.name === role);
    return held ? { granted: true, reason: 'ALREADY_ASSIGNED' } : { granted: false, reason: 'ROLE_UNKNOWN' };
  }

  await kcAdminClient.users.addClientRoleMappings({
    id: userId,
    clientUniqueId,
    roles: [{ id: target.id, name: target.name }],
  });

  return { granted: true, reason: 'ADDED' };
};
