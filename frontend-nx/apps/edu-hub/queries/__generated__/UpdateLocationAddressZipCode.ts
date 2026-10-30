/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressZipCode
// ====================================================

export interface UpdateLocationAddressZipCode_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  zipCode: string | null;
}

export interface UpdateLocationAddressZipCode {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressZipCode_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressZipCodeVariables {
  itemId: number;
  text?: string | null;
}
