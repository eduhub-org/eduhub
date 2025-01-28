import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import { logger } from "../index.js";

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
 *   - signedUrl (string, optional): The generated signed URL if successful
 */
const getSignedUrl = async (req) => {
  logger.info("########## Get Signed URL ##########");
  logger.debug("Request parameters", {
    input: req.body.input,
    role: req.body.session_variables['x-hasura-role'],
    userId: req.body.session_variables['x-hasura-user-id']
  });

  const storage = buildCloudStorage(Storage);
  const path = req.body.input.path;
  const userRole = req.body.session_variables['x-hasura-role'];
  const userUUID = req.body.session_variables['x-hasura-user-id'];

  try {
    // Admin users or users accessing their own data
    if (userRole === 'admin' ||
        userRole === 'instructor' ||
       (userUUID && path.includes("/user-" + userUUID + "/")) ||
       (userUUID && path.startsWith(userUUID + "/")) || // included for legacy names
       (userUUID && path.startsWith("/user-" + userUUID + "/"))) { // included for legacy names
      const signedUrl = await storage.loadFromBucket(path, req.headers.bucket);
      logger.info("Operation successful", {
        path,
        userRole,
        userId: userUUID
      });
      return {
        success: true,
        messageKey: "FILE_ACCESS_GRANTED",
        signedUrl
      };
    } else {
      logger.warn("Access denied", {
        path,
        userRole,
        userId: userUUID
      });
      return {
        success: false,
        messageKey: "UNAUTHORIZED",
        error: "You do not have permission to access this file."
      };
    }
  } catch (error) {
    logger.error("Operation failed", {
      error: error.message,
      stack: error.stack,
      path,
      userRole,
      userId: userUUID
    });
    return {
      success: false,
      messageKey: "OPERATION_FAILED",
      error: "An error occurred while retrieving the file."
    };
  }
};

export default getSignedUrl;
