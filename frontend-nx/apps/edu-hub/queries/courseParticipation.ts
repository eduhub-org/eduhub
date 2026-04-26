import { gql } from '@apollo/client';

export const COURSE_PARTICIPATIONS = gql`
  query CourseParticipations(
    $courseId: Int!
    $limit: Int = 15
    $offset: Int = 0
    $filter: CourseEnrollment_bool_exp = {}
    $order_by: [CourseEnrollment_order_by!] = [{ User: { lastName: asc } }]
  ) {
    Course_by_pk(id: $courseId) {
      CourseEnrollments(
        limit: $limit
        offset: $offset
        where: { _and: [{ status: { _eq: CONFIRMED } }, $filter] }
        order_by: $order_by
      ) {
        id
        userId
        courseId
        status
        achievementCertificateURL
        attendanceCertificateURL
        User {
          id
          firstName
          lastName
          email
          Attendances(where: { Session: { courseId: { _eq: $courseId } } }) {
            id
            status
            source
            Session {
              id
            }
          }
        }
      }
      CourseEnrollments_aggregate(
        where: { _and: [{ status: { _eq: CONFIRMED } }, $filter] }
      ) {
        aggregate {
          count
        }
      }
      Sessions(order_by: { startDateTime: asc }) {
        id
        startDateTime
        endDateTime
        title
      }
      AchievementOptionCourses {
        AchievementOption {
          id
          title
          recordType
          AchievementRecords(where: { courseId: { _eq: $courseId } }) {
            id
            courseId
            documentationUrl
            rating
            created_at
            uploadUserId
            AchievementRecordAuthors {
              userId
              User {
                firstName
                lastName
              }
            }
            AchievementOption {
              title
            }
          }
        }
      }
      maxMissedSessions
      attendanceCertificatePossible
      achievementCertificatePossible
    }
  }
`;
