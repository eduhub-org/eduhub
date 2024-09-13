import { gql } from '@apollo/client';
import { USER_FRAGMENT } from './userFragment';

export const ACHIEVEMENT_RECORD_AUTHOR_FRAGMENT = gql`
  ${USER_FRAGMENT}
  fragment AchievementRecordAuthorFragment on AchievementRecordAuthor {
    id
    created_at
    User {
      ...UserFragment
    }
  }
`;
