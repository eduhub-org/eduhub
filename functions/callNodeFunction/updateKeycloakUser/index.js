import { request, gql } from "graphql-request";
import logger from "../index.js";
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
    throw error;
  }
};

const updateKeycloakUserHandler = async (req, logger) => {
  let status = 200;
  const result = {
    updatedUserId: null,
    messageKey: "",
    error: null,
  };

  try {
    if (!req.body.event || !req.body.event.data) {
      logger.error("Missing required event data");
      status = 400;
      result.error = "ERROR_MISSING_EVENT_DATA";
      result.messageKey = "UPDATE_FAILED_MISSING_EVENT_DATA";
      return { status, result };
    }

    const { old: oldData, new: newData } = req.body.event.data;
    const userId = newData.id;
    result.updatedUserId = userId;

    const updatedFields = {};
    if (oldData.firstName !== newData.firstName) updatedFields.firstName = newData.firstName;
    if (oldData.lastName !== newData.lastName) updatedFields.lastName = newData.lastName;
    if (oldData.email !== newData.email) updatedFields.email = newData.email;

    if (Object.keys(updatedFields).length === 0) {
      logger.debug(`No relevant fields updated for userId: ${userId}`);
      result.messageKey = "UPDATE_SKIPPED_NO_RELEVANT_CHANGES";
      return { status, result };
    }

    const keycloakToken = await getKeycloakToken();
    await updateKeycloakUser(userId, updatedFields, keycloakToken);

    logger.debug(`Keycloak update process completed for userId: ${userId}`);
    result.messageKey = "UPDATE_SUCCESS";

    return { status, result };

  } catch (error) {
    logger.error("Error updating user in Keycloak", { error: error.message, stack: error.stack });
    status = error.status || 500;
    result.error = "ERROR_UPDATING_KEYCLOAK_USER";
    result.messageKey = "UPDATE_FAILED_GENERAL_ERROR";
    result.details = error.message;
    
    return { status, result };
  }
};

export default updateKeycloakUserHandler;
