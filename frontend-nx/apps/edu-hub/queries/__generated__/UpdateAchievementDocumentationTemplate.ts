/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAchievementDocumentationTemplate
// ====================================================

export interface UpdateAchievementDocumentationTemplate_update_AchievementDocumentationTemplate_by_pk {
  __typename: "AchievementDocumentationTemplate";
  id: number;
  title: string;
}

export interface UpdateAchievementDocumentationTemplate {
  /**
   * update single row of the table: "AchievementDocumentationTemplate"
   */
  update_AchievementDocumentationTemplate_by_pk: UpdateAchievementDocumentationTemplate_update_AchievementDocumentationTemplate_by_pk | null;
}

export interface UpdateAchievementDocumentationTemplateVariables {
  itemId: number;
  text?: string | null;
  url?: string | null;
}
