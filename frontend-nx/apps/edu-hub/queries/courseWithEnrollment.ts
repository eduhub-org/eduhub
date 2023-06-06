import { gql } from '@apollo/client';

import { COURSE_FRAGMENT } from './courseFragment';
import { ENROLLMENT_FRAGMENT } from './enrollmentFragment';
import { USER_PROGRAM_FRAGMENT } from './programFragment';
import { SESSION_FRAGMENT } from './sessionFragement';

export const COURSE_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${SESSION_FRAGMENT}
  ${USER_PROGRAM_FRAGMENT}
  query CourseWithEnrollment($id: Int!, $userId: uuid!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
      chatLink
      # LinkVideoCall
      CourseEnrollments {
        ...EnrollmentFragment
      }
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
      }
      Program {
        ...ProgramFragment
      }
      Sessions (order_by: { startDateTime: asc }) {
        ...SessionFragment
        Attendances(where: { User: { id: { _eq: $userId } } }) {
          id
          status
          updated_at
        }
      }
    }
  }
`;
