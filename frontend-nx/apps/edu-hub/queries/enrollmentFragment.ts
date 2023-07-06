import { gql } from '@apollo/client';

export const ENROLLMENT_FRAGMENT = gql`
  fragment EnrollmentFragment on CourseEnrollment {
    userId
    invitationExpirationDate
    id
    status
    achievementCertificateURL
    attendanceCertificateURL
  }
`;

export const ADMIN_ENROLLMENT_FRAGMENT = gql`
  ${ENROLLMENT_FRAGMENT}
  fragment AdminEnrollmentFragment on CourseEnrollment {
    ...EnrollmentFragment
    motivationLetter
    motivationRating
  }
`;
