import { gql } from "@apollo/client";

import { ADMIN_COURSE_FRAGMENT, COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const COURSE = gql`
  ${COURSE_FRAGMENT}
  query Course($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
    }
  }
`;

// Query to get all data on a course that is necessary for the manage course page
export const MANAGED_COURSE = gql`

  ${ADMIN_COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}

  query ManagedCourse($id: Int!) {
    Course_by_pk(id: $id) {
      ...AdminCourseFragment
      CourseEnrollments {
        ...EnrollmentFragment
      }
    }
  }

`;