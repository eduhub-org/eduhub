const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require((process.env.LIBRARY_PATH) ? process.env.LIBRARY_PATH : "./lib/cloud-storage");
const storage = buildCloudStorage(Storage);
const im = require("imagemagick");
const fs = require("fs");


function resizeImage(filename, filename_for_size, size){
    return new Promise((resolve, reject) => {
      im.resize({
        srcPath: filename,
        dstPath: filename_for_size,
        width: size
      }, function(err, stdout, stderr){
        if(err) {
            reject(err)
        }
        resolve(stdout);
      });
  })
}


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
    
    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );
    
    fs.writeFile(filename, content, 'base64', function(err) {
      console.log(err);
    });
    
    const nameparts = filename.split(".");
    const sizes = [460, 640, 768, 1024, 1280, 1536]
    
    var filename_for_size;
    var path_for_size;

    for (const size of sizes) {
      filename_for_size = nameparts[0] + "-" + size.toString() + "." + nameparts[1];
      path_for_size = `public/courseid_${courseid}/cover_image/${filename_for_size}`;
      await resizeImage(filename, filename_for_size, size);
      filecontent = await fs.readFileSync(filename_for_size , {encoding: 'base64'});
      await storage.saveToBucket(
          path_for_size,
          req.headers.bucket,
          filecontent,
          isPublic
      );
    };
    
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
