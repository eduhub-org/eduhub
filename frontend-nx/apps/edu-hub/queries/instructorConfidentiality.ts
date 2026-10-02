import { gql } from '@apollo/client';

export const MY_INSTRUCTOR_CONFIDENTIALITY_ACCEPTANCE = gql`
  query MyInstructorConfidentialityAcceptance($userId: uuid!, $version: String!) {
    InstructorConfidentialityAcceptance(
      where: { userId: { _eq: $userId }, version: { _eq: $version } }
      limit: 1
    ) {
      id
      created_at
    }
  }
`;

/** userId is preset from the session and created_at comes from the database. */
export const ACCEPT_INSTRUCTOR_CONFIDENTIALITY = gql`
  mutation AcceptInstructorConfidentiality($version: String!) {
    insert_InstructorConfidentialityAcceptance_one(object: { version: $version }) {
      id
    }
  }
`;
