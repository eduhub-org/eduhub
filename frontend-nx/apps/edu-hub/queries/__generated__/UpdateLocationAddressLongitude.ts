/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressLongitude
// ====================================================

export interface UpdateLocationAddressLongitude_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  longitude: any | null;
}

export interface UpdateLocationAddressLongitude {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressLongitude_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressLongitudeVariables {
  itemId: number;
  text?: any | null;
}
