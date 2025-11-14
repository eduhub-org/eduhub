/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetDefaultTemplates
// ====================================================

export interface GetDefaultTemplates_MailTemplate {
  __typename: "MailTemplate";
  id: number;
  /**
   * Mail template type
   */
  type: string | null;
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

export interface GetDefaultTemplates {
  /**
   * fetch data from the table: "MailTemplate"
   */
  MailTemplate: GetDefaultTemplates_MailTemplate[];
}
