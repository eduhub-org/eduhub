import { graphql } from '../../types/generated';

export const COURSE_INSTRUCTOR_FRAGMENT = graphql(`
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
`);
