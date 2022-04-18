import { gql } from "@apollo/client";

export const ENROLLMENT_FRAGMENT = gql`
  fragment EnrollmentFragment on CourseEnrollment {
    invitationExpirationDate
    id
    status
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