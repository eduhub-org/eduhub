/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressLocationOption
// ====================================================

export interface UpdateLocationAddressLocationOption_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  /**
   * Foreign key to LocationOption. Each address must belong to exactly one location option.
   */
  locationOptionId: LocationOption_enum;
}

export interface UpdateLocationAddressLocationOption {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressLocationOption_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressLocationOptionVariables {
  id: number;
  value: LocationOption_enum;
}
