import KcAdminClient from '@keycloak/keycloak-admin-client';
import { createHasuraClient } from '../lib/hasura.js';
import { keycloakConfig } from '../lib/config.js';
import { authenticateKeycloakAdmin } from '../lib/keycloak.js';

// Counterpart to addKeycloakRole: invoked from a Hasura DELETE event trigger
// to revoke the Keycloak client role named in the `role` header once the
// backing grant is removed. Formerly its own unit (functions/removeKeycloakRole).
// Failures answer 400/500 as the old unit did, so the trigger retries.

// Roles that are backed by a "source of truth" table: the Keycloak role should only be removed once
// the user has no remaining rows in that table (e.g. an org admin who still administers another
// organization must keep `org_admin`). Each entry maps the role to the GraphQL query that returns
// the user's remaining grants. Roles not listed here are removed unconditionally.
const REMAINING_GRANT_QUERIES = {
  org_admin: {
    field: 'OrganizationAdmin',
    query: 'query($id: uuid!) { OrganizationAdmin(where: {userId: {_eq: $id}}, limit: 1) { id } }',
  },
  instructor: {
    field: 'CourseInstructor',
    query: 'query($id: uuid!) { CourseInstructor(where: {userId: {_eq: $id}}, limit: 1) { id } }',
  },
};

const fail = (httpStatus, error) => ({ httpStatus, success: false, error });

const revoke = async (req, logger) => {
  // DELETE events carry the removed row under `data.old`.
  const userid = req.body?.event?.data?.old?.userId;
  const role = req.headers.role;

  if (!userid) {
    return fail(400, 'No userId in event payload');
  }
  if (!role) {
    return fail(400, 'No role header provided');
  }

  // If the role is backed by a source-of-truth table, only revoke it once the user has no rows left
  // there. This keeps the role for users who still hold an equivalent grant (e.g. admin of another
  // organization, or instructor of another course).
  const remaining = REMAINING_GRANT_QUERIES[role];
  if (remaining) {
    let stillGranted = null;
    try {
      const response = await createHasuraClient().request(remaining.query, { id: userid });
      stillGranted = response[remaining.field];
    } catch (error) {
      logger.error('Could not read remaining grants', { userid, role, error: error.message });
    }

    if (stillGranted == null) {
      // Could not determine the remaining grants; fail rather than risk wrongly revoking the role.
      return fail(500, 'Could not verify remaining grants; role left unchanged');
    }
    if (stillGranted.length > 0) {
      return {
        success: true,
        message: `User still has ${stillGranted.length} ${remaining.field} grant(s); keeping '${role}' role`,
      };
    }
  }

  const kcAdminClient = new KcAdminClient({
    baseUrl: keycloakConfig().url,
    realmName: 'master',
  });
  await authenticateKeycloakAdmin(kcAdminClient);
  kcAdminClient.setConfig({ realmName: 'edu-hub' });

  const hasuraClient = await kcAdminClient.clients.find({ clientId: 'hasura', first: 1 });
  if (!hasuraClient?.[0]?.id) {
    return fail(500, "Keycloak client 'hasura' not found");
  }

  // Only roles currently assigned to the user can be removed; resolve the role id from the user's
  // assigned client roles. If it is not assigned this is an idempotent no-op rather than an error.
  const assignedRoles = await kcAdminClient.users.listClientRoleMappings({
    id: userid,
    clientUniqueId: hasuraClient[0].id,
  });
  const targetRole = assignedRoles.find((it) => it.name === role);

  if (!targetRole) {
    return { success: true, message: `Role '${role}' not assigned to user; nothing to remove` };
  }

  await kcAdminClient.users.delClientRoleMappings({
    id: userid,
    clientUniqueId: hasuraClient[0].id,
    roles: [{ id: targetRole.id, name: targetRole.name }],
  });

  return { success: true, message: `Role '${role}' removed from user` };
};

/** @type {import('../lib/types.js').Handler} */
const removeKeycloakRole = async (req, logger) => {
  try {
    return await revoke(req, logger);
  } catch (error) {
    // The old unit let Keycloak errors escape as a 500, which Hasura retries.
    logger.error('removeKeycloakRole failed', { error: error.message });
    return fail(500, error.message);
  }
};

export default removeKeycloakRole;
