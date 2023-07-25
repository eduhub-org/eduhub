import { gql } from '@apollo/client';

export const LOAD_ACHIEVEMENT_RECORD_DOCUMENTATION = gql`
  query loadAchievementRecordDocumentation($path: String!) {
    loadAchievementRecordDocumentation(path: $path) {
      link
    }
  }
`;
