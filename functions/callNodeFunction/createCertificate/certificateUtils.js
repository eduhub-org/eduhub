import { Storage } from "@google-cloud/storage";
import logger from "../index.js";
import { request, gql } from "graphql-request";
import { buildCloudStorage } from "../lib/cloud-storage.js";

/**
 * Saves a certificate to a Google Cloud Storage bucket.
 *
 * @param {Object} certificateData The certificate data object returned by the certificate generation service.
 * @param {string} userId The ID of the user associated with the certificate.
 * @param {number} courseId The ID of the course associated with the certificate.
 * @param {string} bucket The name of the Google Cloud Storage bucket to save the certificate to.
 * @param {boolean} isPublic A boolean indicating whether the certificate should be publicly accessible.
 * @returns {Promise<string>} A Promise that resolves to the URL of the saved certificate.
 */
export const saveCertificateToBucket = async (
  certificateData,
  certificateType,
  userId,
  courseId,
  bucket,
  isPublic
) => {
  try {
    // const libraryPath = process.env.LIBRARY_PATH
    //   ? `../${process.env.LIBRARY_PATH}`
    //   : "./lib/cloud-storage.js";
    // const { buildCloudStorage } = await import(libraryPath);

    const storage = buildCloudStorage(Storage);
    const content = certificateData.pdf;
    const path = `${userId}/${courseId}/${certificateType}_certificate_${courseId}.pdf`;

    const link = await storage.saveToBucket(path, bucket, content, isPublic);
    logger.debug(
      `Saved certificate for user ${userId} and course ${courseId} to ${link}`
    );

    return link;
  } catch (error) {
    logger.error(
      `Failed to save certificate for user ${userId} and course ${courseId}: ${error}`
    );
    throw error;
  }
};

/**
 * Updates a course enrollment record with a new value for a given field.
 *
 * @param {string} userId The ID of the user associated with the course enrollment record.
 * @param {number} courseId The ID of the course associated with the course enrollment record.
 * @param {string} field The name of the field to update.
 * @param {any} value The new value for the field.
 */
export const updateCourseEnrollmentRecord = async (
  userId,
  courseId,
  field,
  value
) => {
  try {
    const mutation = gql`
      mutation UpdateEnrollment(
        $userId: uuid!
        $courseId: Int!
        $value: String!
      ) {
        update_CourseEnrollment(
          where: { userId: { _eq: $userId }, courseId: { _eq: $courseId } }
          _set: { ${field}: $value }
        ) {
          affected_rows
        }
      }
    `;
    const mutationVariables = {
      userId: userId,
      courseId: courseId,
      value: value,
    };
    await request(process.env.HASURA_ENDPOINT, mutation, mutationVariables, {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    });

    logger.debug(
      `Successfully updated course enrollment record for user ${userId} and course ${courseId}. Set ${field} to ${value}.`
    );
  } catch (error) {
    logger.error(
      `Error updating course enrollment record for user ${userId} and course ${courseId} with field ${field} and value ${value}`
    );
    throw error;
  }
};

/**
 * Fetches course enrollments for an array of user IDs and a course ID.
 *
 * @param {string[]} userIds An array of user IDs to fetch enrollments for.
 * @param {number} courseId The ID of the course to fetch enrollments for.
 * @returns {Promise<Object[]>} A Promise that resolves to an array of course enrollment objects.
 */
export const fetchEnrollments = async (userIds, courseId) => {
  // Construct the query using gql template literal
  const query = gql`
    query GetEnrollments($userIds: [uuid!]!, $courseId: Int!) {
      CourseEnrollment(
        where: { userId: { _in: $userIds }, Course: { id: { _eq: $courseId } } }
      ) {
        User {
          firstName
          lastName
          AchievementRecordAuthors(
            where: {
              AchievementRecord: {
                AchievementOption: {
                  AchievementOptionCourses: {
                    Course: { id: { _eq: $courseId } }
                  }
                }
              }
            }
            order_by: { AchievementRecord: { updated_at: desc } }
            limit: 1
          ) {
            AchievementRecord {
              AchievementOption {
                title
                recordType
              }
              created_at
            }
          }
          id
        }
        Course {
          Program {
            title
            attendanceCertificateTemplateURL
          }
          Sessions(order_by: { startDateTime: asc }) {
            title
          }
          id
          ects
          title
          learningGoals
        }
      }
    }
  `;

  // Defining the variables object that contains the userIds and courseId
  const variables = {
    userIds,
    courseId,
  };

  try {
    // Making a request to the GraphQL endpoint with the query and variables
    const data = await request(process.env.HASURA_ENDPOINT, query, variables, {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    });

    // Returning the CourseEnrollment data from the response
    return data.CourseEnrollment;
  } catch (error) {
    // Logging the error and throwing a new error with a message
    console.error(error);
    throw new Error("Failed to fetch enrollments");
  }
};
