import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";
import { USER_PROGRAM_FRAGMENT } from "./programFragment";

export const COURSE_LIST_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${USER_PROGRAM_FRAGMENT}
  query CourseListWithEnrollments {
    Course (order_by: { id: desc }) {
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
