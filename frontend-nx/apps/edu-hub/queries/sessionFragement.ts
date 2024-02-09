import { gql } from '@apollo/client';
import { USER_FRAGMENT } from './userFragment';

export const SESSION_FRAGMENT = gql`
  ${USER_FRAGMENT}
  fragment SessionFragment on Session {
    id
    endDateTime
    courseId
    description
    startDateTime
    title
    SessionAddresses {
      id
      address
      location
      type
      CourseLocation {
        id
        locationOption
        defaultSessionAddress
      }
    }
    SessionSpeakers {
      Expert {
        User {
          id
          firstName
          lastName
          picture
          externalProfile
          university
          otherUniversity
        }
      }
    }
  }
`;

export const ADMIN_SESSION_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  ${USER_FRAGMENT}
  fragment AdminSessionFragment on Session {
    ...SessionFragment
    SessionSpeakers {
      id
      Expert {
        id
        User {
          ...UserFragment
        }
      }
    }
  }
`;
