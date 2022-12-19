const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require("../lib/cloud-storage");
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
    const filename = req.body.input.filename;
    const courseid = req.body.input.courseid;
    const isPublic = false;

    const path = `courseid_${courseid}/achievementOptionDocumentationTemplate/${filename}`;

    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );

    return res.json({
      link: link,
    });
  } else {
    return res.json({
      link: "error",
    });
  }
};
