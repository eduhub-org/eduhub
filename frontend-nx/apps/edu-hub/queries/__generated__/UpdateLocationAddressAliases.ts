/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressAliases
// ====================================================

export interface UpdateLocationAddressAliases_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * JSON array of alias strings used for autocomplete filtering and search.
   */
  aliases: any | null;
}

export interface UpdateLocationAddressAliases {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressAliases_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressAliasesVariables {
  id: number;
  tags: any;
}
