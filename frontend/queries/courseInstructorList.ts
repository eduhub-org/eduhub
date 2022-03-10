import { gql } from "@apollo/client";
import { COURSE_INSTRUCTOR_FRAGMENT } from "./courseInstructorFragment";

export const COURSE_INSTRUCTOR_LIST = gql`
  ${COURSE_INSTRUCTOR_FRAGMENT}
  query CourseInstructorList {
    CourseInstructor {
      ...CourseInstructorFragment
    }
  }
`;
