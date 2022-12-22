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
exports.saveAchievementCertificateTemplate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const filename = req.body.input.filename;
    const programid = req.body.input.programid;
    const isPublic = false;
    const bucket = storage.bucket(req.headers.bucket);
    
    const path = `programid_${programid}/achievement_certificate_template/${filename}`;
    
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
