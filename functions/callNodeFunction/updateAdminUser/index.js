import axios from 'axios';
import { getKeycloakToken } from '../lib/utils.js';
import { logger } from '../index.js';

const updateAdminUser = async (req) => {
  try {
    if (!req.body.input || !req.body.input.userId || req.body.input.isAdmin === undefined) {
      logger.error('Missing required fields: userId or isAdmin status');
      return {
        success: false,
        error: "ERROR_MISSING_REQUIRED_FIELDS",
        messageKey: "ADMIN_UPDATE_FAILED_MISSING_FIELDS"
      };
    }

    const { userId, isAdmin } = req.body.input;
    const keycloakToken = await getKeycloakToken();
    const authHeaders = { headers: { Authorization: `Bearer ${keycloakToken}` } };
    const jsonHeaders = {
      headers: { Authorization: `Bearer ${keycloakToken}`, 'Content-Type': 'application/json' },
    };
    const realmUrl = `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub`;

    // Super-admin is the "admin" role on the "hasura" client (not a realm role), matching
    // addKeycloakRole and the Hasura JWT role mapping. Resolve the client by clientId so we do not
    // depend on a hardcoded client uuid that differs between environments.
    const clientsResponse = await axios.get(`${realmUrl}/clients?clientId=hasura`, authHeaders);
    const hasuraClient = clientsResponse.data[0];
    if (!hasuraClient) {
      throw new Error('Hasura client not found in Keycloak');
    }

    const adminRoleResponse = await axios.get(
      `${realmUrl}/clients/${hasuraClient.id}/roles/admin`,
      authHeaders
    );
    const adminRole = adminRoleResponse.data;

    const userClientRolesUrl = `${realmUrl}/users/${userId}/role-mappings/clients/${hasuraClient.id}`;

    // Only add/remove when needed so the operation is idempotent.
    const currentRolesResponse = await axios.get(userClientRolesUrl, authHeaders);
    const hasAdminRole = currentRolesResponse.data.some((role) => role.name === 'admin');

    if (isAdmin && !hasAdminRole) {
      await axios.post(userClientRolesUrl, [adminRole], jsonHeaders);
    } else if (!isAdmin && hasAdminRole) {
      await axios.delete(userClientRolesUrl, { data: [adminRole], ...jsonHeaders });
    }

    logger.debug(`Successfully ${isAdmin ? 'added' : 'removed'} admin role for user ${userId}`);
    return {
      success: true,
      messageKey: "ADMIN_UPDATE_SUCCESS"
    };

  } catch (error) {
    logger.error("Error updating admin status", { error: error.message, stack: error.stack });
    return {
      success: false,
      error: "ERROR_UPDATING_ADMIN_STATUS",
      messageKey: "ADMIN_UPDATE_FAILED"
    };
  }
};

export default updateAdminUser;
