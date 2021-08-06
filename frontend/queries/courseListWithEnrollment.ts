import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const COURSE_LIST_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  query CourseListWithEnrollments {
    Course {
      ...CourseFragment
      Enrollments {
        ...EnrollmentFragment
      }
    }
  }
`;
