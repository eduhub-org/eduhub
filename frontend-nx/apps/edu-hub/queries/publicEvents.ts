import { gql } from '@apollo/client';

export const PUBLIC_EVENT_SESSION_FIELDS = gql`
  fragment PublicEventSessionFields on Session {
    id
    title
    description
    startDateTime
    endDateTime
    courseId
    isPublicEvent
    Course {
      id
      title
      coverImage
      tagline
      Program {
        id
        title
        shortTitle
      }
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
      }
    }
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
      LocationAddress {
        id
        shortLabel
        address
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

export const PUBLIC_EVENTS = gql`
  ${PUBLIC_EVENT_SESSION_FIELDS}
  query PublicEvents {
    Session(
      where: {
        isPublicEvent: { _eq: true }
        Course: { published: { _eq: true }, Program: { published: { _eq: true } } }
      }
      order_by: { startDateTime: asc }
    ) {
      ...PublicEventSessionFields
    }
  }
`;

export const PUBLIC_EVENT_BY_ID = gql`
  ${PUBLIC_EVENT_SESSION_FIELDS}
  query PublicEventById($sessionId: Int!) {
    Session(
      where: {
        id: { _eq: $sessionId }
        isPublicEvent: { _eq: true }
        Course: { published: { _eq: true }, Program: { published: { _eq: true } } }
      }
      limit: 1
    ) {
      ...PublicEventSessionFields
    }
  }
`;

export const UPDATE_SESSION_IS_PUBLIC_EVENT = gql`
  mutation UpdateSessionIsPublicEvent($sessionId: Int!, $value: Boolean!) {
    update_Session_by_pk(pk_columns: { id: $sessionId }, _set: { isPublicEvent: $value }) {
      id
      isPublicEvent
    }
  }
`;
