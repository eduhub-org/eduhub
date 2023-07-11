import { fetchEnrollments } from "./fetchEnrollments.js";
import { generateCertificate } from "./generateCertificate.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export const createAchievementCertificate = async (req, res) => {
  try {
    if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
      const userIds = req.body.input.userIds;
      const courseId = req.body.input.courseId;

      // log userId and courseid
      console.log("############# User Ids: ", userIds);
      console.log("############# Course Id: ", courseId);

      // get course enrollments
      const courseEnrollments = await fetchEnrollments(userIds, courseId);

      // log length of courseEnrollments
      console.log(
        "############# Course Enrollments Length: ",
        courseEnrollments.length
      );

      // Check if data.CourseEnrollment is empty
      if (courseEnrollments.length === 0) {
        return res.json({
          result: 0,
        });
      }

      // call function to generate certificate
      courseEnrollments.forEach(async (enrollment) => {
        const certificateData = await generateCertificate(
          enrollment,
          req.headers.bucket
        );
      });

      return res.json({
        result: courseEnrollments.length,
      });
    } else {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
