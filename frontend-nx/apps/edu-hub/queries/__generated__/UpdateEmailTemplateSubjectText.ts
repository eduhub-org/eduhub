/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEmailTemplateSubjectText
// ====================================================

export interface UpdateEmailTemplateSubjectText_update_MailTemplate_by_pk {
  __typename: "MailTemplate";
  id: number;
  /**
   * The subject of the email
   */
  subject: string;
  updated_at: any;
}

export interface UpdateEmailTemplateSubjectText {
  /**
   * update single row of the table: "MailTemplate"
   */
  update_MailTemplate_by_pk: UpdateEmailTemplateSubjectText_update_MailTemplate_by_pk | null;
}

export interface UpdateEmailTemplateSubjectTextVariables {
  itemId: number;
  text: string;
}
