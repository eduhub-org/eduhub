import { gql } from '@apollo/client';

/** One enrollment in a user's application and participation history (EnrollmentHistory). */
export const ENROLLMENT_HISTORY_FRAGMENT = gql`
  fragment EnrollmentHistoryFragment on CourseEnrollment {
    id
    status
    courseId
    created_at
    achievementCertificateURL
    Course {
      id
      title
      ects
      Program {
        id
        title
        shortTitle
        lectureStart
      }
    }
    AttendanceStats {
      attendedSessions
      totalSessions
    }
  }
`;
