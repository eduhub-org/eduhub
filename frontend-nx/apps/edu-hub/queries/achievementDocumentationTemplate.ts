import { gql } from '@apollo/client';

export const ACHIEVEMENT_DOCUMENTATION_TEMPLATES = gql`
  query AchievementDocumentationTemplates {
    AchievementDocumentationTemplate {
      id
      title
      url
    }
  }
`;

export const INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = gql`
  mutation InsertAchievementDocumentationTemplate($insertInput: AchievementDocumentationTemplate_insert_input!) {
    insert_AchievementDocumentationTemplate_one(object: $insertInput) {
      id
    }
  }
`;

export const DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = gql`
  mutation DeleteAchievementDocumentationTemplate($id: Int!) {
    delete_AchievementDocumentationTemplate_by_pk(id: $id) {
      id
    }
  }
`;
