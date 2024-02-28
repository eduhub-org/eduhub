import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";
import logger from "../index.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const getSignedUrl = async (req, res) => {

  const storage = buildCloudStorage(Storage);
  const path = req.body.input.path;
  const userRole = req.body.session_variables['x-hasura-role'];
  const userUUID = req.body.session_variables['x-hasura-user-id'];

  try {
    // Admin users or users accessing their own data
    if (userRole === 'admin' ||
       (userUUID && path.includes("/user-" + userUUID + "/")) ||
       (userUUID && path.startsWith(userUUID + "/")) || // included for legacy names
       (userUUID && path.startsWith("/user-" + userUUID + "/"))) { // included for legacy names
      const link = await storage.loadFromBucket(path, req.headers.bucket);
      logger.info("File loaded successfully", { path, userRole, userUUID, link });
      return res.json({ link });
    } else {
      // Access denied for other cases
      logger.warn("Access denied for file loading", { path, userRole, userUUID });
      return res.status(403).json({
        message: "You do not have permission to access this file.",
      });
    }
  } catch (error) {
    // Handle errors, such as issues with loading the file
    logger.error("Error loading file", { error: error.message, path, userRole, userUUID, stack: error.stack });
    return res.status(500).json({
      error: "An error occurred while retrieving the file.",
    });
  }
};

export default getSignedUrl;
