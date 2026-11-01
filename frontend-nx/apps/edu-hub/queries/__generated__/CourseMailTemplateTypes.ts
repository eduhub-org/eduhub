/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MailTemplateType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseMailTemplateTypes
// ====================================================

export interface CourseMailTemplateTypes_MailTemplate {
  __typename: "MailTemplate";
  id: number;
  /**
   * Mail template type
   */
  type: MailTemplateType_enum | null;
}

export interface CourseMailTemplateTypes {
  /**
   * fetch data from the table: "MailTemplate"
   */
  MailTemplate: CourseMailTemplateTypes_MailTemplate[];
}

export interface CourseMailTemplateTypesVariables {
  courseId: number;
}
