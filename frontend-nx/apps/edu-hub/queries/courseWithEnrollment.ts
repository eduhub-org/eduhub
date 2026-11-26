import { gql } from '@apollo/client';

import { COURSE_FRAGMENT } from './courseFragment';
import { ENROLLMENT_FRAGMENT } from './enrollmentFragment';
import { USER_PROGRAM_FRAGMENT } from './programFragment';
import { SESSION_FRAGMENT } from './sessionFragement';
import { SESSION_ONLINE_LINKS_FRAGMENT } from './onlineMeetingLink';

export const COURSE_WITH_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${SESSION_FRAGMENT}
  ${USER_PROGRAM_FRAGMENT}
  ${SESSION_ONLINE_LINKS_FRAGMENT}
  # Runs as the logged-in role, so it may read the meeting links Hasura lets that user see.
  query CourseWithEnrollment($id: Int!, $userId: uuid!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
      chatLink
      matrixRoomId
      # LinkVideoCall
      CourseEnrollments {
        ...EnrollmentFragment
        cancellationRequestedAt
      }
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
        OnlineMeetingLink {
          id
          url
        }
      }
      Program {
        ...ProgramFragment
        Sessions(order_by: { startDateTime: asc }) {
          ...SessionFragment
          ...SessionOnlineLinksFragment
          Attendances(where: { User: { id: { _eq: $userId } } }) {
            id
            status
            source
            updated_at
          }
        }
      }
      Sessions (order_by: { startDateTime: asc }) {
        ...SessionFragment
        ...SessionOnlineLinksFragment
        Attendances(where: { User: { id: { _eq: $userId } } }) {
          id
          status
          source
          updated_at
        }
      }
    }
  }
`;
