import { graphql } from '../../../types/generated';

export const COURSE_INSTRUCTOR_LIST = graphql(`
  query CourseInstructorList {
    CourseInstructor {
      ...CourseInstructorFragment
    }
  }
`);
