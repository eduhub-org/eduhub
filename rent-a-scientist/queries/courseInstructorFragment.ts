import { gql } from "@apollo/client";

export const COURSE_INSTRUCTOR_FRAGMENT = gql`
  fragment CourseInstructorFragment on CourseInstructor {
    id
    Expert {
      id
      User {
        firstName
        picture
        id
        lastName
      }
      description
    }
  }
`;
