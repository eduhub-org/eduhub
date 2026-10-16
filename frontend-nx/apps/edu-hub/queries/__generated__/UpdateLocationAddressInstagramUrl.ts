/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressInstagramUrl
// ====================================================

export interface UpdateLocationAddressInstagramUrl_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  instagramUrl: string | null;
}

export interface UpdateLocationAddressInstagramUrl {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressInstagramUrl_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressInstagramUrlVariables {
  itemId: number;
  text?: string | null;
}
