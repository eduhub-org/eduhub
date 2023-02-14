const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require(process.env.LIBRARY_PATH
  ? process.env.LIBRARY_PATH
  : "./lib/cloud-storage");
const storage = buildCloudStorage(Storage);

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.saveAchievementOptionDocumentationTemplate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const achievementOptionId = req.body.input.achievementOptionId;
    const isPublic = false;

    const path = `achievementOptionId_${achievementOptionId}/achievementOptionDocumentationTemplate/${achievementOptionId}.doc`;

    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );

    return res.json({
      path: path,
      google_link: link,
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret",
    });
  }
};
