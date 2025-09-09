import { gql } from "@apollo/client";
import { COURSE_ENROLLMENT_FRAGMENT } from "./courseEnrollmentFragment";

export const COURSE_INSTRUCTOR_LIST = gql`
  ${COURSE_ENROLLMENT_FRAGMENT}
  query CourseInstructorList {
    CourseInstructor {
      ...CourseEnrollmentFragment
    }
  }
`;
