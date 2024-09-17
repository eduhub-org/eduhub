import { graphql } from '../../../types/generated';

export const ACHIEVEMENT_RECORD_AUTHORS = graphql(`
  query AchievementRecordAuthorQuery(
    $where: AchievementRecordAuthor_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementRecordAuthor_order_by = { id: desc }
  ) {
    AchievementRecordAuthor(order_by: [$orderBy], where: $where, limit: $limit, offset: $offset) {
      id
      created_at
      User {
        ...UserFragment
      }
    }
  }
`);
