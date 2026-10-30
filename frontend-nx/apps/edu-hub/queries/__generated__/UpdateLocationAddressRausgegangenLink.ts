/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressRausgegangenLink
// ====================================================

export interface UpdateLocationAddressRausgegangenLink_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * UUID of the matching location on rausgegangen.de, linked or created by the event sync
   */
  rausgegangenLocationId: string | null;
  rausgegangenLocationOwned: boolean;
}

export interface UpdateLocationAddressRausgegangenLink {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressRausgegangenLink_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressRausgegangenLinkVariables {
  id: number;
  rausgegangenLocationId?: string | null;
}
