import { gql } from '@apollo/client';

import {
  ADMIN_COURSE_FRAGMENT,
  COURSE_FRAGMENT,
  COURSE_FRAGMENT_MINIMUM,
} from './courseFragment';
import { ADMIN_ENROLLMENT_FRAGMENT } from './enrollmentFragment';
import { ADMIN_SESSION_FRAGMENT } from './sessionFragement';
import { USER_FRAGMENT } from './userFragment';
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from './programFragment';

export const COURSE = gql`
  ${COURSE_FRAGMENT}
  query Course($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
    }
  }
`;

export const COURSE_MINIMUM = gql`
  ${COURSE_FRAGMENT_MINIMUM}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query CourseMinimum($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragmentMinimum
      Program {
        ...ProgramFragmentMinimumProperties
      }
    }
  }
`;

// Query to get all data on a course that is necessary for the manage course page
export const MANAGED_COURSE = gql`
  ${ADMIN_COURSE_FRAGMENT}
  ${ADMIN_ENROLLMENT_FRAGMENT}
  ${ADMIN_SESSION_FRAGMENT}
  ${USER_FRAGMENT}
  query ManagedCourse($id: Int!) {
    Course_by_pk(id: $id) {
      ...AdminCourseFragment
      CourseEnrollments {
        ...AdminEnrollmentFragment
        User {
          ...UserFragment
          Attendances(where: { Session: { courseId: { _eq: $id } } }) {
            id
            status
            Session {
              id
            }
          }
        }
      }
      CourseLocations {
        id
        defaultSessionAddress
        locationOption
      }
      Sessions {
        ...AdminSessionFragment
      }
    }
  }
`;

export const INSERT_NEW_SESSION = gql`
  mutation InsertCourseSession(
    $courseId: Int!
    $startTime: timestamptz!
    $endTime: timestamptz!
  ) {
    insert_Session(
      objects: {
        courseId: $courseId
        title: ""
        startDateTime: $startTime
        endDateTime: $endTime
        description: ""
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_SESSION = gql`
  mutation DeleteCourseSession($sessionId: Int!) {
    delete_Session_by_pk(id: $sessionId) {
      id
    }
  }
`;

export const UPDATE_SESSION_TITLE = gql`
  mutation UpdateSessionTitle($sessionId: Int!, $title: String!) {
    update_Session_by_pk(
      pk_columns: { id: $sessionId }
      _set: { title: $title }
    ) {
      id
    }
  }
`;

export const UPDATE_SESSION_START_TIME = gql`
  mutation UpdateSessionStartTime($sessionId: Int!, $startTime: timestamptz!) {
    update_Session_by_pk(
      pk_columns: { id: $sessionId }
      _set: { startDateTime: $startTime }
    ) {
      id
    }
  }
`;

export const UPDATE_SESSION_END_TIME = gql`
  mutation UpdateSessionEndTime($sessionId: Int!, $endTime: timestamptz!) {
    update_Session_by_pk(
      pk_columns: { id: $sessionId }
      _set: { endDateTime: $endTime }
    ) {
      id
    }
  }
