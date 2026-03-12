/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementDocumentationTemplate_bool_exp, AchievementDocumentationTemplate_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementDocumentationTemplates
// ====================================================

export interface AchievementDocumentationTemplates_AchievementDocumentationTemplate {
  __typename: "AchievementDocumentationTemplate";
  id: number;
  title: string;
  url: string;
  updated_at: any;
}

export interface AchievementDocumentationTemplates_AchievementDocumentationTemplate_aggregate_aggregate {
  __typename: "AchievementDocumentationTemplate_aggregate_fields";
  count: number;
}

export interface AchievementDocumentationTemplates_AchievementDocumentationTemplate_aggregate {
  __typename: "AchievementDocumentationTemplate_aggregate";
  aggregate: AchievementDocumentationTemplates_AchievementDocumentationTemplate_aggregate_aggregate | null;
}

export interface AchievementDocumentationTemplates {
  /**
   * fetch data from the table: "AchievementDocumentationTemplate"
   */
  AchievementDocumentationTemplate: AchievementDocumentationTemplates_AchievementDocumentationTemplate[];
  /**
   * fetch aggregated fields from the table: "AchievementDocumentationTemplate"
   */
  AchievementDocumentationTemplate_aggregate: AchievementDocumentationTemplates_AchievementDocumentationTemplate_aggregate;
}

export interface AchievementDocumentationTemplatesVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: AchievementDocumentationTemplate_bool_exp | null;
  order_by?: AchievementDocumentationTemplate_order_by[] | null;
}
