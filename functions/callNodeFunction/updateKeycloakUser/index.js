import { logger } from "../index.js";
import axios from "axios";
import { computeMatrixHandle } from "../lib/matrixHandle.js";

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
 * Resolves a picture path from the DB to a full public URL.
 * Legacy full URLs (http/https) are returned as-is.
 * Relative paths containing "/public/" are prefixed with STORAGE_BUCKET_PUBLIC_URL.
 */
const resolvePictureUrl = (picturePath) => {
  if (!picturePath) return null;
  if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
    return picturePath;
  }
  if (picturePath.startsWith('public/') || picturePath.includes('/public/')) {
    const bucketUrl = process.env.STORAGE_BUCKET_PUBLIC_URL;
    if (!bucketUrl) {
      logger.warn('STORAGE_BUCKET_PUBLIC_URL not set, cannot resolve picture URL');
      return null;
    }
    return `${bucketUrl}/${picturePath}`;
  }
  return null;
};

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

    const newAttributes = {};
    if (oldData.picture !== newData.picture) {
      const pictureUrl = resolvePictureUrl(newData.picture);
      if (pictureUrl) {
        newAttributes.picture = [pictureUrl];
      }
    }

    const nameChanged = updatedFields.firstName || updatedFields.lastName;
    const hasNewAttributes = Object.keys(newAttributes).length > 0;

    if (Object.keys(updatedFields).length === 0 && !hasNewAttributes) {
      logger.debug(`No relevant fields updated for userId: ${userId}`);
      return {
        success: true,
        messageKey: "UPDATE_SKIPPED",
        userId
      };
    }

    const keycloakToken = await getKeycloakToken();

    // Fetch current user to merge attributes (KC PUT replaces attributes entirely)
    const intendedAttributeUpdates = hasNewAttributes || nameChanged;
    if (intendedAttributeUpdates) {
      try {
        const userResponse = await axios.get(
          `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}`,
          { headers: { Authorization: `Bearer ${keycloakToken}` } }
        );
        const existingAttrs = userResponse.data.attributes || {};

        if (nameChanged && !existingAttrs.matrix_user_handle?.[0]) {
          const handle = computeMatrixHandle(
            newData.firstName,
            newData.lastName,
            userId
          );
          newAttributes.matrix_user_handle = [handle];
          logger.debug(`Will set matrix_user_handle for user ${userId}`);
        }

        if (Object.keys(newAttributes).length > 0) {
          updatedFields.attributes = { ...existingAttrs, ...newAttributes };
        }
      } catch (err) {
        logger.error(`Could not fetch user ${userId} from Keycloak: ${err.message}`);
        const failedUpdates = [];
        if (hasNewAttributes) failedUpdates.push('picture');
        if (nameChanged) failedUpdates.push('matrix_user_handle');

        if (Object.keys(updatedFields).length === 0) {
          throw new Error(
            `Cannot update Keycloak attributes (${failedUpdates.join(', ')}): ` +
            `failed to fetch existing user data: ${err.message}`
          );
        }

        logger.warn(
          `Proceeding with partial update for user ${userId}: ` +
          `attribute updates skipped (${failedUpdates.join(', ')})`
        );
      }
    }

    const attributeUpdateSkipped = intendedAttributeUpdates && !updatedFields.attributes;
    const updateResult = await updateKeycloakUser(userId, updatedFields, keycloakToken);

    if (updateResult && updateResult.notFound) {
      logger.warn(`User ${userId} not found in Keycloak, skipping update`);
      return {
        success: true,
        messageKey: "USER_NOT_FOUND_IN_KEYCLOAK",
        userId,
        details: "User not found in Keycloak, may have been deleted or never existed"
      };
    }

    if (attributeUpdateSkipped) {
      logger.warn(`Keycloak update partially completed for userId: ${userId} (attribute updates skipped)`);
      return {
        success: true,
        messageKey: "UPDATE_PARTIAL",
        userId,
        details: "Basic fields updated but Keycloak attribute sync failed (picture/matrix_user_handle)"
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
