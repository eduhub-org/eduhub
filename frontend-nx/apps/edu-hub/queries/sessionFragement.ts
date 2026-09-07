import { gql } from '@apollo/client';
import { USER_FRAGMENT } from './userFragment';

export const SESSION_FRAGMENT = gql`
  ${USER_FRAGMENT}
  fragment SessionFragment on Session {
    id
    endDateTime
    courseId
    description
    isPublicEvent
    startDateTime
    title
    SessionAddresses {
      id
      address
      locationAddressId
      CourseLocation {
        id
        locationOption
        defaultSessionAddress
        defaultSessionAddressId
      }
    }
    SessionSpeakers {
      id
      User {
        id
        firstName
        lastName
        picture
        externalProfile
      }
    }
  }
`;

// Instructor/admin-only fields. The `attendanceData` column is restricted to
// the `instructor_access` Hasura role, so it must NOT be embedded in fragments
// consumed by anonymous or user-role queries (see backend Session permissions).
export const SESSION_INSTRUCTOR_FRAGMENT = gql`
  fragment SessionInstructorFragment on Session {
    id
    attendanceData
  }
`;

export const ADMIN_SESSION_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  ${SESSION_INSTRUCTOR_FRAGMENT}
  ${USER_FRAGMENT}
  fragment AdminSessionFragment on Session {
    ...SessionFragment
    ...SessionInstructorFragment
    SessionSpeakers {
      id
      User {
        ...UserFragment
      }
    }
  }
`;
