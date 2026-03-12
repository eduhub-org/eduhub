/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteEmailTemplate
// ====================================================

export interface DeleteEmailTemplate_delete_MailTemplate_by_pk {
  __typename: "MailTemplate";
  id: number;
}

export interface DeleteEmailTemplate {
  /**
   * delete single row from the table: "MailTemplate"
   */
  delete_MailTemplate_by_pk: DeleteEmailTemplate_delete_MailTemplate_by_pk | null;
}

export interface DeleteEmailTemplateVariables {
  id: number;
}
