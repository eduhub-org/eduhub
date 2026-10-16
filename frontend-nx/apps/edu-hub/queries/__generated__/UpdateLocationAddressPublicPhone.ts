/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressPublicPhone
// ====================================================

export interface UpdateLocationAddressPublicPhone_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  publicPhone: string | null;
}

export interface UpdateLocationAddressPublicPhone {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressPublicPhone_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressPublicPhoneVariables {
  itemId: number;
  text?: string | null;
}
