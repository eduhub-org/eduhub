import { gql } from "@apollo/client";

export const INSERT_A_COURSE = gql`
  mutation InsertSingleCourse($course: Course_insert_input!) {
    insert_Course_one(object: $course) {
      id
    }
  }
`;

export const DELETE_A_COURSE = gql`
  mutation DeleteCourseByPk($id: Int!) {
    delete_Course_by_pk(id: $id) {
      id
    }
  }
`;

/* 
Be carefull about key property, It has to be same as a colum name of a "Course" table,
Example: changes = {
  visivility: true,
}
here 'visivility' is a database column
*/

export const UPDATE_COURSE_PROPERTY = gql`
  mutation UpdateCourseByPk($id: Int!, $changes: Course_set_input) {
    update_Course_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`;
