const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require("../lib/cloud-storage");
const storage = buildCloudStorage(Storage);

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.loadAchievementRecordDocumentation = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
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
