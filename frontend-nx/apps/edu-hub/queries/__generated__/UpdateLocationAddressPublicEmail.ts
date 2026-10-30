/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressPublicEmail
// ====================================================

export interface UpdateLocationAddressPublicEmail_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  publicEmail: string | null;
}

export interface UpdateLocationAddressPublicEmail {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressPublicEmail_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressPublicEmailVariables {
  itemId: number;
  text?: string | null;
}
