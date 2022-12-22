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
exports.saveParticipationCertificate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const courseid = req.body.input.courseid;
    const userid = req.body.input.userid;
    const isPublic = false;
    const bucket = storage.bucket(req.headers.bucket);
    
    const path = `userid_${userid}/courseid_${courseid}/participation_certificate_course_${courseid}.pdf`;
    
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
