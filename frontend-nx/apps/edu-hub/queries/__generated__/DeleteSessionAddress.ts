/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteSessionAddress
// ====================================================

export interface DeleteSessionAddress_delete_SessionAddress_by_pk {
  __typename: "SessionAddress";
  id: number;
}

export interface DeleteSessionAddress {
  /**
   * delete single row from the table: "SessionAddress"
   */
  delete_SessionAddress_by_pk: DeleteSessionAddress_delete_SessionAddress_by_pk | null;
}

export interface DeleteSessionAddressVariables {
  id: number;
}
