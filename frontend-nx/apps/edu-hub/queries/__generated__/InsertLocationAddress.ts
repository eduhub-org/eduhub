/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationAddress_insert_input, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertLocationAddress
// ====================================================

export interface InsertLocationAddress_insert_LocationAddress_one {
  __typename: "LocationAddress";
  id: number;
  /**
   * Foreign key to LocationOption. Each address must belong to exactly one location option.
   */
  locationOption: LocationOption_enum;
  /**
   * Concise label shown in lists and typeahead (e.g., "Room 2.12", "Main Building").
   */
  shortLabel: string;
  /**
   * Full human-readable address (street, building, room number, etc.).
   */
  address: string;
  /**
   * Optional notes or additional information about the location.
   */
  description: string | null;
  /**
   * JSON array of alias strings used for autocomplete filtering and search.
   */
  aliases: any | null;
}

export interface InsertLocationAddress {
  /**
   * insert a single row into the table: "LocationAddress"
   */
  insert_LocationAddress_one: InsertLocationAddress_insert_LocationAddress_one | null;
}

export interface InsertLocationAddressVariables {
  insertInput: LocationAddress_insert_input;
}
