/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteMyAccount
// ====================================================

export interface DeleteMyAccount_deleteMyAccount {
  __typename: "AnonymizeUserResult";
  messageKey: string | null;
  error: string | null;
}

export interface DeleteMyAccount {
  /**
   * Deletes only the account identified by the verified Hasura session; accepts no target user ID
   */
  deleteMyAccount: DeleteMyAccount_deleteMyAccount | null;
}
