/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementDocumentationTemplate_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAchievementDocumentationTemplate
// ====================================================

export interface InsertAchievementDocumentationTemplate_insert_AchievementDocumentationTemplate_one {
  __typename: "AchievementDocumentationTemplate";
  id: number;
}

export interface InsertAchievementDocumentationTemplate {
  /**
   * insert a single row into the table: "AchievementDocumentationTemplate"
   */
  insert_AchievementDocumentationTemplate_one: InsertAchievementDocumentationTemplate_insert_AchievementDocumentationTemplate_one | null;
}

export interface InsertAchievementDocumentationTemplateVariables {
  insertInput: AchievementDocumentationTemplate_insert_input;
}
