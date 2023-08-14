import { fetchEnrollments } from "./certificateUtils.js";
import { generateAchievementCertificate } from "./generateAchievementCertificate.js";
import { generateAttendanceCertificate } from "./generateAttendanceCertificate.js";
import logger from "../index.js";

/**
 * Generates certificates for a given set of user IDs and course ID.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const createCertificate = async (req, res) => {
  const userIds = req.body.input.userIds;
  const courseId = req.body.input.courseId;
  const certificateType = req.body.input.certificateType;

  // Log input parameters
  logger.debug(
    `Input parameters: userIds=${userIds}, courseId=${courseId}, certificateType=${certificateType}`
  );

  // Fetch course enrollments
  const courseEnrollments = await fetchEnrollments(userIds, courseId);

  // Check if course enrollments is empty
  if (courseEnrollments.length === 0) {
    return res.json({
      result: 0,
    });
  }

  // Assign the appropriate certificate generation function
  let generateCertificate;
  if (certificateType === "achievement") {
    generateCertificate = generateAchievementCertificate;
  } else if (certificateType === "attendance") {
    generateCertificate = generateAttendanceCertificate;
  }

  // Generate certificates for each enrollment
  try {
    await Promise.all(
      courseEnrollments.map((enrollment) =>
        generateCertificate(enrollment, req.headers.bucket)
      )
    );
    logger.info(
      `${courseEnrollments.length} ${certificateType} certificate(s) generated`
    );
    return res.json({
      result: courseEnrollments.length,
    });
  } catch (error) {
    throw error;
  }
};

export default createCertificate;
