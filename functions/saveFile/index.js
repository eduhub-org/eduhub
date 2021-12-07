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
exports.saveFile = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const filename = req.body.input.filename;
    
    const bucket = storage.bucket(req.headers.bucket);
    const path = util.format(
      `${filename}`
    );
    
    const file = bucket.file(filename);
    const fileBuffer = new Buffer(content, 'base64');
    
    await file.save(fileBuffer);
    
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
