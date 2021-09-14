import { gql } from "@apollo/client";

export const SESSION_FRAGMENT = gql`
  fragment SessionFragment on Session {
    id
    endDateTime
    courseId
    description
    startDateTime
    title
  }
`;
