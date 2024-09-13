import { gql } from "@apollo/client";

export const EXPERT_LIST = gql`
  query ExpertList(
    $where: Expert_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    Expert(
      order_by: { id: desc }
      where: $where
      limit: $limit
      offset: $offset
    ) {
      id
      userId
      User {
        firstName
        lastName
        email
      }
    }
  }
`;
