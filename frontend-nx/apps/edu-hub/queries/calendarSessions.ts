import { gql } from '@apollo/client';

export const CALENDAR_SESSIONS = gql`
  query CalendarSessions($where: Session_bool_exp = {}, $limit: Int = 2000, $offset: Int = 0) {
    Session(where: $where, order_by: [{ startDateTime: asc }, { id: asc }], limit: $limit, offset: $offset) {
      id
      startDateTime
      endDateTime
      title
      description
      courseId
      programId
      Program {
        id
        type
        title
        shortTitle
        published
      }
      Course {
        id
        title
        published
        CourseLocations {
          id
          locationOption
          defaultSessionAddress
        }
        Program {
          id
          type
          title
          shortTitle
          published
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
        }
      }
    }
  }
`;
