/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEmailTemplateContentText
// ====================================================

export interface UpdateEmailTemplateContentText_update_MailTemplate_by_pk {
  __typename: "MailTemplate";
  id: number;
  /**
   * The (html) text content of the email
   */
  content: string;
  updated_at: any;
}

export interface UpdateEmailTemplateContentText {
  /**
   * update single row of the table: "MailTemplate"
   */
  update_MailTemplate_by_pk: UpdateEmailTemplateContentText_update_MailTemplate_by_pk | null;
}

export interface UpdateEmailTemplateContentTextVariables {
  itemId: number;
  text: string;
}
