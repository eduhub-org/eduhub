import { gql } from "@apollo/client";

// COURSE_INSTRUCTOR_FRAGMENT removed - use COURSE_ENROLLMENT_FRAGMENT instead

export const COURSE_INSTRUCTOR_FRAGMENT_ANONYMOUS = gql`
  fragment CourseInstructorFragmentAnonymous on CourseInstructor {
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
      }
    }
  }
`;
