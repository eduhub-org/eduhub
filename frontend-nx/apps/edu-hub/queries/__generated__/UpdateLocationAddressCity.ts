/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressCity
// ====================================================

export interface UpdateLocationAddressCity_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  city: string | null;
}

export interface UpdateLocationAddressCity {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressCity_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressCityVariables {
  itemId: number;
  text?: string | null;
}
