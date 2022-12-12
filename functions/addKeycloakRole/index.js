import KcAdminClient from '@keycloak/keycloak-admin-client';
import bodyParser from "body-parser";

export const addKeycloakRole = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
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

    const instructor_role = available_roles.filter(it => it.name === 'instructor')[0];

    await kcAdminClient.users.addClientRoleMappings({
      id: userid,
      clientUniqueId: hasura_client[0].id,
      roles: [
        {
          id: instructor_role.id,
          name: role,
        },
      ],
    });

    return res.json({

    });
  }
};
