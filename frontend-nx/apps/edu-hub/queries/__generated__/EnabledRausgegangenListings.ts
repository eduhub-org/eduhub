/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: EnabledRausgegangenListings
// ====================================================

export interface EnabledRausgegangenListings_RausgegangenListing {
  __typename: "RausgegangenListing";
  id: number;
  courseId: number;
}

export interface EnabledRausgegangenListings {
  /**
   * fetch data from the table: "RausgegangenListing"
   */
  RausgegangenListing: EnabledRausgegangenListings_RausgegangenListing[];
}

export interface EnabledRausgegangenListingsVariables {
  courseIds: number[];
}
