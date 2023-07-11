import { fetchEnrollments } from "./fetchEnrollments.js";
import { generateCertificate } from "./generateCertificate.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export const createAchievementCertificate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const userIds = req.body.input.userIds;
    const courseId = req.body.input.courseId;

    // log userId and courseid
    console.log("############# User Ids: ", userIds);
    console.log("############# Course Id: ", courseId);

    // get course enrollments
    const courseEnrollments = await fetchEnrollments(userIds, courseId);

    console.log("############# Course Enrollments: ", courseEnrollments);

    // log length of courseEnrollments
    console.log(
      "############# Course Enrollments Length: ",
      courseEnrollments.length
    );

    // Check if data.CourseEnrollment is empty
    if (courseEnrollments.length == 0) {
      return res.json({
        result: "no-certificates-to-generate",
      });
    }

    const n = 0;

    // call function to generate certificate
    const certificateData = await generateCertificate(
      courseEnrollments[n],
      req.headers.bucket
    );

    //return result including the number of certificates generated
    const numCertificatesGenerated = data.CourseEnrollment.length;
    return res.json({
      result: `${numCertificatesGenerated} certificate(s) generated`,
    });
  } else {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
};
