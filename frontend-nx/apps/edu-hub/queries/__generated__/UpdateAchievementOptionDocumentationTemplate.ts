/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAchievementOptionDocumentationTemplate
// ====================================================

export interface UpdateAchievementOptionDocumentationTemplate_update_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface UpdateAchievementOptionDocumentationTemplate {
  /**
   * update single row of the table: "AchievementOption"
   */
  update_AchievementOption_by_pk: UpdateAchievementOptionDocumentationTemplate_update_AchievementOption_by_pk | null;
}

export interface UpdateAchievementOptionDocumentationTemplateVariables {
  itemId: number;
  value?: number | null;
}
