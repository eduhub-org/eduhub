import { gql } from '@apollo/client';

export const INSERT_COURSE_DEGREE_TAG = gql`
  mutation InsertCourseDegreeTag($itemId: Int!, $tagId: Int!) {
    insert_CourseDegree(
      objects: { courseId: $itemId, degreeCourseId: $tagId }
    ) {
      affected_rows
    }
  }
`;

export const DELETE_COURSE_DEGREE_TAG = gql`
  mutation DeleteCourseDegreeTag($itemId: Int!, $tagId: Int!) {
    delete_CourseDegree(
      where: {
        Course: { id: { _eq: $itemId } }
        _and: { DegreeCourse: { id: { _eq: $tagId } } }
      }
    ) {
      affected_rows
    }
  }
`;
