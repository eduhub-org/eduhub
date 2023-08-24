import { gql } from '@apollo/client';

export const INSERT_COURSE_DEGREE = gql`
  mutation InsertCourseDegree($courseId: Int!, $degreeCourseId: Int!) {
    insert_CourseDegree(
      objects: { courseId: $courseId, degreeCourseId: $degreeCourseId }
    ) {
      affected_rows
    }
  }
`;

export const DELETE_COURSE_DEGREE = gql`
  mutation DeleteCourseDegree($courseId: Int!, $degreeCourseId: Int!) {
    delete_CourseDegree(
      where: {
        courseId: { _eq: $courseId }
        degreeCourseId: { _eq: $degreeCourseId }
      }
    ) {
      affected_rows
    }
  }
`;
