import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const MY_COURSES = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  query MyCourses {
    Enrollment {
      ...EnrollmentFragment
      Course {
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
  }
`;
