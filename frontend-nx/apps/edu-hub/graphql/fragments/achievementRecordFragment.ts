import { graphql } from '../../types/generated';

export const ACHIEVEMENT_RECORD_FRAGMENT = graphql(`
  fragment AchievementRecordFragment on AchievementRecord {
    id
    created_at
    csvResults
    description
    achievementOptionId
    uploadUserId
    coverImageUrl
    score
    rating
    documentationUrl
    AchievementOption {
      id
      title
      recordType
    }
  }
`);
