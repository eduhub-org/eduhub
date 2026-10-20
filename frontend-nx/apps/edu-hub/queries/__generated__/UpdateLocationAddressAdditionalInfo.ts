/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressAdditionalInfo
// ====================================================

export interface UpdateLocationAddressAdditionalInfo_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  addressAdditionalInfo: string | null;
}

export interface UpdateLocationAddressAdditionalInfo {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressAdditionalInfo_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressAdditionalInfoVariables {
  itemId: number;
  text?: string | null;
}
