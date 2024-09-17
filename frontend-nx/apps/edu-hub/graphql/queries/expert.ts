import { graphql } from '../../types/generated';

export const EXPERT_LIST = graphql(`
  query ExpertList($where: Expert_bool_exp! = {}, $limit: Int = null, $offset: Int = 0) {
    Expert(order_by: { id: desc }, where: $where, limit: $limit, offset: $offset) {
      id
      userId
      User {
        firstName
        lastName
        email
      }
    }
  }
`);
