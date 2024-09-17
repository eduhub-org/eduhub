import { graphql } from '../../types/generated';

export const SESSION_FRAGMENT = graphql(`
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
`);

export const ADMIN_SESSION_FRAGMENT = graphql(`
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
`);
