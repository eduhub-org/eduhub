const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require((process.env.LIBRARY_PATH) ? process.env.LIBRARY_PATH : "./lib/cloud-storage");
const storage = buildCloudStorage(Storage);
const im = require("imagemagick");
const fs = require("fs");

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.saveCourseImage = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const content = req.body.input.base64file;
    const filename = req.body.input.filename;
    const courseid = req.body.input.courseid;
    const isPublic = true;

    const path = `public/courseid_${courseid}/cover_image/${filename}`;
    
    //test for resizing with imagemagick
    /* const pathsmall = `public/courseid_${courseid}/cover_image/small_${filename}`;
    
    fs.writeFile(filename, content, 'base64', function(err) {
      console.log(err);
    });
    
    im.resize({
      srcPath: filename,
      dstPath: 'small-' + filename,
      width:   256
    }, function(err, stdout, stderr){
      if (err) throw err;
    });
    */
    
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
