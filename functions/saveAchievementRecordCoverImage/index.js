const bodyParser = require("body-parser");
const {Storage} = require('@google-cloud/storage');
const util = require('util');

const { saveToBucket } = require("./lib/eduHub.js");

const storage = new Storage();

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
    const bucket = storage.bucket(req.headers.bucket);
    
    const path = `public/achievementrecordid_${achievementRecordId}/cover_image/${filename}`;
    
    const link = await saveToBucket(path, bucket, content, isPublic);
    
    return res.json({
      path: link,
      google_link: link
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret"
    });
  }
};
