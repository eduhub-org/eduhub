/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressImage
// ====================================================

export interface UpdateLocationAddressImage_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  image: string | null;
}

export interface UpdateLocationAddressImage {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressImage_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressImageVariables {
  id: number;
  image?: string | null;
}
