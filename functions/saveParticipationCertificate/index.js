const { Storage } = require("@google-cloud/storage");
const { buildCloudStorage } = require("../lib/cloud-storage");
const storage = buildCloudStorage(Storage);

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

    const path = `userid_${userid}/courseid_${courseid}/participation_certificate_course_${courseid}.pdf`;

    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );

    return res.json({
      path: path,
      google_link: link,
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret",
    });
  }
};
