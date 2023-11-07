import { gql } from '@apollo/client';

export const INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = gql`
  mutation InsertAchievementDocumentationTemplate($insertInput: AchievementDocumentationTemplate_insert_input!) {
    insert_AchievementDocumentationTemplate_one(object: $insertInput) {
      id
    }
  }
`;
