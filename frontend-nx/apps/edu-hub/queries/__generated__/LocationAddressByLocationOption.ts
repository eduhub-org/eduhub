/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: LocationAddressByLocationOption
// ====================================================

export interface LocationAddressByLocationOption_LocationAddress {
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
  /**
   * JSON array of alias strings used for autocomplete filtering and search.
   */
  aliases: any | null;
}

export interface LocationAddressByLocationOption {
  /**
   * fetch data from the table: "LocationAddress"
   */
  LocationAddress: LocationAddressByLocationOption_LocationAddress[];
}

export interface LocationAddressByLocationOptionVariables {
  locationOptionId: LocationOption_enum;
  searchFilter?: string | null;
}
