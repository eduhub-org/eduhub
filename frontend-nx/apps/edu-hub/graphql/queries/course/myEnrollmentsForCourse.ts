import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "../fragments/courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const MY_ENROLLMENTS_FOR_COURSE = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  query MyEnrollmentsForCourseQuery($courseId: Int!) {
    CourseEnrollment(where: { courseId: { _eq: $courseId } }) {
      ...EnrollmentFragment
      Course {
        ...CourseFragment
      }
    }
  }
`;
