/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationAddress_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressFields
// ====================================================

export interface UpdateLocationAddressFields_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
}

export interface UpdateLocationAddressFields {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressFields_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressFieldsVariables {
  id: number;
  changes: LocationAddress_set_input;
}
