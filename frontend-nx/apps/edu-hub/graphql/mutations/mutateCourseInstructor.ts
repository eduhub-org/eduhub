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

export const DELETE_COURSE_INSRTRUCTOR = gql`
  mutation DeleteCourseInstructor($courseId: Int!, $expertId: Int!) {
    delete_CourseInstructor(
      where: {
        _and: [
          { courseId: { _eq: $courseId } }
          { expertId: { _eq: $expertId } }
        ]
      }
    ) {
      affected_rows
    }
  }
`;
