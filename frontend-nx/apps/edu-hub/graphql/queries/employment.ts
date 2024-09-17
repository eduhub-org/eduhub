import { graphql } from '../../types/generated';

export const EMPLOYMENT_LIST = graphql(`
  query EmplomentByValue {
    Employment(order_by: { value: asc }) {
      value
      comment
    }
  }
`);
