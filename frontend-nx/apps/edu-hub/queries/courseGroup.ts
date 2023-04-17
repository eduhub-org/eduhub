
  import { gql } from '@apollo/client';

  export const INSERT_COURSE_GROUP = gql`
    mutation InsertCourseGroup($courseId: Int!, $courseGroupOptionId: Int!) {
      insert_CourseGroup(
        objects: { courseId: $courseId, groupOptionId: $courseGroupOptionId }
      ) {
        affected_rows
      }
    }
  `;

  export const DELETE_COURSE_GROUP = gql`
    mutation DeleteCourseGroup($courseId: Int!, $courseGroupOptionId: Int!) {
      delete_CourseGroup(
        where: {
          Course: { id: { _eq: $courseId } }
          _and: { CourseGroupOption: { id: { _eq: $courseGroupOptionId } } }
        }
      ) {
        affected_rows
      }
    }
  `;
