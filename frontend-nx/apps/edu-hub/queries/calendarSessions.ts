import { gql } from '@apollo/client';

export const CALENDAR_COURSES = gql`
  query CalendarCourses($where: Course_bool_exp = {}) {
    Course(where: $where, order_by: { title: asc }) {
      id
      title
    }
  }
`;

export const CALENDAR_SESSIONS = gql`
  query CalendarSessions($where: Session_bool_exp = {}) {
    Session(where: $where, order_by: { startDateTime: asc }) {
      id
      startDateTime
      endDateTime
      title
      description
      courseId
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
