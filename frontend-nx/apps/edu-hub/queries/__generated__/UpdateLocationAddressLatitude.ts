/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressLatitude
// ====================================================

export interface UpdateLocationAddressLatitude_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  latitude: any | null;
}

export interface UpdateLocationAddressLatitude {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressLatitude_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressLatitudeVariables {
  itemId: number;
  text?: any | null;
}
