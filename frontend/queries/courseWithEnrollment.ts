import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";
import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${SESSION_FRAGMENT}
  query CourseWithEnrollment($id: Int!, $authId: uuid!) {
    Course_by_pk(Id: $id) {
      ...CourseFragment
      Enrollments {
        ...EnrollmentFragment
      }
      Sessions {
        ...SessionFragment
        Attendences(where: { Person: { AuthId: { _eq: $authId } } }) {
          Id
          Attending
        }
      }
    }
  }
`;
