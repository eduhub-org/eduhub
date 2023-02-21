import { gql } from '@apollo/client';
import { USER_FRAGMENT } from './userFragment';

export const ACHIEVEMENT_RECORD_AUTHORS = gql`
  ${USER_FRAGMENT}
  query AchievementRecordAuthorQuery(
    $where: AchievementRecordAuthor_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
    $orderBy: AchievementRecordAuthor_order_by = { id: desc }
  ) {
    AchievementRecordAuthor(
      order_by: [$orderBy]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      id
      created_at
      User {
        ...UserFragment
      }
    }
  }
`;
