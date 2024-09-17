import { graphql } from '../../types/generated';

export const ACHIEVEMENT_DOCUMENTATION_TEMPLATES = graphql(`
  query AchievementDocumentationTemplates {
    AchievementDocumentationTemplate(order_by: { updated_at: desc }) {
      id
      title
      url
      updated_at
    }
  }
`);

export const INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = graphql(`
  mutation InsertAchievementDocumentationTemplate($insertInput: AchievementDocumentationTemplate_insert_input!) {
    insert_AchievementDocumentationTemplate_one(object: $insertInput) {
      id
    }
  }
`);

export const UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = graphql(`
  mutation UpdateAchievementDocumentationTemplate($itemId: Int!, $text: String, $url: String) {
    update_AchievementDocumentationTemplate_by_pk(pk_columns: { id: $itemId }, _set: { title: $text, url: $url }) {
      id
      title
    }
  }
`);

export const UPDATE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE_TITLE = graphql(`
  mutation UpdateAchievementDocumentationTemplateTitle($itemId: Int!, $text: String) {
    update_AchievementDocumentationTemplate_by_pk(pk_columns: { id: $itemId }, _set: { title: $text }) {
      id
      title
    }
  }
`);

export const DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE = graphql(`
  mutation DeleteAchievementDocumentationTemplate($id: Int!) {
    delete_AchievementDocumentationTemplate_by_pk(id: $id) {
      id
    }
  }
`);
