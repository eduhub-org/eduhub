/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SearchRausgegangenLocations
// ====================================================

export interface SearchRausgegangenLocations_searchRausgegangenLocations_locations {
  __typename: "RausgegangenLocation";
  id: string;
  title: string;
  street: string | null;
  zipCode: string | null;
  city: string | null;
}

export interface SearchRausgegangenLocations_searchRausgegangenLocations {
  __typename: "SearchRausgegangenLocationsResult";
  success: boolean;
  error: string | null;
  locations: SearchRausgegangenLocations_searchRausgegangenLocations_locations[];
}

export interface SearchRausgegangenLocations {
  /**
   * Searches rausgegangen.de for venues matching a location address, so it can be linked instead of duplicated. Admin only.
   */
  searchRausgegangenLocations: SearchRausgegangenLocations_searchRausgegangenLocations;
}

export interface SearchRausgegangenLocationsVariables {
  locationAddressId: number;
}
