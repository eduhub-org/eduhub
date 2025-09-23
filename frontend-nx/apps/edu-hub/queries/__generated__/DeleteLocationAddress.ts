/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteLocationAddress
// ====================================================

export interface DeleteLocationAddress_delete_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
}

export interface DeleteLocationAddress {
  /**
   * delete single row from the table: "LocationAddress"
   */
  delete_LocationAddress_by_pk: DeleteLocationAddress_delete_LocationAddress_by_pk | null;
}

export interface DeleteLocationAddressVariables {
  id: number;
}
