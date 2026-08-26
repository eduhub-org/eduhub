import KcAdminClient from '@keycloak/keycloak-admin-client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let secretsMatch;
try {
  ({ secretsMatch } = require('./shared_libs/node/security.cjs'));
} catch {
  ({ secretsMatch } = require('../shared_libs/node/security.cjs'));
}

export const addKeycloakRole = async (req, res) => {
  const expectedSecret = process.env.HASURA_CLOUD_FUNCTION_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ error: 'Server secret not configured' });
  }

  if (secretsMatch(req.headers.secret, expectedSecret)) {
    const kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      realmName: 'master',
    });
    const userid = req.body.event.data.new.userId;
    const role = req.headers.role;

    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_USER,
      password: process.env.KEYCLOAK_PW,
      grantType: 'password',
      clientId: 'admin-cli'
    });

    kcAdminClient.setConfig({
      realmName: 'edu-hub',
    });

    const hasura_client = await kcAdminClient.clients.find({
      clientId: 'hasura',
      first: 1,
    });
    
    const available_roles = await kcAdminClient.users.listAvailableClientRoleMappings({
      id: userid,
      clientUniqueId: hasura_client[0].id,
    });

    // Resolve the requested role (admin, instructor, org_admin, ...) by name so the correct
    // role id is sent. If the user already has the role it is no longer "available", so this is
    // an idempotent no-op rather than an error.
    const target_role = available_roles.filter(it => it.name === role)[0];

    if (!target_role) {
      return res.json({ message: `Role '${role}' not available for user (already assigned or unknown)` });
    }

    await kcAdminClient.users.addClientRoleMappings({
      id: userid,
      clientUniqueId: hasura_client[0].id,
      roles: [
        {
          id: target_role.id,
          name: target_role.name,
        },
      ],
    });

    return res.json({

    });
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
