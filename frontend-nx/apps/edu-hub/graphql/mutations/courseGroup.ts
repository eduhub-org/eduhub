import { graphql } from '../../types/generated';

export const INSERT_COURSE_GROUP_TAG = graphql(`
  mutation InsertCourseGroup($itemId: Int!, $tagId: Int!) {
    insert_CourseGroup(objects: { courseId: $itemId, groupOptionId: $tagId }) {
      affected_rows
    }
  }
`);

export const DELETE_COURSE_GROUP_TAG = graphql(`
  mutation DeleteCourseGroup($itemId: Int!, $tagId: Int!) {
    delete_CourseGroup(
      where: { Course: { id: { _eq: $itemId } }, _and: { CourseGroupOption: { id: { _eq: $tagId } } } }
    ) {
      affected_rows
    }
  }
`);
