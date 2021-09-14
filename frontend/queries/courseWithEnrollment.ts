import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";
import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${SESSION_FRAGMENT}
  query CourseWithEnrollment($id: Int!, $authId: uuid!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
      Enrollments {
        ...EnrollmentFragment
      }
      Sessions {
        ...SessionFragment
        Attendences(where: { User: { authId: { _eq: $authId } } }) {
          id
          status
        }
      }
    }
  }
`;
