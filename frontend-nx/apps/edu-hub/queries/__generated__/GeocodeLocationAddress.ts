/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: GeocodeLocationAddress
// ====================================================

export interface GeocodeLocationAddress_geocodeLocationAddress {
  __typename: "GeocodeLocationAddressResult";
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
  error: string | null;
}

export interface GeocodeLocationAddress {
  /**
   * Looks up and stores latitude/longitude of a location address from its street, zip code and city (OpenStreetMap Nominatim). Admin only.
   */
  geocodeLocationAddress: GeocodeLocationAddress_geocodeLocationAddress;
}

export interface GeocodeLocationAddressVariables {
  locationAddressId: number;
}
