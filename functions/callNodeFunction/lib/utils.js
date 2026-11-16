import axios from 'axios';
import { logger } from './logger.js';
import * as config from './config.js';

export function replacePlaceholders(str, values) {
  return Object.keys(values).reduce((currentStr, key) => {
    const placeholder = `\\$\\{${key}\\}`;
    return currentStr.replace(new RegExp(placeholder, "g"), values[key]);
  }, str);
}

export const getKeycloakToken = async () => {
  try {
    const response = await axios.post(
      `${config.keycloakConfig().url}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: config.keycloakConfig().username,
        password: config.keycloakConfig().password,
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
