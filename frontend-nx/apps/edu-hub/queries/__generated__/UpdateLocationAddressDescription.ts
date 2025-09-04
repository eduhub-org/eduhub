/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressDescription
// ====================================================

export interface UpdateLocationAddressDescription_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * Optional notes or additional information about the location.
   */
  description: string | null;
}

export interface UpdateLocationAddressDescription {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressDescription_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressDescriptionVariables {
  itemId: number;
  text: string;
}
