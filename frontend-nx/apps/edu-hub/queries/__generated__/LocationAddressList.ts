/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationAddress_bool_exp, LocationAddress_order_by, LocationOption_enum, LocationAddressCategory_enum } from "./../../__generated__/globalTypes";

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

export interface LocationAddressList_LocationAddress_CourseLocations_aggregate_aggregate {
  __typename: "CourseLocation_aggregate_fields";
  count: number;
}

export interface LocationAddressList_LocationAddress_CourseLocations_aggregate {
  __typename: "CourseLocation_aggregate";
  aggregate: LocationAddressList_LocationAddress_CourseLocations_aggregate_aggregate | null;
}

export interface LocationAddressList_LocationAddress {
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
  /**
   * Street and house number
   */
  street: string | null;
  zipCode: string | null;
  city: string | null;
  country: string | null;
  addressAdditionalInfo: string | null;
  directions: string | null;
  accessibilityInfo: string | null;
  latitude: any | null;
  longitude: any | null;
  category: LocationAddressCategory_enum | null;
  image: string | null;
  imageCredits: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  instagramUrl: string | null;
  /**
   * UUID of the matching location on rausgegangen.de, linked or created by the event sync
   */
  rausgegangenLocationId: string | null;
  rausgegangenLocationOwned: boolean;
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
  /**
   * An aggregate relationship
   */
  CourseLocations_aggregate: LocationAddressList_LocationAddress_CourseLocations_aggregate;
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

export interface LocationAddressList_LocationAddressCategory {
  __typename: "LocationAddressCategory";
  value: string;
}

export interface LocationAddressList_RausgegangenOrganizations_aggregate {
  __typename: "Organization_aggregate_fields";
  count: number;
}

export interface LocationAddressList_RausgegangenOrganizations {
  __typename: "Organization_aggregate";
  aggregate: LocationAddressList_RausgegangenOrganizations_aggregate | null;
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
  /**
   * fetch data from the table: "LocationAddressCategory"
   */
  LocationAddressCategory: LocationAddressList_LocationAddressCategory[];
  /**
   * fetch aggregated fields from the table: "Organization"
   */
  RausgegangenOrganizations: LocationAddressList_RausgegangenOrganizations;
}

export interface LocationAddressListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: LocationAddress_bool_exp | null;
  order_by?: LocationAddress_order_by[] | null;
}
