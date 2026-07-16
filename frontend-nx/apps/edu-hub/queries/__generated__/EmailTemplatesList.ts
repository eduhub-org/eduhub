/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MailTemplate_bool_exp, MailTemplate_order_by, MailTemplateType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: EmailTemplatesList
// ====================================================

export interface EmailTemplatesList_MailTemplate {
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
  created_at: any;
  updated_at: any;
}

export interface EmailTemplatesList_MailTemplate_aggregate_aggregate {
  __typename: "MailTemplate_aggregate_fields";
  count: number;
}

export interface EmailTemplatesList_MailTemplate_aggregate {
  __typename: "MailTemplate_aggregate";
  aggregate: EmailTemplatesList_MailTemplate_aggregate_aggregate | null;
}

export interface EmailTemplatesList {
  /**
   * fetch data from the table: "MailTemplate"
   */
  MailTemplate: EmailTemplatesList_MailTemplate[];
  /**
   * fetch aggregated fields from the table: "MailTemplate"
   */
  MailTemplate_aggregate: EmailTemplatesList_MailTemplate_aggregate;
}

export interface EmailTemplatesListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: MailTemplate_bool_exp | null;
  order_by?: MailTemplate_order_by[] | null;
}
