/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: LocationAddressesForFeed
// ====================================================

export interface LocationAddressesForFeed_LocationAddress {
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
  /**
   * Foreign key to LocationOption. Each address must belong to exactly one location option.
   */
  locationOption: LocationOption_enum;
}

export interface LocationAddressesForFeed {
  /**
   * fetch data from the table: "LocationAddress"
   */
  LocationAddress: LocationAddressesForFeed_LocationAddress[];
}
