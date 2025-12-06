import { gql } from "@apollo/client";

export const COURSE_INSTRUCTOR_FRAGMENT = gql`
  fragment CourseInstructorFragment on CourseInstructor {
    id
    User {
      id
      firstName
      lastName
      picture
      externalProfile
      email
    }
  }
`;

export const COURSE_INSTRUCTOR_FRAGMENT_ANONYMOUS = gql`
  fragment CourseInstructorFragmentAnonymous on CourseInstructor {
    id
    User {
      id
      firstName
      lastName
      picture
      externalProfile
    }
  }
`;
