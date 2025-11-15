/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetCourseTemplatesCount
// ====================================================

export interface GetCourseTemplatesCount_MailTemplate_aggregate_aggregate {
  __typename: "MailTemplate_aggregate_fields";
  count: number;
}

export interface GetCourseTemplatesCount_MailTemplate_aggregate {
  __typename: "MailTemplate_aggregate";
  aggregate: GetCourseTemplatesCount_MailTemplate_aggregate_aggregate | null;
}

export interface GetCourseTemplatesCount {
  /**
   * fetch aggregated fields from the table: "MailTemplate"
   */
  MailTemplate_aggregate: GetCourseTemplatesCount_MailTemplate_aggregate;
}

export interface GetCourseTemplatesCountVariables {
  courseId: number;
}
