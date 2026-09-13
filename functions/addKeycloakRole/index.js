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
      // "Not available" conflates two very different situations, and reporting both as 200
      // hid a real fault: `org_admin` was never defined on the production hasura client, so
      // every OrganizationAdmin insert reported success while granting nothing. Separate them
      // — an already-assigned role is a legitimate no-op, an undefined role is a config error
      // that must fail loudly so the event trigger retries and surfaces in the queue.
      const defined_roles = await kcAdminClient.clients.listRoles({
        id: hasura_client[0].id,
      });

      if (!defined_roles.some(it => it.name === role)) {
        console.error(`Role '${role}' is not defined on the hasura client — cannot grant it`);
        return res.status(500).json({
          error: `Role '${role}' is not defined on the hasura client`,
        });
      }

      return res.json({ message: `Role '${role}' already assigned to user` });
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
