import { request, gql } from "graphql-request";

export const fetchEnrollments = async (userIds, courseId) => {
  // Construct the query
  const query = gql`
    query GetEnrollments($userIds: [uuid!]!, $courseId: Int!) {
      CourseEnrollment(
        where: {
          userId: { _in: $userIds }
          Course: {
            id: { _eq: $courseId }
            AchievementOptionCourses: {
              AchievementOption: {
                AchievementRecords: { rating: { _eq: UNRATED } }
              }
            }
          }
        }
      ) {
        User {
          firstName
          lastName
          AchievementRecordAuthors(
            where: {
              AchievementRecord: {
                rating: { _eq: UNRATED }
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
          id
          ects
          title
          learningGoals
        }
      }
    }
  `;

  const variables = {
    userIds,
    courseId,
  };

  try {
    const data = await request(process.env.HASURA_ENDPOINT, query, variables, {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    });

    // const data = await request("https://example.com/graphql", query, variables);
    return data.CourseEnrollment;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch enrollments");
  }
};
