import { graphql } from '../../types/generated';

export const COURSE_INSTRUCTOR_FRAGMENT = graphql(`
  fragment CourseInstructorFragment on CourseInstructor {
    id
    Expert {
      id
      User {
        firstName
        picture
        id
        lastName
        university
        otherUniversity
        externalProfile
      }
      description
    }
  }
`);
