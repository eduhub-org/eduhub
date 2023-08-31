import got from "got";
import { request, gql } from "graphql-request";
import logger from "../index.js";
import {
  getStorageBucketURL,
  saveCertificateToBucket,
  updateCourseEnrollmentRecord,
} from "./certificateUtils.js";

/**
 * Generates an achievement certificate for a user.
 *
 * @param {Object} courseEnrollment The course enrollment data for the user.
 * @param {string} bucket The name of the Google Cloud bucket to save the certificate to.
 * @returns {Promise<void>} A promise that resolves when the certificate has been generated and saved.
 */
export const generateAchievementCertificate = async (
  courseEnrollment,
  bucket
) => {
  try {
    // Set online_courses and practical_project according to recordType
    const recordType =
      courseEnrollment.User.AchievementRecordAuthors[0].AchievementRecord
        .AchievementOption.recordType;
    const recordTitle =
      courseEnrollment.User.AchievementRecordAuthors[0].AchievementRecord
        .AchievementOption.title;
    const online_courses = recordType === "ONLINE_COURSE" ? recordTitle : "";
    const practical_project = recordType === "DOCUMENTATION" ? recordTitle : "";

    // Set certificate text to learning goals or empty string if learning goals is null
    const certificate = (courseEnrollment.Course.learningGoals || "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `- ${line.trim()}`)
      .join("\n");

    // Get the certificate template URL
    const certificateTemplateURL = await getStorageBucketURL(courseEnrollment.Course.Program.achievementCertificateTemplateURL, bucket)

    // Log the certificate template URL
    logger.debug(
      `Certificate template URL retrieved: ${certificateTemplateURL}`
    );
      
    // Construct the certificateData object for the certificate generation request
    const certificateData = {
      json: {
        template: certificateTemplateURL[0],
        full_name: `${courseEnrollment.User.firstName} ${courseEnrollment.User.lastName}`,
        semester: courseEnrollment.Course.Program.title,
        course_name: courseEnrollment.Course.title,
        ects: courseEnrollment.Course.ects,
        practical_project: practical_project,
        online_courses: online_courses,
        certificate_text: certificate,
      },
    };
    logger.debug(`Certificate data: ${JSON.stringify(certificateData)}`);

    // Send the certificate generation request to the certificate generation service
    const url = "https://edu-old.opencampus.sh/create_certificate_rest";
    const generatedCertificate = await got.post(url, certificateData).json();

    // Log the generated certificate
    logger.debug(
      `Generated achievement certificate for user ${courseEnrollment.User.id} and course ${courseEnrollment.Course.id}`
    );

    // Save the certificate to the Google Cloud Storage bucket
    const path = await saveCertificateToBucket(
      generatedCertificate,
      'achievement',
      courseEnrollment.User.id,
      courseEnrollment.Course.id,
      bucket,
      false,
    );

    // Update the course enrollment record with the certificate URL
    await updateCourseEnrollmentRecord(
      courseEnrollment.User.id,
      courseEnrollment.Course.id,
      "achievementCertificateURL",
      path
    );
  } catch (error) {
    throw error;
  }
};
