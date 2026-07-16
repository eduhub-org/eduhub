/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MailTemplate_insert_input, MailTemplateType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertEmailTemplate
// ====================================================

export interface InsertEmailTemplate_insert_MailTemplate_one {
  __typename: "MailTemplate";
  id: number;
  /**
   * Mail template type
   */
  type: MailTemplateType_enum | null;
  courseId: number | null;
  /**
   * The subject of the email
   */
  subject: string;
  /**
   * The (html) text content of the email
   */
  content: string;
  /**
   * Mail adress provided as sender address
   */
  from: string | null;
  /**
   * Mail adresses that are receiving a carbon copy
   */
  cc: string | null;
  /**
   * Mail adresses that are receiving a blind carbon copy
   */
  bcc: string | null;
}

export interface InsertEmailTemplate {
  /**
   * insert a single row into the table: "MailTemplate"
   */
  insert_MailTemplate_one: InsertEmailTemplate_insert_MailTemplate_one | null;
}

export interface InsertEmailTemplateVariables {
  object: MailTemplate_insert_input;
}
