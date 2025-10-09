/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: LocationAddressesByIds
// ====================================================

export interface LocationAddressesByIds_LocationAddress {
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
   * Foreign key to LocationOption. Each address must belong to exactly one location option.
   */
  locationOptionId: LocationOption_enum;
}

export interface LocationAddressesByIds {
  /**
   * fetch data from the table: "LocationAddress"
   */
  LocationAddress: LocationAddressesByIds_LocationAddress[];
}

export interface LocationAddressesByIdsVariables {
  ids: number[];
}
