/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEmailTemplateContent
// ====================================================

export interface UpdateEmailTemplateContent_update_MailTemplate_by_pk {
  __typename: "MailTemplate";
  id: number;
  /**
   * The (html) text content of the email
   */
  content: string;
  updated_at: any;
}

export interface UpdateEmailTemplateContent {
  /**
   * update single row of the table: "MailTemplate"
   */
  update_MailTemplate_by_pk: UpdateEmailTemplateContent_update_MailTemplate_by_pk | null;
}

export interface UpdateEmailTemplateContentVariables {
  id: number;
  content: string;
}
