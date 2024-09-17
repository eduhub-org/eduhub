import { graphql } from '../../types/generated';

export const UNIVERSITY_LIST = graphql(`
  query UnversityByComment {
    University(order_by: { comment: asc }) {
      value
      comment
    }
  }
`);
