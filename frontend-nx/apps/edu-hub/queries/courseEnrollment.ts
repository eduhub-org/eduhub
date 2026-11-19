import { gql } from '@apollo/client';
import { COURSE_INSTRUCTOR_FRAGMENT } from './courseEnrollmentFragment';
import { USER_FRAGMENT } from './userFragment';

// Hasura runs both fields in one transaction, so a session keeps at most one Manual Attendance
// per participant however often the instructor clicks.
export const SET_MANUAL_ATTENDANCE = gql`
  mutation SetManualAttendance($userId: uuid!, $sessionId: Int!, $status: AttendanceStatus_enum!) {
    delete_Attendance(
      where: { userId: { _eq: $userId }, sessionId: { _eq: $sessionId }, source: { _eq: "INSTRUCTOR" } }
    ) {
      affected_rows
    }
    insert_Attendance_one(
      object: { userId: $userId, sessionId: $sessionId, status: $status, source: "INSTRUCTOR" }
    ) {
      id
    }
  }
`;

// Reverting to the automatic result removes the session's Manual Attendances.
export const DELETE_MANUAL_ATTENDANCES = gql`
  mutation DeleteManualAttendances($userId: uuid!, $sessionId: Int!) {
    delete_Attendance(
      where: { userId: { _eq: $userId }, sessionId: { _eq: $sessionId }, source: { _eq: "INSTRUCTOR" } }
    ) {
      affected_rows
    }
  }
`;

export const UPDATE_ATTENDANCE = gql`
  mutation UpdateSingleAttendanceByPk(
    $pkId: Int!
    $changes: Attendance_set_input!
  ) {
    update_Attendance_by_pk(pk_columns: { id: $pkId }, _set: $changes) {
      id
      status
    }
  }
`;

export const REMOVE_ACHIEVEMENT_CERTIFICATES = gql`
  mutation RemoveAchievementCertificates($enrollmentIds: [Int!]!) {
    update_CourseEnrollment(
      where: { id: { _in: $enrollmentIds } }
      _set: { achievementCertificateURL: null }
    ) {
      affected_rows
      returning {
        id
        achievementCertificateURL
      }
    }
  }
`;

export const REMOVE_ATTENDANCE_CERTIFICATES = gql`
  mutation RemoveAttendanceCertificates($enrollmentIds: [Int!]!) {
    update_CourseEnrollment(
      where: { id: { _in: $enrollmentIds } }
      _set: { attendanceCertificateURL: null }
    ) {
      affected_rows
      returning {
        id
        attendanceCertificateURL
      }
    }
  }
`;

export const COURSE_ENROLLMENTS = gql`
  ${COURSE_INSTRUCTOR_FRAGMENT}
  query CourseEnrollmentQuery(
    $where: CourseEnrollment_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    CourseEnrollment(
      order_by: { id: desc }
      where: { _and: [{ isTest: { _eq: false } }, $where] }
      limit: $limit
      offset: $offset
    ) {
      ...CourseEnrollmentFragment
    }
  }
`;

export const COURSE_ENROLLMENTS_WITH_USER = gql`
  ${COURSE_INSTRUCTOR_FRAGMENT}
  ${USER_FRAGMENT}
  query CourseEnrollmentWithUserQuery(
    $where: CourseEnrollment_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    CourseEnrollment(
      order_by: { id: desc }
      where: { _and: [{ isTest: { _eq: false } }, $where] }
      limit: $limit
      offset: $offset
    ) {
      ...CourseEnrollmentFragment
      User {
        ...UserFragment
      }
    }
  }
`;
