import { gql } from '@apollo/client';

import {
  ADMIN_COURSE_FRAGMENT,
  COURSE_FRAGMENT,
  COURSE_FRAGMENT_MINIMUM,
  COURSE_FRAGMENT_ANONYMOUS,
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

export const COURSE_ANONYMOUS = gql`
  ${COURSE_FRAGMENT_ANONYMOUS}
  query CourseAnonymous($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragmentAnonymous
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

// Query to get the shell data needed for the initial manage course page.
export const MANAGED_COURSE = gql`
  ${ADMIN_COURSE_FRAGMENT}
  ${ADMIN_SESSION_FRAGMENT}
  query ManagedCourse($id: Int!) {
    Course_by_pk(id: $id) {
      ...AdminCourseFragment
      CourseLocations {
        id
        defaultSessionAddress
        defaultSessionAddressId
        locationOption
      }
      Sessions(order_by: { startDateTime: asc }) {
        ...AdminSessionFragment
      }
    }
  }
`;

export const MANAGED_COURSE_APPLICATIONS = gql`
  ${ADMIN_ENROLLMENT_FRAGMENT}
  ${USER_FRAGMENT}
  query ManagedCourseApplications(
    $id: Int!
    $limit: Int = 15
    $offset: Int = 0
    $filter: CourseEnrollment_bool_exp = {}
    $order_by: [CourseEnrollment_order_by!] = [{ id: asc }]
  ) {
    Course_by_pk(id: $id) {
      id
      registrationType
      matrixRoomId
      formbricksEnrollmentSurveyUrl
      Program {
        id
        defaultFormbricksEnrollmentSurveyUrl
      }
      Sessions(order_by: { startDateTime: asc }) {
        id
        startDateTime
      }
      CourseEnrollments(
        limit: $limit
        offset: $offset
        where: $filter
        order_by: $order_by
      ) {
        ...AdminEnrollmentFragment
        User {
          ...UserFragment
          CourseEnrollments {
            status
            courseId
            achievementCertificateURL
            attendanceCertificateURL
            Course {
              id
              title
              ects
              Program {
                shortTitle
              }
            }
          }
          Organization {
            id
            name
          }
        }
      }
      CourseEnrollments_aggregate(where: $filter) {
        aggregate {
          count
        }
      }
      TotalCourseEnrollments: CourseEnrollments_aggregate {
        aggregate {
          count
        }
      }
      ApprovedCourseEnrollments: CourseEnrollments_aggregate(where: { motivationRating: { _eq: INVITE } }) {
        aggregate {
          count
        }
      }
      InvitedCourseEnrollments: CourseEnrollments_aggregate(
        where: { status: { _in: [INVITED, CONFIRMED] } }
      ) {
        aggregate {
          count
        }
      }
      ConfirmedCourseEnrollments: CourseEnrollments_aggregate(
        where: { status: { _in: [CONFIRMED, COMPLETED, REGISTERED] } }
      ) {
        aggregate {
          count
        }
      }
    }
  }
`;

export const MANAGED_COURSE_APPLICATION_RECIPIENTS = gql`
  query ManagedCourseApplicationRecipients(
    $id: Int!
    $limit: Int!
    $filter: CourseEnrollment_bool_exp = {}
  ) {
    Course_by_pk(id: $id) {
      id
      CourseEnrollments(
        limit: $limit
        where: $filter
        order_by: [{ User: { lastName: asc } }, { User: { firstName: asc } }, { id: asc }]
      ) {
        id
        status
        motivationRating
        User {
          id
          firstName
          lastName
          email
        }
      }
      CourseEnrollments_aggregate(where: $filter) {
        aggregate {
          count
        }
      }
    }
  }
`;

export const INSERT_SESSION = gql`
  mutation InsertSession(
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
  mutation DeleteSession($id: Int!) {
    delete_Session_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_SESSION_TITLE = gql`
  mutation UpdateSessionTitle($itemId: Int!, $text: String!) {
    update_Session_by_pk(
      pk_columns: { id: $itemId }
      _set: { title: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_SESSION_START_TIME = gql`
  mutation UpdateSessionStartTime($sessionId: Int!, $value: timestamptz!) {
    update_Session_by_pk(
      pk_columns: { id: $sessionId }
      _set: { startDateTime: $value }
    ) {
      id
    }
  }
`;

export const UPDATE_SESSION_END_TIME = gql`
  mutation UpdateSessionEndTime($sessionId: Int!, $value: timestamptz!) {
    update_Session_by_pk(
      pk_columns: { id: $sessionId }
      _set: { endDateTime: $value }
    ) {
      id
    }
  }
`;

export const UPDATE_SESSION_DESCRIPTION = gql`
  mutation UpdateSessionDescription($itemId: Int!, $text: String!) {
    update_Session_by_pk(
      pk_columns: { id: $itemId }
      _set: { description: $text }
    ) {
      id
    }
  }
`;

export const INSERT_NEW_SESSION_SPEAKER = gql`
  mutation InsertNewSessionSpeaker($sessionId: Int!, $userId: uuid!) {
    insert_SessionSpeaker(
      objects: { sessionId: $sessionId, userId: $userId }
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

export const INSERT_SESSION_ADDRESS = gql`
  mutation InsertSessionAddress($sessionId: Int!, $address: String!, $courseLocationId: Int!) {
    insert_SessionAddress(
      objects: { sessionId: $sessionId, address: $address, courseLocationId: $courseLocationId}
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const INSERT_SESSION_WITH_ADDRESSES = gql`
  mutation InsertSessionWithAddresses(
    $courseId: Int!
    $startTime: timestamptz!
    $endTime: timestamptz!
    $sessionAddresses: [SessionAddress_insert_input!]!
  ) {
    insert_Session(
      objects: {
        courseId: $courseId
        title: ""
        startDateTime: $startTime
        endDateTime: $endTime
        description: ""
        SessionAddresses: {
          data: $sessionAddresses
        }
      }
    ) {
      affected_rows
      returning {
        id
        SessionAddresses {
          id
          address
          courseLocationId
        }
      }
    }
  }
`;

export const UPDATE_SESSION_ADDRESS = gql`
  mutation UpdateSessionAddress(
    $itemId: Int!
    $value: Int
  ) {
    update_SessionAddress_by_pk(
      pk_columns: { id: $itemId }
      _set: { locationAddressId: $value }
    ) {
      id
      locationAddressId
    }
  }
`;

export const UPDATE_SESSION_ADDRESS_LOCATION = gql`
  mutation UpdateSessionAddressLocation(
    $itemId: Int!
    $locationAddressId: Int
  ) {
    update_SessionAddress_by_pk(
      pk_columns: { id: $itemId }
      _set: { locationAddressId: $locationAddressId }
    ) {
      id
      locationAddressId
    }
  }
`;

export const DELETE_SESSION_ADDRESSES_BY_COURSE_AND_LOCATION = gql`
  mutation DeleteSessionAddressesByCourseAndLocation(
    $courseId: Int!,
    $courseLocationId: Int!
  ) {
    delete_SessionAddress(where: {
      Session: {courseId: {_eq: $courseId}},
      courseLocationId: {_eq: $courseLocationId}
    }) {
      affected_rows
    }
  }
`;

export const LOCATION_OPTIONS = gql`
  query LocationOptions {
    LocationOption {
      value
    }
  }
`;

export const INSERT_COURSE_LOCATION = gql`
  mutation InsertCourseLocation(
    $courseId: Int!
    $option: LocationOption_enum!
  ) {
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

export const UPDATE_COURSE_LOCATION = gql`
  mutation UpdateCourseLocation(
    $locationId: Int!
    $value: LocationOption_enum!
  ) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $locationId }
      _set: { locationOption: $value }
    ) {
      id
      locationOption
    }
  }
`;

export const UPDATE_COURSE_SESSION_DEFAULT_ADDRESS = gql`
  mutation UpdateCourseDefaultSessionAddress(
    $itemId: Int!
    $text: String!
  ) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $itemId }
      _set: { defaultSessionAddress: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_DEFAULT_SESSION_ADDRESS_ID = gql`
  mutation UpdateCourseDefaultSessionAddressId(
    $itemId: Int!
    $value: Int
  ) {
    update_CourseLocation_by_pk(
      pk_columns: { id: $itemId }
      _set: { defaultSessionAddressId: $value }
    ) {
      id
      defaultSessionAddressId
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
  mutation UpdateCourseStartTime($courseId: Int!, $value: time) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { startTime: $value }
    ) {
      id
      startTime
    }
  }
`;

export const UPDATE_COURSE_END_TIME = gql`
  mutation UpdateCourseEndTime($courseId: Int!, $value: time) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { endTime: $value }
    ) {
      id
      endTime
    }
  }
`;

export const UPDATE_COURSE_LANGUAGE = gql`
  mutation UpdateCourseLanguage($courseId: Int!, $value: String!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { language: $value }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_WEEKDAY = gql`
  mutation UpdateCourseWeekday($courseId: Int!, $value: Weekday_enum!) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { weekDay: $value }
    ) {
      id
      weekDay
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_1 = gql`
  mutation UpdateCourseHeadingDescription1(
    $itemId: Int!
    $text: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { headingDescriptionField1: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_HEADING_DESCRIPTION_2 = gql`
  mutation UpdateCourseHeadingDescription2(
    $itemId: Int!
    $text: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { headingDescriptionField2: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1 = gql`
  mutation UpdateCourseContentDescriptionField1(
    $itemId: Int!
    $text: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { contentDescriptionField1: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2 = gql`
  mutation UpdateCourseContentDescriptionField2(
    $itemId: Int!
    $text: String!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { contentDescriptionField2: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_LEARNING_GOALS = gql`
  mutation UpdateCourseLearningGoals($itemId: Int!, $text: String!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { learningGoals: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_SHORT_DESCRIPTION = gql`
  mutation UpdateShortDescription($itemId: Int!, $text: String!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { tagline: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_MAX_PARTICIPANTS = gql`
  mutation UpdateCourseMaxParticipants(
    $itemId: Int!
    $text: Int!
  ) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { maxParticipants: $text }
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
  mutation UpdateCourseTitle($itemId: Int!, $text: String!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { title: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_CHAT_LINK = gql`
  mutation UpdateCourseChatLink($itemId: Int!, $text: String!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { chatLink: $text }
    ) {
      id
    }
  }
`;

export const UPDATE_COURSE_ECTS = gql`
  mutation UpdateCourseEcts($itemId: Int!, $text: String!) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { ects: $text }) {
      id
    }
  }
`;

// Degree completion thresholds. Only meaningful for a course in a DEGREES program;
// null means the requirement is not checked when a degree certificate is generated,
// so both variables must stay nullable for clearing the field to work.
export const UPDATE_COURSE_REQUIRED_ECTS = gql`
  mutation UpdateCourseRequiredEcts($itemId: Int!, $text: numeric) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { requiredEcts: $text }) {
      id
      requiredEcts
    }
  }
`;

export const UPDATE_COURSE_REQUIRED_EVENT_COUNT = gql`
  mutation UpdateCourseRequiredEventCount($itemId: Int!, $text: Int) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { requiredEventCount: $text }) {
      id
      requiredEventCount
    }
  }
`;

export const UPDATE_COURSE_PROJECT_PROPOSALS_ENABLED = gql`
  mutation UpdateCourseProjectProposalsEnabled($itemId: Int!, $value: Boolean) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { projectProposalsEnabled: $value }
    ) {
      id
      projectProposalsEnabled
    }
  }
`;

export const UPDATE_COURSE_PROJECT_SUBMISSION_DEADLINE = gql`
  mutation UpdateCourseProjectSubmissionDeadline($itemId: Int!, $value: timestamptz) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { projectSubmissionDeadline: $value }
    ) {
      id
      projectSubmissionDeadline
    }
  }
`;

export const UPDATE_COURSE_EXTERNAL_REGISTRATION_LINK = gql`
  mutation UpdateCourseExternalRegistrationLink($itemId: Int!, $text: String!) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { externalRegistrationLink: $text }) {
      id
    }
  }
`;

export const UPDATE_COURSE_MAX_MISSED_SESSION = gql`
  mutation UpdateCourseMaxMissedSessions($itemId: Int!, $text: Int!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { maxMissedSessions: $text }
    ) {
      id
      maxMissedSessions
    }
  }
`;

export const UPDATE_COURSE_REGISTRATION_TYPE = gql`
  mutation UpdateCourseRegistrationType($itemId: Int!, $value: CourseRegistrationType_enum!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { registrationType: $value }
    ) {
      id
      registrationType
    }
  }
`;

export const SAVE_COURSE_FORMBRICKS_ENROLLMENT_SURVEY = gql`
  mutation UpdateCourseFormbricksEnrollmentSurvey(
    $itemId: Int!
    $text: String!
  ) {
    saveCourseFormbricksEnrollmentSurvey(
      itemId: $itemId
      text: $text
    ) {
      success
      error
      messageKey
      courseId
      surveyId
      formbricksEnrollmentSurveyUrl
    }
  }
`;

export const UPDATE_COURSE_BASE_PRICE = gql`
  mutation UpdateCourseBasePrice($itemId: Int!, $text: Int!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { basePrice: $text }
    ) {
      id
      basePrice
    }
  }
`;

export const UPDATE_COURSE_CURRENCY = gql`
  mutation UpdateCourseCurrency($itemId: Int!, $value: String!) {
    update_Course_by_pk(
      pk_columns: { id: $itemId }
      _set: { currency: $value }
    ) {
      id
      currency
    }
  }
`;

/**
 * Guest registration is opt-in per event because it opens the only
 * unauthenticated write path in the application. The backend applies the same
 * check plus the program-type and registration-type restrictions.
 */
export const UPDATE_COURSE_GUEST_REGISTRATION_ENABLED = gql`
  mutation UpdateCourseGuestRegistrationEnabled($courseId: Int!, $value: Boolean!) {
    update_Course_by_pk(pk_columns: { id: $courseId }, _set: { guestRegistrationEnabled: $value }) {
      id
      guestRegistrationEnabled
    }
  }
`;
