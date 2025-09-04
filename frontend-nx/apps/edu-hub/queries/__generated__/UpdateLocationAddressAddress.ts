/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressAddress
// ====================================================

export interface UpdateLocationAddressAddress_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * Full human-readable address (street, building, room number, etc.).
   */
  address: string;
}

export interface UpdateLocationAddressAddress {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressAddress_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressAddressVariables {
  itemId: number;
  text: string;
}
