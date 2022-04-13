import { gql } from "@apollo/client";

export const COURSE_ENROLLMENT_BY_COURSE_ID = gql`
  query CourseEnrollmentByCourseID($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      maxMissedSessions
      CourseEnrollments(
        order_by: { User: { lastName: asc } }
        where: { courseId: { _eq: $courseId } }
      ) {
        id
        User {
          id
          firstName
          lastName
          email
          Attendances(where: { Session: { courseId: { _eq: $courseId } } }) {
            id
            status
            Session {
              id
            }
          }
        }
      }
      Sessions {
        id
        title
      }
    }
  }
`;

export const INSERT_SINGLE_ATTENDENCE = gql`
  mutation InsertSingleAttendence($input: Attendance_insert_input!) {
    insert_Attendance_one(object: $input) {
      id
    }
  }
`;

export const UPDATE_ATTENDENCE = gql`
  mutation UpdateSingleAttendenceByPk(
    $pkId: Int!
    $changes: Attendance_set_input!
  ) {
    update_Attendance_by_pk(pk_columns: { id: $pkId }, _set: $changes) {
      id
      status
    }
  }
`;
