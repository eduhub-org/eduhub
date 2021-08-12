import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const COURSE_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  query CourseWithEnrollment($id: Int!) {
    Course_by_pk(Id: $id) {
      ...CourseFragment
      Enrollments {
        ...EnrollmentFragment
      }
      Semester {
        ApplicationEnd
        ApplicationStart
        Id
        End
        Start
        Name
        PerformanceRecordDeadline
      }
    }
  }
`;
