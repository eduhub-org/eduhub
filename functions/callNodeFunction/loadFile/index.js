import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const loadFile = async (req, res) => {

  const storage = buildCloudStorage(Storage);
  const path = req.body.input.path;
  const userRole = req.body.session_variables['x-hasura-role'];
  const userUUID = req.body.session_variables['x-hasura-user-id'];

  try {
    // Admin users or users accessing their own folder
    if (userRole === 'admin' || (userUUID && path.startsWith(userUUID))) {
      const link = await storage.loadFromBucket(path, req.headers.bucket);
      return res.json({ link });
    } else {
      // Access denied for other cases
      return res.status(403).json({
        message: "You do not have permission to access this file.",
      });
    }
  } catch (error) {
    // Handle errors, such as issues with loading the file
    return res.status(500).json({
      error: "An error occurred while retrieving the file.",
    });
  }
};

export default loadFile;
