import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";
import { USER_PROGRAM_FRAGMENT } from "./programFragment";
import { COURSE_INSTRUCTOR_FRAGMENT } from "./courseInstructorFragment";

export const COURSE_LIST_WITH_INSTRUCTOR = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${USER_PROGRAM_FRAGMENT}
  ${COURSE_INSTRUCTOR_FRAGMENT}
  query CourseListWithInstructors {
    Course {
      ...CourseFragment
      CourseEnrollments {
        ...EnrollmentFragment
      }
      Program {
        ...ProgramFragment
      }
    }
  }
`;
