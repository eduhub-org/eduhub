import { gql } from '@apollo/client';

export const COURSE_INSTRUCTOR_FRAGMENT = gql`
  fragment CourseEnrollmentFragment on CourseEnrollment {
    id
    courseId
    userId
    invitationExpirationDate
    motivationLetter
    status
    achievementCertificateURL
    attendanceCertificateURL
  }
`;
