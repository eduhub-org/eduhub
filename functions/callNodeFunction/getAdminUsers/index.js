import axios from 'axios';
import { getKeycloakToken } from '../lib/utils.js';
import { logger } from '../index.js';

const getAdminUsers = async (req) => {
  try {
    const keycloakToken = await getKeycloakToken();
    const userId = req.body.userId;

    // Get user's role mappings directly
    console.log('Attempting to fetch user role mappings...');
    const userRoleMappings = await axios.get(
      `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}/role-mappings/clients/hasura`,
      {
        headers: {
          Authorization: `Bearer ${keycloakToken}`,
        },
      }
    );
    console.log('Successfully fetched user role mappings');

    const isAdmin = userRoleMappings.data.some(role => role.name === 'admin');

    return {
      success: true,
      isAdmin,
      messageKey: "GET_ADMIN_STATUS_SUCCESS"
    };

  } catch (error) {
    logger.error("Error checking admin status", { error: error.message, stack: error.stack });
    return {
      success: false,
      isAdmin: false,
      error: "ERROR_CHECKING_ADMIN_STATUS",
      messageKey: "GET_ADMIN_STATUS_FAILED"
    };
  }
};

export default getAdminUsers; 