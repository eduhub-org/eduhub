/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DisableRausgegangenListings
// ====================================================

export interface DisableRausgegangenListings_update_RausgegangenListing {
  __typename: "RausgegangenListing_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DisableRausgegangenListings {
  /**
   * update data of the table: "RausgegangenListing"
   */
  update_RausgegangenListing: DisableRausgegangenListings_update_RausgegangenListing | null;
}

export interface DisableRausgegangenListingsVariables {
  courseIds: number[];
}
