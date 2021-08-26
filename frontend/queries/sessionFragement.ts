import { gql } from "@apollo/client";

export const SESSION_FRAGMENT = gql`
  fragment SessionFragment on Session {
    Id
    endDateTime
    CourseId
    Description
    Location
    startDateTime
    Name
  }
`;
