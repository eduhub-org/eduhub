/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressDirections
// ====================================================

export interface UpdateLocationAddressDirections_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  directions: string | null;
}

export interface UpdateLocationAddressDirections {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressDirections_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressDirectionsVariables {
  itemId: number;
  text?: string | null;
}
