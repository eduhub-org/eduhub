import { gql } from "@apollo/client";

export const UNIVERSITY_LIST = gql`
  query UnversityByComment {
    University(order_by: { comment: asc }) {
      value
      comment
    }
  }
`;
