import { gql } from "@apollo/client";

export const COURSE_INSTRUCTOR_FRAGMENT = gql`
  fragment CourseInstructorFragment on CourseInstructor {
    id
    Expert {
      id
      description
      User {
        id
        firstName
        lastName
        picture
        externalProfile
        email
      }
    }
  }
`;
