import { gql } from '@apollo/client';
import { COURSE_INSTRUCTOR_FRAGMENT } from './courseEnrollmentFragment';
import { USER_FRAGMENT } from './userFragment';

export const INSERT_SINGLE_ATTENDANCE = gql`
  mutation InsertSingleAttendance($input: Attendance_insert_input!) {
    insert_Attendance_one(object: $input) {
      id
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

export const COURSE_ENROLLMENTS = gql`
  ${COURSE_INSTRUCTOR_FRAGMENT}
  query CourseEnrollmentQuery(
    $where: CourseEnrollment_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    CourseEnrollment(
      order_by: { id: desc }
      where: $where
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
      where: $where
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
