import axios from 'axios';
import { getKeycloakToken } from '../lib/utils.js';
import { logger } from '../index.js';

const getAdminUsers = async (req) => {
  try {
    const keycloakToken = await getKeycloakToken();
    const authHeaders = { headers: { Authorization: `Bearer ${keycloakToken}` } };
    const realmUrl = `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub`;

    // Super-admin is modeled as the "admin" role on the "hasura" client (not a realm role),
    // matching addKeycloakRole and the Hasura JWT role mapping. Resolve the client by clientId so we
    // do not depend on a hardcoded client uuid that differs between environments.
    const clientsResponse = await axios.get(`${realmUrl}/clients?clientId=hasura`, authHeaders);
    const hasuraClient = clientsResponse.data[0];
    if (!hasuraClient) {
      throw new Error('Hasura client not found in Keycloak');
    }

    const adminRoleUsers = await axios.get(
      `${realmUrl}/clients/${hasuraClient.id}/roles/admin/users`,
      authHeaders
    );

    const adminUserIds = adminRoleUsers.data.map((user) => user.id);

    return {
      success: true,
      adminUserIds,
      messageKey: "GET_ADMIN_USERS_SUCCESS"
    };

  } catch (error) {
    logger.error("Error getting admin users", { error: error.message, stack: error.stack });
    return {
      success: false,
      adminUserIds: [],
      error: "ERROR_GETTING_ADMIN_USERS",
      messageKey: "GET_ADMIN_USERS_FAILED"
    };
  }
};

export default getAdminUsers;
