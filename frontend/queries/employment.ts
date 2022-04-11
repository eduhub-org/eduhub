import { gql } from "@apollo/client";

export const EMPLOYMENT_LIST = gql`
  query EmplomentByValue {
    Employment(order_by: { value: asc }) {
      value
      comment
    }
  }
`;
