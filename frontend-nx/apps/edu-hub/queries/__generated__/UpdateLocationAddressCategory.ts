/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationAddressCategory_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateLocationAddressCategory
// ====================================================

export interface UpdateLocationAddressCategory_update_LocationAddress_by_pk {
  __typename: "LocationAddress";
  id: number;
  category: LocationAddressCategory_enum | null;
}

export interface UpdateLocationAddressCategory {
  /**
   * update single row of the table: "LocationAddress"
   */
  update_LocationAddress_by_pk: UpdateLocationAddressCategory_update_LocationAddress_by_pk | null;
}

export interface UpdateLocationAddressCategoryVariables {
  id: number;
  value?: LocationAddressCategory_enum | null;
}
