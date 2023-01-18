const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require((process.env.LIBRARY_PATH) ? process.env.LIBRARY_PATH : "./lib/cloud-storage");
const storage = buildCloudStorage(Storage);

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.saveAchievementRecordCoverImage = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const filename = req.body.input.filename;
    const achievementRecordId = req.body.input.achievementRecordId;
    const isPublic = true;

    const path = `public/achievementrecordid_${achievementRecordId}/cover_image/${filename}`;

    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );

    return res.json({
      path: link,
      google_link: link,
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret",
    });
  }
};
