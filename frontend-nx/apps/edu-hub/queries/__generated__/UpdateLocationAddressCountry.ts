/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressCountry
// ====================================================

export interface UpdateLocationAddressCountry_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  country: string | null;
}

export interface UpdateLocationAddressCountry {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressCountry_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressCountryVariables {
  itemId: number;
  text?: string | null;
}
