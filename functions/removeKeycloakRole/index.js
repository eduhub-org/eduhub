import KcAdminClient from '@keycloak/keycloak-admin-client';
import { GraphQLClient } from 'graphql-request';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let secretsMatch;
try {
  ({ secretsMatch } = require('./shared_libs/node/security.cjs'));
} catch {
  ({ secretsMatch } = require('../shared_libs/node/security.cjs'));
}

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

// Counterpart to addKeycloakRole: invoked from a Hasura DELETE event trigger to revoke a Keycloak
// client role once the backing grant is removed. The role to revoke is passed via the `role`
// header (e.g. `org_admin`), exactly like addKeycloakRole, so the same function serves any role.
export const removeKeycloakRole = async (req, res) => {
  const expectedSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: 'Server secret not configured' });
  }

  if (!secretsMatch(req.headers.secret, expectedSecret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // DELETE events carry the removed row under `data.old`.
  const userid = req.body?.event?.data?.old?.userId;
  const role = req.headers.role;

  if (!userid) {
    return res.status(400).json({ error: 'No userId in event payload' });
  }
  if (!role) {
    return res.status(400).json({ error: 'No role header provided' });
  }

  // If the role is backed by a source-of-truth table, only revoke it once the user has no rows left
  // there. This keeps the role for users who still hold an equivalent grant (e.g. admin of another
  // organization, or instructor of another course).
  const remaining = REMAINING_GRANT_QUERIES[role];
  if (remaining) {
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
        'X-Hasura-Role': 'admin',
      },
    });

    let stillGranted = null;
    try {
      const response = await client.request(remaining.query, { id: userid });
      stillGranted = response[remaining.field];
    } catch (error) {
      console.error(error);
    }

    if (stillGranted == null) {
      // Could not determine the remaining grants; fail rather than risk wrongly revoking the role.
      return res.status(500).json({ error: 'Could not verify remaining grants; role left unchanged' });
    }
    if (stillGranted.length > 0) {
      return res.json({
        message: `User still has ${stillGranted.length} ${remaining.field} grant(s); keeping '${role}' role`,
      });
    }
  }

  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: 'master',
  });

  await kcAdminClient.auth({
    username: process.env.KEYCLOAK_USER,
    password: process.env.KEYCLOAK_PW,
    grantType: 'password',
    clientId: 'admin-cli',
  });

  kcAdminClient.setConfig({
    realmName: 'edu-hub',
  });

  const hasura_client = await kcAdminClient.clients.find({
    clientId: 'hasura',
    first: 1,
  });

  if (!hasura_client?.[0]?.id) {
    return res.status(500).json({ error: "Keycloak client 'hasura' not found" });
  }

  // Only roles currently assigned to the user can be removed; resolve the role id from the user's
  // assigned client roles. If it is not assigned this is an idempotent no-op rather than an error.
  const assigned_roles = await kcAdminClient.users.listClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
  });

  const target_role = assigned_roles.filter(it => it.name === role)[0];

  if (!target_role) {
    return res.json({ message: `Role '${role}' not assigned to user; nothing to remove` });
  }

  await kcAdminClient.users.delClientRoleMappings({
    id: userid,
    clientUniqueId: hasura_client[0].id,
    roles: [
      {
        id: target_role.id,
        name: target_role.name,
      },
    ],
  });

  return res.json({ message: `Role '${role}' removed from user` });
};
