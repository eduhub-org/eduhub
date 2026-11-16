import axios from 'axios';
import { keycloakConfig } from './config.js';
import { logger } from './logger.js';

/**
 * Admin access token from Keycloak's master realm (admin-cli password grant),
 * for calls to the Keycloak admin REST API.
 * @returns {Promise<string>}
 */
export const getKeycloakToken = async () => {
  const { url, username, password } = keycloakConfig();
  try {
    const response = await axios.post(
      `${url}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username,
        password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting Keycloak token', error);
    throw error;
  }
};

/**
 * Logs a @keycloak/keycloak-admin-client instance in as the master-realm
 * admin (same credentials as getKeycloakToken).
 * @param {{ auth: (credentials: object) => Promise<void> }} kcAdminClient
 */
export const authenticateKeycloakAdmin = async (kcAdminClient) => {
  const { username, password } = keycloakConfig();
  await kcAdminClient.auth({
    username,
    password,
    grantType: 'password',
    clientId: 'admin-cli',
  });
};
