/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAchievementDocumentationTemplate
// ====================================================

export interface DeleteAchievementDocumentationTemplate_delete_AchievementDocumentationTemplate_by_pk {
  __typename: "AchievementDocumentationTemplate";
  id: number;
}

export interface DeleteAchievementDocumentationTemplate {
  /**
   * delete single row from the table: "AchievementDocumentationTemplate"
   */
  delete_AchievementDocumentationTemplate_by_pk: DeleteAchievementDocumentationTemplate_delete_AchievementDocumentationTemplate_by_pk | null;
}

export interface DeleteAchievementDocumentationTemplateVariables {
  id: number;
}
