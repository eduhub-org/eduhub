import { gql } from '@apollo/client';

export const CALENDAR_SESSIONS = gql`
  query CalendarSessions($where: Session_bool_exp = {}, $limit: Int = 2000) {
    Session(where: $where, order_by: { startDateTime: asc }, limit: $limit) {
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
      }
      Course {
        id
        title
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
