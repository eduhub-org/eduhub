import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const loadFile = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const storage = buildCloudStorage(Storage);
    const path = req.body.input.path;
    const link = await storage.loadFromBucket(path, req.headers.bucket);

    return res.json({
      link: link,
    });
  } else {
    return res.json({
      link: "error",
    });
  }
};

export default loadFile;
