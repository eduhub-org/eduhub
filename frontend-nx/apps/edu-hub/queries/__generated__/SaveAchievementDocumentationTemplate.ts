/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementDocumentationTemplate
// ====================================================

export interface SaveAchievementDocumentationTemplate_saveAchievementDocumentationTemplate {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveAchievementDocumentationTemplate {
  saveAchievementDocumentationTemplate: SaveAchievementDocumentationTemplate_saveAchievementDocumentationTemplate | null;
}

export interface SaveAchievementDocumentationTemplateVariables {
  base64File: string;
  fileName: string;
  achievementDocumentationTemplateId: number;
}
