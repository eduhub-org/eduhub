import { gql } from "@apollo/client";

export const COPY_COURSES_TO_PROGRAM = gql`
  mutation CopyCoursesToProgram($courses: [Course_insert_input!]!) {
    insert_Course(objects: $courses) {
      affected_rows
      returning {
        id
        title
        programId
      }
    }
  }
`; 