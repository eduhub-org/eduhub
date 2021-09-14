import { gql } from "@apollo/client";

export const ENROLLMENT_FRAGMENT = gql`
  fragment EnrollmentFragment on Enrollment {
    id
    status
  }
`;
