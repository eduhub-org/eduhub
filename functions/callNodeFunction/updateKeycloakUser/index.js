import { logger } from "../index.js";
import axios from "axios";

const getKeycloakToken = async () => {
  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: process.env.KEYCLOAK_USER || 'keycloak',
        password: process.env.KEYCLOAK_PW,
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

const updateKeycloakUser = async (userId, updatedFields, token) => {
  try {
    await axios.put(
      `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}`,
      updatedFields,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    logger.debug(`Updated user in Keycloak: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error updating user in Keycloak: ${error.message}`);
    
    // Prüfen, ob es sich um einen 404-Fehler handelt (Benutzer nicht gefunden)
    if (error.response && error.response.status === 404) {
      logger.warn(`User not found in Keycloak: ${userId}. User might have been deleted or never existed.`);
      // Wir geben ein spezielles Objekt zurück, anstatt einen Fehler zu werfen
      return {
        success: false,
        notFound: true,
        message: "User not found in Keycloak"
      };
    }
    
    throw error;
  }
};

/**
 * Updates user information in Keycloak when user data changes in the database.
 *
 * @param {Object} req Request object containing:
 *   - body.event.data.old (Object): Previous user data
 *   - body.event.data.new (Object): Updated user data containing:
 *     - id (string): User ID
 *     - firstName (string, optional): User's first name
 *     - lastName (string, optional): User's last name
 *     - email (string, optional): User's email
 * @returns {Object} Response containing:
 *   - success (boolean): Whether the operation was successful
 *   - messageKey (string): Translation key for messages
 *   - error (string, optional): Error message if operation failed
 *   - userId (string, optional): ID of the updated user
 */
const updateKeycloakUserHandler = async (req) => {
  logger.info("########## Update Keycloak User ##########");
  logger.debug("Request parameters", { 
    eventData: req.body.event?.data 
  });

  try {
    if (!req.body.event || !req.body.event.data) {
      logger.error("Missing required event data");
      return {
        success: false,
        messageKey: "INVALID_INPUT",
        error: "Missing required event data"
      };
    }

    const { old: oldData, new: newData } = req.body.event.data;
    const userId = newData.id;

    const updatedFields = {};
    if (oldData.firstName !== newData.firstName) updatedFields.firstName = newData.firstName;
    if (oldData.lastName !== newData.lastName) updatedFields.lastName = newData.lastName;
    if (oldData.email !== newData.email) updatedFields.email = newData.email;

    if (Object.keys(updatedFields).length === 0) {
      logger.debug(`No relevant fields updated for userId: ${userId}`);
      return {
        success: true,
        messageKey: "UPDATE_SKIPPED",
        userId
      };
    }

    const keycloakToken = await getKeycloakToken();
    const updateResult = await updateKeycloakUser(userId, updatedFields, keycloakToken);

    // Prüfen, ob der Benutzer nicht gefunden wurde
    if (updateResult && updateResult.notFound) {
      logger.warn(`User ${userId} not found in Keycloak, skipping update`);
      return {
        success: true,
        messageKey: "USER_NOT_FOUND_IN_KEYCLOAK",
        userId,
        details: "User not found in Keycloak, may have been deleted or never existed"
      };
    }

    logger.debug(`Keycloak update process completed for userId: ${userId}`);
    return {
      success: true,
      messageKey: "UPDATE_SUCCESS",
      userId
    };

  } catch (error) {
    logger.error("Error updating user in Keycloak", { 
      error: error.message, 
      stack: error.stack 
    });
    return {
      success: false,
      messageKey: "UPDATE_FAILED",
      error: "Failed to update user in Keycloak",
      details: error.message
    };
  }
};

export default updateKeycloakUserHandler;
