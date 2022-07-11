/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MailTemplates
// ====================================================

export interface MailTemplates_MailTemplate {
  __typename: "MailTemplate";
  id: number;
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
  /**
   * Title of the mail template (to provide basic info on what it's used for)
   */
  title: string | null;
}

export interface MailTemplates {
  /**
   * fetch data from the table: "MailTemplate"
   */
  MailTemplate: MailTemplates_MailTemplate[];
}
