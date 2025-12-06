import { gql } from "@apollo/client";

export const INSERT_A_COURSEINSTRUCTOR = gql`
  mutation InsertCourseInstructor($courseId: Int!, $userId: uuid!) {
    insert_CourseInstructor(
      objects: { courseId: $courseId, userId: $userId }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_COURSE_INSRTRUCTOR = gql`
  mutation DeleteCourseInstructor($courseId: Int!, $userId: uuid!) {
    delete_CourseInstructor(
      where: {
        _and: [
          { courseId: { _eq: $courseId } }
          { userId: { _eq: $userId } }
        ]
      }
    ) {
      affected_rows
    }
  }
`;
