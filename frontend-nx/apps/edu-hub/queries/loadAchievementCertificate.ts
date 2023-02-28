import { gql } from '@apollo/client';

export const LOAD_ACHIEVEMENT_CERTIFICATE = gql`
  query loadAchievementCertificate($path: String!) {
    loadAchievementCertificate(path: $path) {
      link
    }
  }
`;
