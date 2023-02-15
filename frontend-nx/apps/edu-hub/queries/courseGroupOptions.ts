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
