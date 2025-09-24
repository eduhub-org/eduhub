/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CreateLocationAddress
// ====================================================

export interface CreateLocationAddress_insert_LocationAddress_one {
  __typename: "LocationAddress";
  id: number;
  /**
   * Concise label shown in lists and typeahead (e.g., "Room 2.12", "Main Building").
   */
  shortLabel: string;
  /**
   * Full human-readable address (street, building, room number, etc.).
   */
  address: string;
}

export interface CreateLocationAddress {
  /**
   * insert a single row into the table: "LocationAddress"
   */
  insert_LocationAddress_one: CreateLocationAddress_insert_LocationAddress_one | null;
}

export interface CreateLocationAddressVariables {
  value: string;
  locationOptionId: LocationOption_enum;
}
