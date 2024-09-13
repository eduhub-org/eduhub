import { gql } from '@apollo/client';

export const COURSE_GROUP_OPTIONS = gql`
  query CourseGroupOptions {
    CourseGroupOption(order_by: { order: asc }) {
      id
      order
      title
    }
  }
`;

// Mutation to update the order of a CourseGroupOption by its primary key
export const UPDATE_COURSE_GROUP_OPTION_ORDER = gql`
  mutation UpdateCourseGroupOptionOrder($id: Int!, $order: Int!) {
    update_CourseGroupOption_by_pk(pk_columns: { id: $id }, _set: { order: $order }) {
      id
      order
      __typename
    }
  }
`;
