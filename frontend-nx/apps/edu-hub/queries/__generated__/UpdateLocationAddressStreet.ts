/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressStreet
// ====================================================

export interface UpdateLocationAddressStreet_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * Street and house number
   */
  street: string | null;
}

export interface UpdateLocationAddressStreet {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressStreet_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressStreetVariables {
  itemId: number;
  text?: string | null;
}
