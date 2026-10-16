/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressWebsiteUrl
// ====================================================

export interface UpdateLocationAddressWebsiteUrl_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  websiteUrl: string | null;
}

export interface UpdateLocationAddressWebsiteUrl {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressWebsiteUrl_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressWebsiteUrlVariables {
  itemId: number;
  text?: string | null;
}
