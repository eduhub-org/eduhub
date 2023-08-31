import got from "got";
import logger from "../index.js";
import {
  getStorageBucketURL,
  saveCertificateToBucket,
  updateCourseEnrollmentRecord,
  getAttendandedSessions
} from "./certificateUtils.js";

/**
 * Generates an attendance certificate for a given course enrollment and saves it to a Google Cloud Storage bucket.
 *
 * @param {Object} courseEnrollment The course enrollment object.
 * @param {string} bucket The name of the Google Cloud Storage bucket to save the certificate to.
 */
export const generateAttendanceCertificate = async (
  courseEnrollment,
  bucket
) => {
  try {
    // Construct the certificateData object for the certificate generation request

    const certificateTemplateUrl = await getStorageBucketURL(courseEnrollment.Course.Program.attendanceCertificateTemplateURL, bucket);

    // Get the attendend session titles
    const sessionTitles = getAttendandedSessions(courseEnrollment, courseEnrollment.Course.Sessions)
    const certificateData = {
      json: {
        template: certificateTemplateUrl[0],
        full_name: `${courseEnrollment.User.firstName} ${courseEnrollment.User.lastName}`,
        semester: courseEnrollment.Course.Program.title,
        course_name: courseEnrollment.Course.title,
        event_entries: sessionTitles,
      },
    };
    logger.debug(`Certificate data: ${JSON.stringify(certificateData)}`);

    // Send the certificate generation request to the certificate generation service
    const url =
      "https://edu-old.opencampus.sh/create_attendence_certificate_rest";
    const generatedCertificate = await got.post(url, certificateData).json();

    // Log the certificate data
    logger.debug(
      `Generated attendance certificate for user ${courseEnrollment.User.id} and course ${courseEnrollment.Course.id}`
    );

    // Save the certificate to the Google Cloud Storage bucket
    const path = await saveCertificateToBucket(
      generatedCertificate,
      'attendance',
      courseEnrollment.User.id,
      courseEnrollment.Course.id,
      bucket,
      false
    );

    // Update the course enrollment record with the certificate URL
    await updateCourseEnrollmentRecord(
      courseEnrollment.User.id,
      courseEnrollment.Course.id,
      "attendanceCertificateURL",
      path
    );
  } catch (error) {
    throw error;
  }
};
