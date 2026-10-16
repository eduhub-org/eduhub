/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateRausgegangenListingEnabled
// ====================================================

export interface UpdateRausgegangenListingEnabled_update_RausgegangenListing_by_pk {
  __typename: "RausgegangenListing";
  id: number;
  enabled: boolean;
}

export interface UpdateRausgegangenListingEnabled {
  /**
   * update single row of the table: "RausgegangenListing"
   */
  update_RausgegangenListing_by_pk: UpdateRausgegangenListingEnabled_update_RausgegangenListing_by_pk | null;
}

export interface UpdateRausgegangenListingEnabledVariables {
  id: number;
  value: boolean;
}
