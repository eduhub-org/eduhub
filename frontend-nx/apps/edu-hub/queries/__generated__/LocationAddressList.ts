/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationAddress_bool_exp, LocationAddress_order_by, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: LocationAddressList
// ====================================================

export interface LocationAddressList_LocationAddress_LocationOption {
  __typename: "LocationOption";
  value: string;
  comment: string | null;
}

export interface LocationAddressList_LocationAddress_SessionAddresses_aggregate_aggregate {
  __typename: "SessionAddress_aggregate_fields";
  count: number;
}

export interface LocationAddressList_LocationAddress_SessionAddresses_aggregate {
  __typename: "SessionAddress_aggregate";
  aggregate: LocationAddressList_LocationAddress_SessionAddresses_aggregate_aggregate | null;
}

export interface LocationAddressList_LocationAddress {
  __typename: "LocationAddress";
  id: number;
  /**
   * Foreign key to LocationOption. Each address must belong to exactly one location option.
   */
  locationOptionId: LocationOption_enum;
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
  created_at: any;
  updated_at: any;
  /**
   * An object relationship
   */
  LocationOption: LocationAddressList_LocationAddress_LocationOption;
  /**
   * An aggregate relationship
   */
  SessionAddresses_aggregate: LocationAddressList_LocationAddress_SessionAddresses_aggregate;
}

export interface LocationAddressList_LocationAddress_aggregate_aggregate {
  __typename: "LocationAddress_aggregate_fields";
  count: number;
}

export interface LocationAddressList_LocationAddress_aggregate {
  __typename: "LocationAddress_aggregate";
  aggregate: LocationAddressList_LocationAddress_aggregate_aggregate | null;
}

export interface LocationAddressList_LocationOption {
  __typename: "LocationOption";
  value: string;
  comment: string | null;
}

export interface LocationAddressList {
  /**
   * fetch data from the table: "LocationAddress"
   */
  LocationAddress: LocationAddressList_LocationAddress[];
  /**
   * fetch aggregated fields from the table: "LocationAddress"
   */
  LocationAddress_aggregate: LocationAddressList_LocationAddress_aggregate;
  /**
   * fetch data from the table: "LocationOption"
   */
  LocationOption: LocationAddressList_LocationOption[];
}

export interface LocationAddressListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: LocationAddress_bool_exp | null;
  order_by?: LocationAddress_order_by[] | null;
}
