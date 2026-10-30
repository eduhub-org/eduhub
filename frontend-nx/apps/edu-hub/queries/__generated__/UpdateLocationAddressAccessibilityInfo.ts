/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressAccessibilityInfo
// ====================================================

export interface UpdateLocationAddressAccessibilityInfo_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  accessibilityInfo: string | null;
}

export interface UpdateLocationAddressAccessibilityInfo {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressAccessibilityInfo_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressAccessibilityInfoVariables {
  itemId: number;
  text?: string | null;
}
