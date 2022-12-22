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
exports.saveAchievementOptionDocumentationTemplate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const filename = req.body.input.filename;
    const courseid = req.body.input.courseid;
    const isPublic = false;
    const bucket = storage.bucket(req.headers.bucket);
    
    const path = `courseid_${courseId}/achievementOptionDocumentationTemplate/${filename}`;
    
    const link = await saveToBucket(path, bucket, content, isPublic);
    
    return res.json({
      path: path,
      google_link: link
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret"
    });
  }
};
