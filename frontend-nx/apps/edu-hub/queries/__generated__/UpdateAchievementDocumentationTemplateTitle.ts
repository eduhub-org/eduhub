/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAchievementDocumentationTemplateTitle
// ====================================================

export interface UpdateAchievementDocumentationTemplateTitle_update_AchievementDocumentationTemplate_by_pk {
  __typename: "AchievementDocumentationTemplate";
  id: number;
  title: string;
}

export interface UpdateAchievementDocumentationTemplateTitle {
  /**
   * update single row of the table: "AchievementDocumentationTemplate"
   */
  update_AchievementDocumentationTemplate_by_pk: UpdateAchievementDocumentationTemplateTitle_update_AchievementDocumentationTemplate_by_pk | null;
}

export interface UpdateAchievementDocumentationTemplateTitleVariables {
  itemId: number;
  text?: string | null;
}
