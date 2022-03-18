import { gql } from "@apollo/client";

export const INSERT_A_COURSEINSTRUCTOR = gql`
  mutation InsertCourseInstructor($courseId: Int!, $expertId: Int!) {
    insert_CourseInstructor(
      objects: { courseId: $courseId, expertId: $expertId }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;
