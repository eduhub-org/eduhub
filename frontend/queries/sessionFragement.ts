import { gql } from "@apollo/client";

export const SESSION_FRAGMENT = gql`
  fragment SessionFragment on Session {
    Id
    Finish
    CourseId
    Description
    Location
    Start
    Title
  }
`;
