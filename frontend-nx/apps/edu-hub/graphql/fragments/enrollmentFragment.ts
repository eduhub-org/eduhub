import { graphql } from '../../types/generated';

export const ENROLLMENT_FRAGMENT = graphql(`
  fragment EnrollmentFragment on CourseEnrollment {
    userId
    courseId
    invitationExpirationDate
    id
    status
    achievementCertificateURL
    attendanceCertificateURL
  }
`);

export const ADMIN_ENROLLMENT_FRAGMENT = graphql(`
  fragment AdminEnrollmentFragment on CourseEnrollment {
    ...EnrollmentFragment
    motivationLetter
    motivationRating
  }
`);
