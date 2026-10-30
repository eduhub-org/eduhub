/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressImageCredits
// ====================================================

export interface UpdateLocationAddressImageCredits_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  imageCredits: string | null;
}

export interface UpdateLocationAddressImageCredits {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressImageCredits_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressImageCreditsVariables {
  itemId: number;
  text?: string | null;
}