`;

export const INSERT_NEW_SESSION_SPEAKER = gql`
  mutation InsertNewSessionSpeaker($sessionId: Int!, $expertId: Int!) {
    insert_SessionSpeaker(
      objects: { sessionId: $sessionId, expertId: $expertId }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_SESSION_SPEAKER = gql`
  mutation DeleteSessionSpeaker($speakerId: Int!) {
    delete_SessionSpeaker_by_pk(id: $speakerId) {
      id
    }
  }
`;

export const INSERT_NEW_SESSION_LOCATION = gql`
  mutation InsertSessionLocation($sessionId: Int!, $address: String!) {
    insert_SessionAddress(
      objects: {
        sessionId: $sessionId
        address: $address
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_SESSION_LOCATION = gql`
  mutation DeleteCourseSessionLocation($addressId: Int!) {
    delete_SessionAddress_by_pk(id: $addressId) {
      id
    }
  }
`;

export const LOCATION_OPTIONS = gql`
  query LocationOptionsKnown {
    LocationOption {
      value
    }
  }
`;

export const INSERT_NEW_COURSE_LOCATION = gql`
  mutation InsertCourseLocation($courseId: Int!, $option: LocationOption_enum!) {
    insert_CourseLocation(
      objects: {
        courseId: $courseId
        locationOption: $option
        defaultSessionAddress: ""
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const UPDATE_COURSE_LOCATION_OPTION = gql`
  mutation UpdateCourseLocationOption($locationId: Int!, $option: LocationOption_enum!) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $locationId }
      _set: { locationOption: $option }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_SESSION_DEFAULT_ADDRESS = gql`
  mutation UpdateCourseDefaultSessionAddress($locationId: Int!, $defaultSessionAddress: String!) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $locationId }
      _set: { defaultSessionAddress: $defaultSessionAddress }
    ) {
      id
    }
  }
`;

export const DELETE_COURSE_LOCATION = gql`
  mutation DeleteCourseLocation($locationId: Int!) {
    delete_CourseLocation_by_pk(id: $locationId) {
      id
    }
  }
`;

export const UPDATE_COURSE_START_TIME = gql`
  mutation UpdateCourseStartTime($courseId: Int!, $startTime: timestamptz!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { startTime: $startTime }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_END_TIME = gql`
  mutation UpdateCourseEndTime($courseId: Int!, $endTime: timestamptz!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { endTime: $endTime }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LANGUAGE = gql`
  mutation UpdateCourseLanguage($courseId: Int!, $language: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { language: $language }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_WEEKDAY = gql`
  mutation UpdateCourseWeekday($courseId: Int!, $weekday: Weekday_enum!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { weekDay: $weekday }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_1 = gql`
  mutation UpdateCourseHeadingDescription1(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { headingDescriptionField1: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_2 = gql`
  mutation UpdateCourseHeadingDescription2(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { headingDescriptionField2: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1 = gql`
  mutation UpdateCourseContentDescriptionField1(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { contentDescriptionField1: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2 = gql`
  mutation UpdateCourseContentDescriptionField2(
    $courseId: Int!
    $description: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { contentDescriptionField2: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LEARNING_GOALS = gql`
  mutation UpdateCourseLearningGoals($courseId: Int!, $description: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { learningGoals: $description }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_TAGLINE = gql`
  mutation UpdateCourseTagline($courseId: Int!, $tagline: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { tagline: $tagline }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_MAX_PARTICIPANTS = gql`
  mutation UpdateCourseMaxParticipants(
    $courseId: Int!
    $maxParticipants: Int!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { maxParticipants: $maxParticipants }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_STATUS = gql`
  mutation UpdateCourseStatus($courseId: Int!, $status: CourseStatus_enum!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { status: $status }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_ATTENDANCE_CERTIFICATE_POSSIBLE = gql`
  mutation UpdateCourseAttendanceCertificatePossible(
    $courseId: Int!
    $isPossible: Boolean!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { attendanceCertificatePossible: $isPossible }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_ACHIEVEMENT_CERTIFICATE_POSSIBLE = gql`
  mutation UpdateCourseAchievementCertificatePossible(
    $courseId: Int!
    $isPossible: Boolean!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { achievementCertificatePossible: $isPossible }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_TITLE = gql`
  mutation UpdateCourseTitle(
    $courseId: Int!
    $courseTitle: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { title: $courseTitle }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CHAT_LINK = gql`
  mutation UpdateCourseChatLink(
    $courseId: Int!
    $chatLink: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { chatLink: $chatLink }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_ECTS = gql`
  mutation UpdateCourseEcts(
    $courseId: Int!
    $ects: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { ects: $ects }
    ) {
      id
    }
  }
`;

// export const INSERT_NEW_COURSE_GROUP = gql`
//   mutation InsertCourseGroup($courseId: Int!, $option: CourseGroupOption_enum!) {
//     insert_CourseGroup(
//       objects: {
//         courseId: $courseId
//         groupOptionId: $option
//         defaultSessionAddress: ""
//       }
//     ) {
//       affected_rows
//       returning {
//         id
//       }
//     }
//   }
// `;
