/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressShortLabel
// ====================================================

export interface UpdateLocationAddressShortLabel_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * Concise label shown in lists and typeahead (e.g., "Room 2.12", "Main Building").
   */
  shortLabel: string;
}

export interface UpdateLocationAddressShortLabel {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressShortLabel_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressShortLabelVariables {
  itemId: number;
  text: string;
}
