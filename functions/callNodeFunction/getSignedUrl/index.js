import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { getBucket } from "../lib/requestHeaders.js";
import { logger } from "../lib/logger.js";
import { canAccessPath } from "./access.js";

/**
 * Gets a signed URL for accessing a file in cloud storage.
 *
 * @param {Object} req Request object containing:
 *   - input.path (string): Path to the file in storage
 *   - session_variables['x-hasura-role'] (string): User role
 *   - session_variables['x-hasura-user-id'] (string): User UUID
 * @returns {Object} Response containing:
 *   - success (boolean): Whether the operation was successful
 *   - messageKey (string): Translation key for messages
 *   - error (string, optional): Error message if operation failed
 *   - link (string, optional): The generated signed URL if successful
 *   - httpStatus (number, on failure): 403 when access is denied, 500 when
 *     the file cannot be loaded. The action's output type only has a
 *     required `link`, so a 200 without one fails Hasura's validation;
 *     a non-2xx answer reaches the client as a normal GraphQL error.
 */
const getSignedUrl = async (req) => {
  logger.info("########## Get Signed URL ##########");
  logger.debug("Request parameters", { 
    path: req.body.input.path,
    role: req.body.session_variables['x-hasura-role'],
    userId: req.body.session_variables['x-hasura-user-id']
  });

  const storage = buildCloudStorage(Storage);
  const path = req.body.input.path;
  const userRole = req.body.session_variables['x-hasura-role'];
  const userUUID = req.body.session_variables['x-hasura-user-id'];

  try {
    // Admins, instructors, or users accessing their own data (see access.js)
    if (canAccessPath(path, userRole, userUUID)) {
      const link = await storage.loadFromBucket(path, getBucket(req));
      logger.info("File access granted", { path, userRole, userUUID });
      return {
        success: true,
        messageKey: "FILE_ACCESS_GRANTED",
        link
      };
    } else {
      // Access denied for other cases
      logger.warn("Access denied for file loading", { path, userRole, userUUID });
      return {
        httpStatus: 403,
        success: false,
        messageKey: "FILE_ACCESS_DENIED",
        error: "You do not have permission to access this file."
      };
    }
  } catch (error) {
    // Handle errors, such as issues with loading the file
    logger.error("Error loading file", { 
      error: error.message, 
      path, 
      userRole, 
      userUUID, 
      stack: error.stack 
    });
    return {
      httpStatus: 500,
      success: false,
      messageKey: "FILE_LOAD_ERROR",
      error: "An error occurred while retrieving the file."
    };
  }
};

export default getSignedUrl;
