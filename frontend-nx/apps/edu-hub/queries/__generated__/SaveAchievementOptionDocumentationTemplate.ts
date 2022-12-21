/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementOptionDocumentationTemplate
// ====================================================

export interface SaveAchievementOptionDocumentationTemplate_saveAchievementOptionDocumentationTemplate {
  __typename: "loadFileOutput";
  link: string;
}

export interface SaveAchievementOptionDocumentationTemplate {
  saveAchievementOptionDocumentationTemplate: SaveAchievementOptionDocumentationTemplate_saveAchievementOptionDocumentationTemplate | null;
}

export interface SaveAchievementOptionDocumentationTemplateVariables {
  base64File: string;
  courseId: number;
}
