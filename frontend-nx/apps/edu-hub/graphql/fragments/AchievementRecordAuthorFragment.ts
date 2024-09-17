import { graphql } from '../../types/generated';

export const ACHIEVEMENT_RECORD_AUTHOR_FRAGMENT = graphql(`
  fragment AchievementRecordAuthorFragment on AchievementRecordAuthor {
    id
    created_at
    User {
      ...UserFragment
    }
  }
`);
