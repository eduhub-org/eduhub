import { createRequire } from "module";
import { logger } from "../index.js";
import axios from "axios";
import { computeMatrixHandle } from "../lib/matrixHandle.js";

const require = createRequire(import.meta.url);
let mergeUserPutPayload;
try {
  ({ mergeUserPutPayload } = require("../shared_libs/node/keycloakUserMerge.cjs"));
} catch {
  ({ mergeUserPutPayload } = require("../../shared_libs/node/keycloakUserMerge.cjs"));
}

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
    const detail = error.response?.data;
    logger.error(
      `Error updating user in Keycloak: ${error.message}`,
      detail ? JSON.stringify(detail) : ""
    );
    
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
      } else {
        // Explicitly set empty array so Keycloak receives the removal when picture is cleared
        newAttributes.picture = [];
      }
    }

    const nameChanged = !!(updatedFields.firstName || updatedFields.lastName);
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

    let userResponse;
    try {
      userResponse = await axios.get(
        `${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}`,
        { headers: { Authorization: `Bearer ${keycloakToken}` } }
      );
    } catch (err) {
      logger.error(`Could not fetch user ${userId} from Keycloak: ${err.message}`);
      throw new Error(
        `Cannot update Keycloak user: failed to fetch existing user data: ${err.message}`
      );
    }

    const existing = userResponse.data;
    const existingAttrs = existing.attributes || {};
    const patch = { ...updatedFields };

    if (hasNewAttributes || nameChanged) {
      const mergedAttrs = { ...existingAttrs };
      if (hasNewAttributes) {
        Object.assign(mergedAttrs, newAttributes);
      }
      if (nameChanged && !existingAttrs.matrix_user_handle?.[0]) {
        const handle = computeMatrixHandle(
          newData.firstName,
          newData.lastName,
          userId
        );
        mergedAttrs.matrix_user_handle = [handle];
        logger.debug(`Will set matrix_user_handle for user ${userId}`);
      }
      patch.attributes = mergedAttrs;
    }

    const payload = mergeUserPutPayload(existing, patch);
    const updateResult = await updateKeycloakUser(userId, payload, keycloakToken);

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
