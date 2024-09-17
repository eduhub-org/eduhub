import { graphql } from '../../types/generated';

export const COURSE_GROUP_OPTIONS = graphql(`
  query CourseGroupOptions {
    CourseGroupOption(order_by: { order: asc }) {
      id
      order
      title
    }
  }
`);

// Mutation to update the order of a CourseGroupOption by its primary key
export const UPDATE_COURSE_GROUP_OPTION_ORDER = graphql(`
  mutation UpdateCourseGroupOptionOrder($id: Int!, $order: Int!) {
    update_CourseGroupOption_by_pk(pk_columns: { id: $id }, _set: { order: $order }) {
      id
      order
      __typename
    }
  }
`);
