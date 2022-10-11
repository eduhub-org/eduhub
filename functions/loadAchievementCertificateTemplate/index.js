const bodyParser = require("body-parser");
const {Storage} = require('@google-cloud/storage');
const util = require('util');

const { loadFromBucket } = require("./lib/eduHub.js");

const storage = new Storage();

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.loadAchievementCertificateTemplate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const path = req.body.input.path;
    const bucket = storage.bucket(req.headers.bucket);
    
    const link = await loadFromBucket(path, bucket); 
    
    return res.json({
      link: link
    });
  } else {
    return res.json({
      link: "error"
    });
  }
};
