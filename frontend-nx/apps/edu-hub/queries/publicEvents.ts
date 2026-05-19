import { gql } from '@apollo/client';

// Anonymous-role query: list all sessions marked as public events.
// Mirrors the join shape used by CalendarSessions so an EventTile / events
// slider can render speakers, address, course and program context without
// additional round-trips.
export const PUBLIC_EVENTS = gql`
  query PublicEvents($limit: Int = 100) {
    Session(
      where: { isPublicEvent: { _eq: true } }
      order_by: { startDateTime: asc }
      limit: $limit
    ) {
      id
      startDateTime
      endDateTime
      title
      description
      isPublicEvent
      courseId
      Course {
        id
        title
        coverImage
        CourseLocations {
          id
          locationOption
          defaultSessionAddress
        }
        Program {
          id
          title
          shortTitle
        }
      }
      SessionAddresses {
        id
        address
        CourseLocation {
          id
          locationOption
          defaultSessionAddress
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
  }
`;

// Anonymous-role single-session fetch for the public event detail page.
export const PUBLIC_EVENT_BY_ID = gql`
  query PublicEventById($sessionId: Int!) {
    Session_by_pk(id: $sessionId) {
      id
      startDateTime
      endDateTime
      title
      description
      isPublicEvent
      courseId
      Course {
        id
        title
        tagline
        coverImage
        language
        CourseLocations {
          id
          locationOption
          defaultSessionAddress
        }
        Program {
          id
          title
          shortTitle
        }
      }
      SessionAddresses {
        id
        address
        CourseLocation {
          id
          locationOption
          defaultSessionAddress
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
  }
`;
