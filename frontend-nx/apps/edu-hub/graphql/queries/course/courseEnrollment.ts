import { graphql } from '../../../types/generated';

export const INSERT_SINGLE_ATTENDANCE = graphql(`
  mutation InsertSingleAttendance($input: Attendance_insert_input!) {
    insert_Attendance_one(object: $input) {
      id
    }
  }
`);

export const UPDATE_ATTENDANCE = graphql(`
  mutation UpdateSingleAttendanceByPk($pkId: Int!, $changes: Attendance_set_input!) {
    update_Attendance_by_pk(pk_columns: { id: $pkId }, _set: $changes) {
      id
      status
    }
  }
`);

export const COURSE_ENROLLMENTS = graphql(`
  query CourseEnrollmentQuery($where: CourseEnrollment_bool_exp! = {}, $limit: Int = null, $offset: Int = 0) {
    CourseEnrollment(order_by: { id: desc }, where: $where, limit: $limit, offset: $offset) {
      ...CourseEnrollmentFragment
    }
  }
`);

export const COURSE_ENROLLMENTS_WITH_USER = graphql(`
  query CourseEnrollmentWithUserQuery($where: CourseEnrollment_bool_exp! = {}, $limit: Int = null, $offset: Int = 0) {
    CourseEnrollment(order_by: { id: desc }, where: $where, limit: $limit, offset: $offset) {
      ...CourseEnrollmentFragment
      User {
        ...UserFragment
      }
    }
  }
`);
