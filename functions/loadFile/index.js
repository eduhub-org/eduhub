const bodyParser = require("body-parser");
const {Storage} = require('@google-cloud/storage');
const util = require('util');

const storage = new Storage();

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.loadFile = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const path = req.body.input.path;
    const bucket = storage.bucket(req.headers.bucket);
    
    const file = bucket.file(path);
    
    const link = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 1000 * 60 * 5)
    });
    
    return res.json({
      link: link
    });
  } else {
    return res.json({
      link: "error"
    });
  }
};
