import { graphql } from '../../types/generated';

export const INSERT_COURSE = graphql(`
  mutation InsertCourseWithLocation(
    $title: String!
    $applicationEnd: date!
    $maxMissedSessions: Int!
    $programId: Int!
    $locationOption: LocationOption_enum!
  ) {
    insert_Course(
      objects: {
        title: $title
        tagline: ""
        language: "DE"
        applicationEnd: $applicationEnd
        maxMissedSessions: $maxMissedSessions
        programId: $programId
        CourseLocations: { data: { locationOption: $locationOption, defaultSessionAddress: "" } }
      }
    ) {
      affected_rows
      returning {
        id
        CourseLocations {
          id
        }
      }
    }
  }
`);

export const INSERT_A_COURSE = graphql(`
  mutation InsertSingleCourse($course: Course_insert_input!) {
    insert_Course_one(object: $course) {
      id
    }
  }
`);

export const DELETE_A_COURSE = graphql(`
  mutation DeleteCourseByPk($id: Int!) {
    delete_Course_by_pk(id: $id) {
      id
    }
  }
`);

/*
Be carefull about key property, It has to be same as a colum name of a "Course" table,
Example: changes = {
  visivility: true,
}
here 'visivility' is a database column
*/

export const UPDATE_COURSE_PROPERTY = graphql(`
  mutation UpdateCourseByPk($id: Int!, $changes: Course_set_input) {
    update_Course_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`);
