import got from "got";
import { request } from "graphql-request";

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

    // Construct the GraphQL query to fetch the enrollment data
    const query = `
    query GetEnrollments($userIds: [uuid!]!, $courseId: Int!) {
        CourseEnrollment(where: {userId: {_in: $userIds}, Course: {id: {_eq: $courseId}, AchievementOptionCourses: {AchievementOption: {AchievementRecords: {rating: {_eq: UNRATED}}}}}}) {
          User {
            firstName
            lastName
            AchievementRecordAuthors(where: {AchievementRecord: {rating: {_eq: UNRATED}, AchievementOption: {AchievementOptionCourses: {Course: {id: {_eq: $courseId}}}}}}, order_by: {AchievementRecord: {updated_at: desc}}, limit: 1) {
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
            ects
            title
          }
        }
      }
                  `;
    // Set the variables for the GraphQL query
    const variables = {
      userIds: userIds,
      courseId: courseId,
    };

    // Send the GraphQL query to the Hasura endpoint
    const data = await request(
      process.env.HASURA_GRAPHQL_ENDPOINT,
      query,
      variables,
      {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
        },
      }
    );

    // Check if all users are enrolled in their respective courses

    // Construct the options object for the certificate generation request
    const options = {
      json: {
        template:
          data.CourseEnrollment[0].Course.Program
            .attendanceCertificateTemplateURL,
        full_name: `${data.CourseEnrollment[0].User.firstName} ${data.CourseEnrollment[0].User.lastName}`,
        semester: data.CourseEnrollment[0].Course.Program.title,
        course_name: data.CourseEnrollment[0].Course.title,
        ects: data.CourseEnrollment[0].Course.ects,
        practical_project:
          data.CourseEnrollment[0].User.AchievementRecordAuthors
            .AchievementRecord.AchievementOption.title,
        online_courses:
          data.CourseEnrollment[0].User.AchievementRecordAuthors
            .AchievementRecord.AchievementOption.title,
        certificate_text: data.CourseEnrollment[0].Course.learningGoals,
      },
    };

    // Send the certificate generation request to the certificate generation service
    const url = "https://edu-old.opencampus.sh/create_certificate_rest";
    const certificateData = await got.post(url, options).json();

    return res.json({
      pdf: certificateData.pdf,
    });
  } else {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
};
