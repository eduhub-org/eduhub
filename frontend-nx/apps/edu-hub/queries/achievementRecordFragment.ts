import { gql } from '@apollo/client';

export const ACHIEVEMENT_RECORD_FRAGMENT = gql`
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
`;
