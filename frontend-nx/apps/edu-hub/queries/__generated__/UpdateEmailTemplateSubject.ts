/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateEmailTemplateSubject
// ====================================================

export interface UpdateEmailTemplateSubject_update_MailTemplate_by_pk {
  __typename: "MailTemplate";
  id: number;
  /**
   * The subject of the email
   */
  subject: string;
  updated_at: any;
}

export interface UpdateEmailTemplateSubject {
  /**
   * update single row of the table: "MailTemplate"
   */
  update_MailTemplate_by_pk: UpdateEmailTemplateSubject_update_MailTemplate_by_pk | null;
}

export interface UpdateEmailTemplateSubjectVariables {
  id: number;
  subject: string;
}
